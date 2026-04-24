/**
 * RSS Feed Scraper
 * Fetches and normalizes articles from RSS/Atom feeds.
 */

const Parser = require('rss-parser');
const logger = require('../utils/logger');

const rssParser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'SamacharDaily-Scraper/1.0 (+https://samachardaily.app)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content',    'mediaContent'],
      ['media:thumbnail',  'mediaThumbnail'],
      ['enclosure',        'enclosure'],
      ['dc:creator',       'dcCreator'],
      ['content:encoded',  'contentEncoded'],
    ],
  },
});

/**
 * Extract the best thumbnail URL from an RSS item
 */
const decodeHtmlEntities = (str = '') =>
  String(str)
    .replace(/&amp;/gi, '&')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#47;/gi, '/');

const stripUrlParamsForImageMatch = (url = '') => {
  const cleaned = String(url).split('?')[0];
  return cleaned;
};

const looksLikeImageUrl = (url = '') => {
  const cleaned = stripUrlParamsForImageMatch(url);
  return /\.(jpe?g|png|webp|gif|avif)$/i.test(cleaned);
};

const extractThumbnail = (item) => {
  // 1. media:content with url
  if (item.mediaContent) {
    const mc = Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent;
    const url = mc?.$ ?.url || mc?.url;
    if (url) return url;
  }
  // 2. media:thumbnail
  if (item.mediaThumbnail) {
    const mt = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail[0] : item.mediaThumbnail;
    const url = mt?.$ ?.url || mt?.url;
    if (url) return url;
  }
  // 3. enclosure
  if (item.enclosure?.url && looksLikeImageUrl(item.enclosure.url)) {
    return item.enclosure.url;
  }

  // 4. Parse first usable image-like URL from content/description HTML
  const raw = decodeHtmlEntities(item.contentEncoded || item.content || item.description || '');

  // Prefer src= first
  const srcMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (srcMatch && looksLikeImageUrl(srcMatch[1])) return srcMatch[1];

  // Fallback to data-src=
  const dataSrcMatch = raw.match(/<img[^>]+data-src=["']([^"']+)["']/i);
  if (dataSrcMatch && looksLikeImageUrl(dataSrcMatch[1])) return dataSrcMatch[1];

  // Fallback to srcset= (pick first candidate)
  const srcsetMatch = raw.match(/<img[^>]+srcset=["']([^"']+)["']/i);
  if (srcsetMatch) {
    const first = srcsetMatch[1].split(',')[0]?.trim().split(' ')[0];
    if (first && looksLikeImageUrl(first)) return first;
  }

  // Last resort: any image URL in the HTML fragment
  const genericImgUrl = raw.match(/https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^\s"']*)?/i);
  if (genericImgUrl) return genericImgUrl[0];

  return null;
};

/**
 * Extract clean text content from RSS item
 */
const extractContent = (item) => {
  // Prefer full content:encoded, fallback to description
  const raw = item.contentEncoded || item.content || item.description || '';
  return raw
    .replace(/<[^>]+>/g, ' ')     // strip HTML tags
    .replace(/\s{2,}/g, ' ')      // collapse whitespace
    .trim()
    .substring(0, 5000);           // cap at 5000 chars
};

/**
 * Scrape a single RSS feed source
 * @param {Object} source - Source config from sources/index.js
 * @returns {Promise<Array>} - Normalized article objects
 */
const scrapeRSSSource = async (source) => {
  const { name, url, language, category } = source;
  try {
    const feed = await rssParser.parseURL(url);
    const articles = (feed.items || [])
      .filter(item => item.title && item.link)
      .map(item => ({
        title:        (item.title || '').trim().replace(/\s+/g, ' '),
        summary:      item.contentSnippet || item.summary || '',
        content:      extractContent(item),
        source_url:   item.link,
        thumbnail_url: extractThumbnail(item),
        author:       item.dcCreator || item.creator || item.author || null,
        published_at: item.pubDate || item.isoDate
          ? new Date(item.pubDate || item.isoDate)
          : new Date(),
        source_name:  name,
        language,
        category_slug: category,
        provider:     'rss',
      }));

    logger.info(`[RSS] ${name} (${language}) → ${articles.length} articles from ${url}`);
    return articles;
  } catch (err) {
    logger.warn(`[RSS] FAILED ${name} (${url}): ${err.message}`);
    return [];
  }
};

/**
 * Scrape multiple RSS sources in parallel (with concurrency limit)
 * @param {Array} sources
 * @param {number} concurrency
 */
const scrapeRSSSources = async (sources, concurrency = 5) => {
  const results = [];
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(scrapeRSSSource));
    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.push(...r.value);
    }
  }
  return results;
};

module.exports = { scrapeRSSSource, scrapeRSSSources };

