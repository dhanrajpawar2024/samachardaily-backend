/**
 * Main Scrape Job
 * ─────────────────────────────────────────────────────────────────
 * 1. Fetch articles from all RSS sources (per-language batches)
 * 2. Optionally enrich short articles with Cheerio full-content fetch
 * 3. Deduplicate against existing DB records (Redis L1 + Postgres L2)
 * 4. Insert new articles into PostgreSQL
 * 5. Publish article IDs to Kafka (new-article topic) for real-time delivery
 * 6. Update ingestion stats in Redis
 */

const { v4: uuidv4 } = require('uuid');
const { ALL_SOURCES } = require('../sources');
const { scrapeRSSSources } = require('../scrapers/rss');
const { enrichArticles } = require('../scrapers/web');
const { filterDuplicates, markSeen } = require('../utils/dedup');
const { normalizeArticle } = require('../utils/normalize');
const { query, getOne } = require('../db/postgres');
const { set: redisSet } = require('../db/redis');
const logger = require('../utils/logger');
const kafka = require('../kafka/producer');

// Max articles to enrich per run (to avoid slow runs)
const MAX_ENRICH = parseInt(process.env.MAX_ENRICH_PER_RUN || '100');
// Max total articles to ingest per run
const MAX_INGEST = parseInt(process.env.MAX_INGEST_PER_RUN || '500');
// Enable full-content enrichment
const ENABLE_ENRICHMENT = process.env.ENABLE_CONTENT_ENRICHMENT !== 'false';

/** Cache of category_id per slug+language to avoid repeated DB lookups */
const categoryCache = new Map();

const getCategoryId = async (slug, language) => {
  const key = `${slug}:${language}`;
  if (categoryCache.has(key)) return categoryCache.get(key);

  // Try exact language match first, then fallback to 'en'
  let rec = await getOne(
    'SELECT id FROM categories WHERE slug = $1 AND language = $2 LIMIT 1',
    [slug, language]
  );
  if (!rec) {
    rec = await getOne(
      'SELECT id FROM categories WHERE slug = $1 AND language = $2 LIMIT 1',
      [slug, 'en']
    );
  }
  if (!rec) {
    rec = await getOne(
      "SELECT id FROM categories WHERE slug = 'top-stories' LIMIT 1",
      []
    );
  }
  const id = rec?.id || null;
  if (id) categoryCache.set(key, id);
  return id;
};

const storeArticle = async (article) => {
  const {
    title, summary, content, source_url, thumbnail_url,
    author, published_at, source_name, language, category_slug,
  } = article;

  if (!title || !source_url) return null;

  const categoryId = await getCategoryId(category_slug || 'top-stories', language || 'en');
  if (!categoryId) {
    logger.warn(`[Job] No category for ${category_slug}/${language}`);
    return null;
  }

  const id = uuidv4();
  try {
    const result = await query(
      `INSERT INTO articles (
         id, category_id, title, summary, content, thumbnail_url,
         source_url, author, source_name, language,
         published_at, is_published, is_breaking, trending_score,
         view_count, like_count, share_count, is_premium,
         created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,false,0,0,0,0,false,NOW(),NOW()
       )
       ON CONFLICT (source_url) DO UPDATE SET
         thumbnail_url = COALESCE(articles.thumbnail_url, EXCLUDED.thumbnail_url),
         summary = CASE
           WHEN LENGTH(COALESCE(articles.summary, '')) < LENGTH(COALESCE(EXCLUDED.summary, ''))
             THEN EXCLUDED.summary
           ELSE articles.summary
         END,
         content = CASE
           WHEN LENGTH(COALESCE(articles.content, '')) < LENGTH(COALESCE(EXCLUDED.content, ''))
             THEN EXCLUDED.content
           ELSE articles.content
         END,
         updated_at = NOW()
       RETURNING id, title`,
      [id, categoryId, title, summary || '', content || '',
       thumbnail_url || null, source_url, author || null,
       source_name, language || 'en', published_at]
    );
    return result.rows[0] || null;
  } catch (err) {
    logger.error(`[Job] Insert error: ${err.message}`, { source_url });
    return null;
  }
};

/**
 * Run the full scrape cycle
 * @param {Object} opts - Optional filter { languages?: string[], categories?: string[] }
 */
const runScrapeJob = async (opts = {}) => {
  const startTime = Date.now();
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('[Job] Starting scrape cycle...');

  let sources = ALL_SOURCES;
  if (opts.languages?.length) {
    sources = sources.filter(s => opts.languages.includes(s.language));
  }
  if (opts.categories?.length) {
    sources = sources.filter(s => opts.categories.includes(s.category));
  }

  const rssSources = sources.filter(s => s.type === 'rss');
  logger.info(`[Job] Scraping ${rssSources.length} RSS sources`);

  // Step 1: Fetch all RSS feeds
  let articles = await scrapeRSSSources(rssSources, parseInt(process.env.RSS_CONCURRENCY || '8'));
  logger.info(`[Job] Total raw articles fetched: ${articles.length}`);

  // Step 2: Normalize
  articles = articles.map(normalizeArticle);

  // Step 3: Deduplicate
  articles = await filterDuplicates(articles);

  // Step 4: Limit per run
  if (articles.length > MAX_INGEST) {
    logger.info(`[Job] Capping to ${MAX_INGEST} articles (was ${articles.length})`);
    articles = articles.slice(0, MAX_INGEST);
  }

  // Step 5: Enrich content (optional, up to MAX_ENRICH articles)
  if (ENABLE_ENRICHMENT && articles.length > 0) {
    const toEnrich = articles.slice(0, MAX_ENRICH);
    await enrichArticles(toEnrich, parseInt(process.env.ENRICH_CONCURRENCY || '3'));
  }

  // Step 6: Store to DB + publish to Kafka
  let ingested = 0;
  let failed = 0;
  const newArticleIds = [];

  for (const article of articles) {
    const stored = await storeArticle(article);
    if (stored) {
      await markSeen(article.source_url);
      newArticleIds.push(stored.id);
      ingested++;
    } else {
      failed++;
    }
  }

  // Step 7: Publish new article IDs to Kafka
  if (newArticleIds.length > 0) {
    await kafka.publishNewArticles(newArticleIds).catch(err =>
      logger.warn(`[Job] Kafka publish failed: ${err.message}`)
    );
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const stats = {
    timestamp: new Date().toISOString(),
    duration_seconds: parseFloat(duration),
    sources: rssSources.length,
    fetched: articles.length + /* duplicates already filtered */ 0,
    ingested,
    failed,
    new_article_ids_count: newArticleIds.length,
  };

  await redisSet('scraper:last_run', stats, 60 * 60);

  logger.info(`[Job] ✅ Done in ${duration}s — ${ingested} ingested, ${failed} failed`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return stats;
};

module.exports = { runScrapeJob };

