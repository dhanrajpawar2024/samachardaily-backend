/**
 * Save videos to PostgreSQL.
 * Uses WHERE NOT EXISTS to skip duplicates based on video_url.
 */

const { pool } = require('./postgres');
const logger = require('../utils/logger');

/** Simple in-process cache for category_id lookups */
const categoryCache = new Map();

async function getCategoryId(slug, language) {
  const key = `${slug}:${language}`;
  if (categoryCache.has(key)) return categoryCache.get(key);

  let result = await pool.query(
    'SELECT id FROM categories WHERE slug = $1 AND language = $2 LIMIT 1',
    [slug, language]
  );
  if (!result.rows.length) {
    result = await pool.query(
      "SELECT id FROM categories WHERE slug = $1 LIMIT 1",
      [slug]
    );
  }
  const id = result.rows[0]?.id || null;
  if (id) categoryCache.set(key, id);
  return id;
}

/**
 * Insert an array of video objects into the `videos` table.
 * Skips any video whose video_url already exists.
 *
 * @param {Array} videos - Raw video objects from youtube scraper
 * @returns {{ saved: number, skipped: number, errors: number }}
 */
async function saveVideos(videos) {
  let saved = 0, skipped = 0, errors = 0;

  for (const v of videos) {
    try {
      const categoryId = await getCategoryId(v.category_slug, v.language);

      const result = await pool.query(
        `INSERT INTO videos
           (title, description, video_url, thumbnail_url, author_name,
            language, category_id, published_at, duration_ms)
         SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
         WHERE NOT EXISTS (
           SELECT 1 FROM videos WHERE video_url = $3
         )`,
        [
          v.title,
          v.description,
          v.video_url,
          v.thumbnail_url,
          v.author_name,
          v.language,
          categoryId,
          v.published_at,
          v.duration_ms,
        ]
      );

      if (result.rowCount > 0) saved++;
      else skipped++;
    } catch (err) {
      errors++;
      logger.error(`[SaveVideo] Failed to save "${v.title}": ${err.message}`);
    }
  }

  return { saved, skipped, errors };
}

module.exports = { saveVideos };
