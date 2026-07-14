/**
 * Trending Score Updater Job
 * ─────────────────────────────────────────────────────────────────
 * Recalculates trending_score for articles based on:
 *   - view_count  × 1.0
 *   - like_count  × 2.0
 *   - share_count × 3.0
 *   - Time decay: score × e^(-λ × hours_since_publish)
 *     where λ = 0.1 (half-life ≈ 7 hours)
 *
 * Only considers articles published in the last 48 hours.
 * Runs every 15 minutes via cron.
 */

const { query } = require('../db/postgres');
const { set: redisSet, del: redisDel } = require('../db/redis');
const logger = require('../utils/logger');

const DECAY_LAMBDA = parseFloat(process.env.TRENDING_DECAY_LAMBDA || '0.1');
const WINDOW_HOURS = parseInt(process.env.TRENDING_WINDOW_HOURS || '48');
const TOP_N = parseInt(process.env.TRENDING_TOP_N || '20');

const runTrendingJob = async () => {
  logger.info('[Trending] Updating trending scores...');
  const start = Date.now();

  try {
    // Update trending_score for recent articles using time-decay formula
    const updateResult = await query(
      `UPDATE articles
       SET
         trending_score = ROUND(
           (
             (COALESCE(view_count,  0) * 1.0) +
             (COALESCE(like_count,  0) * 2.0) +
             (COALESCE(share_count, 0) * 3.0)
           ) * EXP(
             -$1 * EXTRACT(EPOCH FROM (NOW() - published_at)) / 3600.0
           )
         ),
         updated_at = NOW()
       WHERE
         published_at > NOW() - INTERVAL '1 second' * $2
         AND is_published = true
       RETURNING id`,
      [DECAY_LAMBDA, WINDOW_HOURS * 3600]
    );

    const updatedCount = updateResult.rowCount;
    logger.info(`[Trending] Updated ${updatedCount} article scores`);

    // Invalidate trending caches in Redis (feed-service caches keyed by lang)
    const langs = ['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'pa', 'ml'];
    await Promise.allSettled(
      langs.map(lang => redisDel(`trending:${lang}`))
    );

    // Cache the top trending article IDs per language for quick reads
    for (const lang of langs) {
      const topArticles = await query(
        `SELECT id, title, source_name, trending_score, thumbnail_url
         FROM articles
         WHERE language = $1
           AND is_published = true
           AND published_at > NOW() - INTERVAL '1 second' * $2
         ORDER BY trending_score DESC
         LIMIT $3`,
        [lang, WINDOW_HOURS * 3600, TOP_N]
      );
      if (topArticles.rows.length > 0) {
        await redisSet(`trending:${lang}`, topArticles.rows, 60 * 15); // 15-min cache
      }
    }

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    logger.info(`[Trending] Done in ${duration}s`);
    return { updatedCount, duration };
  } catch (err) {
    logger.error(`[Trending] Job failed: ${err.message}`);
    return { updatedCount: 0, error: err.message };
  }
};

module.exports = { runTrendingJob };

