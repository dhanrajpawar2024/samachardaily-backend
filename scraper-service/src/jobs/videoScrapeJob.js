/**
 * Video Scrape Job
 * Iterates all YouTube channel sources, fetches their RSS feeds,
 * and upserts new videos into the `videos` table.
 */

const { scrapeYouTubeChannel } = require('../scrapers/youtube');
const { saveVideos }            = require('../db/saveVideo');
const VIDEO_SOURCES             = require('../sources/videoSources');
const logger                    = require('../utils/logger');

async function runVideoScrapeJob() {
  logger.info(`[VideoScraper] Starting — ${VIDEO_SOURCES.length} channels`);

  let totalSaved = 0, totalSkipped = 0, totalErrors = 0;

  for (const source of VIDEO_SOURCES) {
    try {
      const videos = await scrapeYouTubeChannel(source);
      const { saved, skipped, errors } = await saveVideos(videos);

      totalSaved   += saved;
      totalSkipped += skipped;
      totalErrors  += errors;

      logger.info(
        `[VideoScraper] ${source.name} (${source.language}): ` +
        `${videos.length} fetched, +${saved} new, ${skipped} dupes`
      );
    } catch (err) {
      totalErrors++;
      logger.error(`[VideoScraper] ${source.name} failed: ${err.message}`);
    }
  }

  const summary = {
    sources:  VIDEO_SOURCES.length,
    saved:    totalSaved,
    skipped:  totalSkipped,
    errors:   totalErrors,
    ran_at:   new Date().toISOString(),
  };

  logger.info(`[VideoScraper] Done — ${totalSaved} saved, ${totalSkipped} skipped, ${totalErrors} errors`);
  return summary;
}

module.exports = { runVideoScrapeJob };
