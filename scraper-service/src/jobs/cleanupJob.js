/**
 * Cleanup Job
 * ─────────────────────────────────────────────────────────────────
 * Runs daily to:
 *   1. Delete unpublished articles older than 30 days
 *   2. Archive (mark is_published=false) articles older than 7 days with 0 views
 *   3. Vacuum analyze the articles table for performance
 */

const { query } = require('../db/postgres');
const logger = require('../utils/logger');

const ARCHIVE_DAYS     = parseInt(process.env.CLEANUP_ARCHIVE_DAYS    || '7');
const DELETE_DAYS      = parseInt(process.env.CLEANUP_DELETE_DAYS     || '30');

const runCleanupJob = async () => {
  logger.info('[Cleanup] Starting daily cleanup...');
  const start = Date.now();

  try {
    // Archive zero-view articles older than ARCHIVE_DAYS
    const archiveResult = await query(
      `UPDATE articles
       SET is_published = false, updated_at = NOW()
       WHERE is_published = true
         AND view_count = 0
         AND published_at < NOW() - INTERVAL '${ARCHIVE_DAYS} days'`
    );
    logger.info(`[Cleanup] Archived ${archiveResult.rowCount} zero-view articles`);

    // Delete old archived articles
    const deleteResult = await query(
      `DELETE FROM articles
       WHERE is_published = false
         AND published_at < NOW() - INTERVAL '${DELETE_DAYS} days'`
    );
    logger.info(`[Cleanup] Deleted ${deleteResult.rowCount} old articles`);

    // Vacuum analyze (needs superuser in production, skip gracefully)
    try {
      await query('VACUUM ANALYZE articles');
      logger.info('[Cleanup] VACUUM ANALYZE complete');
    } catch (_) {
      logger.warn('[Cleanup] VACUUM skipped (needs superuser)');
    }

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    logger.info(`[Cleanup] Done in ${duration}s`);
    return {
      archived: archiveResult.rowCount,
      deleted: deleteResult.rowCount,
      duration,
    };
  } catch (err) {
    logger.error(`[Cleanup] Job failed: ${err.message}`);
    return { error: err.message };
  }
};

module.exports = { runCleanupJob };

