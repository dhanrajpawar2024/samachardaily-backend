/**
 * Deduplication utilities
 * Prevents storing the same article twice.
 */

const crypto = require('crypto');
const { getOne, query } = require('../db/postgres');
const { get: redisGet, set: redisSet } = require('../db/redis');
const logger = require('./logger');

const CACHE_TTL = 60 * 60 * 6; // 6 hours

/**
 * Create a stable hash for a URL (used as Redis cache key)
 */
const urlHash = (url) =>
  crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex').slice(0, 16);

/**
 * Check if an article URL has already been ingested
 * Uses Redis L1 cache → Postgres L2 for speed
 */
const isDuplicate = async (sourceUrl) => {
  if (!sourceUrl) return true;
  const key = `dedup:${urlHash(sourceUrl)}`;
  try {
    const cached = await redisGet(key);
    if (cached !== null) return true;

    const existing = await getOne(
      'SELECT id FROM articles WHERE source_url = $1 LIMIT 1',
      [sourceUrl]
    );
    if (existing) {
      await redisSet(key, '1', CACHE_TTL);
      return true;
    }
    return false;
  } catch (err) {
    logger.warn(`[Dedup] Check failed for ${sourceUrl}: ${err.message}`);
    return false; // allow ingestion on error
  }
};

/**
 * Mark a URL as seen in Redis (after successful DB insert)
 */
const markSeen = async (sourceUrl) => {
  const key = `dedup:${urlHash(sourceUrl)}`;
  await redisSet(key, '1', CACHE_TTL).catch(() => {});
};

/**
 * Filter a list of articles, removing duplicates.
 * Returns only articles that need to be inserted.
 */
const filterDuplicates = async (articles) => {
  const unique = [];
  for (const article of articles) {
    if (!(await isDuplicate(article.source_url))) {
      unique.push(article);
    }
  }
  logger.info(`[Dedup] ${articles.length - unique.length} duplicates removed, ${unique.length} new`);
  return unique;
};

module.exports = { isDuplicate, markSeen, filterDuplicates };

