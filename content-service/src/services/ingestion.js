const axios = require('axios');
const Parser = require('rss-parser');
const { v4: uuidv4 } = require('uuid');
const { query, getOne } = require('../db/postgres');
const { set: redisSet, get: redisGet } = require('../db/redis');

const rssParser = new Parser({
  customFields: {
    item: [['media:content', 'mediaContent']],
  },
});

const inferLanguageFromFeedUrl = (feedUrl = '') => {
  const normalized = feedUrl.toLowerCase();
  if (normalized.includes('hindi') || normalized.includes('/hi') || normalized.includes('lang=hi') || normalized.includes('bhaskar') || normalized.includes('patrika') || normalized.includes('jansatta') || normalized.includes('livehindustan')) return 'hi';
  if (normalized.includes('marathi') || normalized.includes('/mr') || normalized.includes('lang=mr') || normalized.includes('lokmat') || normalized.includes('abplive.com/mr')) return 'mr';
  if (normalized.includes('tamil') || normalized.includes('/ta') || normalized.includes('dinamalar') || normalized.includes('samayam')) return 'ta';
  if (normalized.includes('telugu') || normalized.includes('/te') || normalized.includes('eenadu') || normalized.includes('sakshi') || normalized.includes('andhrajyothy')) return 'te';
  if (normalized.includes('bengali') || normalized.includes('/bn') || normalized.includes('bangla') || normalized.includes('anandabazar')) return 'bn';
  if (normalized.includes('gujarati') || normalized.includes('/gu') || normalized.includes('sandesh') || normalized.includes('divyabhaskar')) return 'gu';
  if (normalized.includes('kannada') || normalized.includes('/kn') || normalized.includes('vijaykarnataka') || normalized.includes('prajavani')) return 'kn';
  if (normalized.includes('punjabi') || normalized.includes('/pa') || normalized.includes('punjabkesari') || normalized.includes('jagbani')) return 'pa';
  return 'en';
};

const normalizeCategorySlug = (slug = 'top-stories') => {
  const normalized = slug.toLowerCase().trim();
  if (!normalized || normalized === 'general' || normalized === 'topstories' || normalized === 'top stories') {
    return 'top-stories';
  }
  return normalized;
};

const inferCategoryFromFeedUrl = (feedUrl = '') => {
  const normalized = feedUrl.toLowerCase();
  if (normalized.includes('india') || normalized.includes('national')) return 'india';
  if (normalized.includes('business')) return 'business';
  if (normalized.includes('tech')) return 'technology';
  if (normalized.includes('sport')) return 'sports';
  if (normalized.includes('health')) return 'health';
  if (normalized.includes('entertainment')) return 'entertainment';
  return 'top-stories';
};

const normalizeSourceName = (feedTitle, feedUrl) => {
  const candidate = (feedTitle || '').trim();
  if (!candidate || ['home', 'rss', 'feed'].includes(candidate.toLowerCase())) {
    try {
      return new URL(feedUrl).hostname.replace(/^www\./, '');
    } catch (_) {
      return candidate || 'Unknown source';
    }
  }
  return candidate;
};

const parseFeedConfig = (rawFeed) => {
  const parts = rawFeed.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      language: parts[0],
      categorySlug: normalizeCategorySlug(parts[1]),
      url: parts.slice(2).join('|'),
    };
  }
  if (parts.length === 2) {
    return {
      language: parts[0],
      categorySlug: inferCategoryFromFeedUrl(parts[1]),
      url: parts[1],
    };
  }
  return {
    language: inferLanguageFromFeedUrl(rawFeed),
    categorySlug: inferCategoryFromFeedUrl(rawFeed),
    url: rawFeed.trim(),
  };
};

/**
 * Fetch articles from NewsAPI
 */
const fetchFromNewsAPI = async (category = 'general', language = 'en') => {
  try {
    const response = await axios.get(`${process.env.NEWSAPI_BASE_URL}/top-headlines`, {
      params: {
        category,
        language,
        apiKey: process.env.NEWSAPI_KEY,
        pageSize: Math.min(parseInt(process.env.MAX_ARTICLES_PER_FETCH || 50), 100),
      },
    });

    return response.data.articles.map(article => ({
      title: article.title,
      summary: article.description,
      content: article.content,
      source_url: article.url,
      thumbnail_url: article.urlToImage,
      author: article.author,
      published_at: new Date(article.publishedAt),
      source_name: article.source.name,
      category_slug: normalizeCategorySlug(category),
      language,
      provider: 'newsapi',
    }));
  } catch (error) {
    console.error(`[NewsAPI] Fetch error for ${category}/${language}:`, error.message);
    return [];
  }
};

/**
 * Fetch articles from RSS feeds
 */
const fetchFromRSSFeeds = async () => {
  const feedConfigs = (process.env.RSS_FEEDS || '').split(',').filter(Boolean).map(parseFeedConfig);
  const articles = [];

  for (const { language, categorySlug, url } of feedConfigs) {
    try {
      const feed = await rssParser.parseURL(url);
      const feedArticles = (feed.items || []).map(item => ({
        title: item.title,
        summary: item.contentSnippet || item.summary,
        content: item.content || item.description,
        source_url: item.link,
        thumbnail_url: item.image?.url || item.mediaContent?.[0]?.$ || null,
        author: item.creator || item.author,
        published_at: new Date(item.pubDate || item.isoDate),
        source_name: normalizeSourceName(feed.title, url),
        category_slug: normalizeCategorySlug(categorySlug || inferCategoryFromFeedUrl(url)),
        language,
        provider: 'rss',
      }));
      articles.push(...feedArticles);
    } catch (error) {
      console.error(`[RSS] Parse error for ${url}:`, error.message);
    }
  }

  return articles;
};

/**
 * Check if article already exists (deduplication)
 */
const articleExists = async (sourceUrl) => {
  const existing = await getOne(
    'SELECT id FROM articles WHERE source_url = $1 LIMIT 1',
    [sourceUrl]
  );
  return !!existing;
};

/**
 * Store article in database
 */
const storeArticle = async (articleData) => {
  const articleId = uuidv4();
  const {
    title,
    summary,
    content,
    source_url,
    thumbnail_url,
    author,
    published_at,
    source_name,
    category_slug,
    language = 'en',
  } = articleData;

  try {
    if (!title || !source_url || !published_at) {
      return null;
    }

    const resolvedCategorySlug = normalizeCategorySlug(category_slug || 'top-stories');

    // Get category ID
    const categoryRecord = await getOne(
      'SELECT id FROM categories WHERE slug = $1 AND language = $2 LIMIT 1',
      [resolvedCategorySlug, language]
    );

    const fallbackCategory = categoryRecord || await getOne(
      'SELECT id FROM categories WHERE slug = $1 AND language = $2 LIMIT 1',
      [resolvedCategorySlug, 'en']
    );

    if (!fallbackCategory) {
      console.warn(`[Content] Category not found: ${resolvedCategorySlug}/${language}`);
      return null;
    }

    const result = await query(
      `INSERT INTO articles (
        id, category_id, title, summary, content, thumbnail_url,
        source_url, author, source_name, language,
        published_at, is_published, is_breaking, trending_score,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING id, title, published_at`,
      [
        articleId,
        fallbackCategory.id,
        title,
        summary,
        content,
        thumbnail_url,
        source_url,
        author,
        source_name,
        language,
        published_at,
        true, // is_published
        false, // is_breaking
        0, // initial trending_score
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[Content] Store article error:', error);
    return null;
  }
};

/**
 * Ingest articles from all sources
 */
const ingestArticles = async () => {
  console.log('[Content] Starting ingestion cycle...');
  
  try {
    // Fetch from all sources
    const [newsApiArticles, rssArticles] = await Promise.all([
      Promise.all(
        ['general', 'business', 'entertainment', 'health', 'science', 'sports', 'technology']
          .map(cat => fetchFromNewsAPI(cat, 'en'))
      ).then(results => results.flat()),
      fetchFromRSSFeeds(),
    ]);

    const allArticles = [...newsApiArticles, ...rssArticles];
    console.log(`[Content] Fetched ${allArticles.length} articles from all sources`);

    let ingested = 0;
    let duplicates = 0;

    // Check and store each article
    for (const article of allArticles) {
      if (await articleExists(article.source_url)) {
        duplicates++;
        continue;
      }

      const stored = await storeArticle(article);
      if (stored) {
        ingested++;
        console.log(`[Content] ✓ Ingested: ${article.title.substring(0, 50)}...`);
      }
    }

    console.log(`[Content] Ingestion complete: ${ingested} new, ${duplicates} duplicates`);
    
    // Cache ingestion stats
    await redisSet('ingestion:stats', {
      timestamp: new Date().toISOString(),
      ingested,
      duplicates,
      total: allArticles.length,
    }, 300);

    return { ingested, duplicates, total: allArticles.length };
  } catch (error) {
    console.error('[Content] Ingestion error:', error);
    return { ingested: 0, duplicates: 0, total: 0, error: error.message };
  }
};

module.exports = {
  fetchFromNewsAPI,
  fetchFromRSSFeeds,
  ingestArticles,
  storeArticle,
  articleExists,
};
