/**
 * Web Content Enricher (Cheerio-based)
 * Fetches full article text when RSS only provides a snippet.
 * Falls back gracefully — never blocks ingestion if it fails.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

const HTTP_TIMEOUT = 12000;
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; SamacharDailyBot/1.0)',
  'Accept-Language': 'en,hi;q=0.9,te;q=0.8,*;q=0.5',
};

/**
 * Generic content selectors tried in order on every page
 */
const GENERIC_SELECTORS = [
  'article .article-body',
  'article .story-body',
  '.article__content',
  '.article-content',
  '.story-content',
  '.entry-content',
  '.post-content',
  '.news-content',
  '.detail-content',
  '[itemprop="articleBody"]',
  '.content-area',
  'article p',
  '.main-content p',
];

/**
 * Site-specific selector overrides keyed by hostname
 */
const SITE_SELECTORS = {
  'www.thehindu.com':        '[class*="articlebodycontent"]',
  'timesofindia.indiatimes.com': '.Normal, ._3YrNV',
  'economictimes.indiatimes.com': '.artText',
  'www.ndtv.com':            '.ins_storybody',
  'www.bhaskar.com':         '.story-detail',
  'www.jagran.com':          '.article-content',
  'www.aajtak.in':           '.storyContent',
  'www.amarujala.com':       '.pg-title + div p',
  'navbharattimes.indiatimes.com': '.normal, ._3YrNV',
};

/**
 * Extract full article text from a URL
 * @param {string} url
 * @returns {Promise<{content:string, thumbnailUrl:string|null}>}
 */
const enrichArticleContent = async (url) => {
  try {
    const { data: html } = await axios.get(url, {
      timeout: HTTP_TIMEOUT,
      headers: HTTP_HEADERS,
      maxRedirects: 5,
    });

    const $ = cheerio.load(html);

    // Remove noise
    $('script, style, nav, footer, header, .ads, .advertisement, .social-share, .related-articles, aside').remove();

    // Determine best selector
    let hostname = '';
    try { hostname = new URL(url).hostname; } catch (_) {}
    const siteSelector = SITE_SELECTORS[hostname];
    const selector = siteSelector || GENERIC_SELECTORS.find(s => $(s).length > 0);

    let content = '';
    if (selector) {
      content = $(selector)
        .map((_, el) => $(el).text().trim())
        .get()
        .join('\n')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .substring(0, 8000);
    }

    // Extract OG image as fallback thumbnail
    const ogImage = $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content') || null;

    return { content, thumbnailUrl: ogImage };
  } catch (err) {
    logger.debug(`[Web] Content fetch failed for ${url}: ${err.message}`);
    return { content: '', thumbnailUrl: null };
  }
};

/**
 * Enrich a batch of articles with full content
 * Only enriches articles where content is too short (< 200 chars)
 * @param {Array} articles
 * @param {number} concurrency
 */
const enrichArticles = async (articles, concurrency = 3) => {
  const needsEnrichment = articles.filter(a =>
    !a.content || a.content.length < 200
  );

  logger.info(`[Web] Enriching ${needsEnrichment.length}/${articles.length} articles`);

  for (let i = 0; i < needsEnrichment.length; i += concurrency) {
    const batch = needsEnrichment.slice(i, i + concurrency);
    await Promise.allSettled(
      batch.map(async (article) => {
        const { content, thumbnailUrl } = await enrichArticleContent(article.source_url);
        if (content && content.length > article.content?.length) {
          article.content = content;
        }
        if (!article.thumbnail_url && thumbnailUrl) {
          article.thumbnail_url = thumbnailUrl;
        }
      })
    );
  }

  return articles;
};

module.exports = { enrichArticleContent, enrichArticles };

