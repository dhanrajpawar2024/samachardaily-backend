/**
 * SamacharDaily — Scraper Service
 * ─────────────────────────────────────────────────────────────────
 * Standalone microservice responsible for:
 *   • Scraping 100+ Indian news sources (10 languages)
 *   • Full-content enrichment via Cheerio
 *   • Deduplication + PostgreSQL storage
 *   • Trending score recalculation
 *   • Kafka publishing for real-time feed delivery
 *
 * Cron Schedule (configurable via env):
 *   CRON_SCRAPE    default: every 30 minutes
 *   CRON_TRENDING  default: every 15 minutes
 *   CRON_CLEANUP   default: daily at 2am
 */

require('dotenv').config();
const express  = require('express');
const cron     = require('node-cron');
const { connect: connectRedis } = require('./db/redis');
const { pool }                  = require('./db/postgres');
const { runScrapeJob }          = require('./jobs/scrapeJob');
const { runTrendingJob }        = require('./jobs/trendingJob');
const { runCleanupJob }         = require('./jobs/cleanupJob');
const { ALL_SOURCES, getSupportedLanguages } = require('./sources');
const { get: redisGet }         = require('./db/redis');
const logger                    = require('./utils/logger');

const app  = express();
const PORT = parseInt(process.env.PORT || '3006');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// ── Health Check ─────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const lastRun = await redisGet('scraper:last_run');
    res.json({
      status: 'healthy',
      service: 'scraper-service',
      timestamp: new Date().toISOString(),
      sources: ALL_SOURCES.length,
      languages: getSupportedLanguages(),
      last_run: lastRun,
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

// ── Manual Trigger Endpoints (for admin/testing) ─────────────────

// Trigger a full scrape now
app.post('/api/v1/scrape', async (req, res) => {
  const { languages, categories } = req.body || {};
  logger.info('[API] Manual scrape triggered');
  try {
    const stats = await runScrapeJob({ languages, categories });
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger trending recalculation now
app.post('/api/v1/trending/recalculate', async (req, res) => {
  logger.info('[API] Manual trending recalculate triggered');
  try {
    const result = await runTrendingJob();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger cleanup now
app.post('/api/v1/cleanup', async (req, res) => {
  logger.info('[API] Manual cleanup triggered');
  try {
    const result = await runCleanupJob();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List all sources
app.get('/api/v1/sources', (req, res) => {
  const { language, category } = req.query;
  let sources = ALL_SOURCES;
  if (language) sources = sources.filter(s => s.language === language);
  if (category) sources = sources.filter(s => s.category === category);
  res.json({
    total: sources.length,
    languages: getSupportedLanguages(),
    sources,
  });
});

// Add a new source at runtime (in-memory; persists until container restart)
app.post('/api/v1/sources', (req, res) => {
  const { name, language, category, type = 'rss', url } = req.body || {};
  if (!name || !language || !category || !url) {
    return res.status(400).json({ success: false, error: 'name, language, category, and url are required' });
  }
  try { new URL(url); } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL' });
  }
  if (ALL_SOURCES.some(s => s.url === url)) {
    return res.status(409).json({ success: false, error: 'A source with this URL already exists' });
  }
  const source = { name, language, category, type, url };
  ALL_SOURCES.push(source);
  logger.info(`[API] Source added: ${name} (${language}/${category}) — ${url}`);
  res.status(201).json({ success: true, data: source });
});

// Get last scrape stats
app.get('/api/v1/stats', async (req, res) => {
  const lastRun = await redisGet('scraper:last_run');
  res.json({ last_run: lastRun, total_sources: ALL_SOURCES.length });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Startup ───────────────────────────────────────────────────────
const start = async () => {
  try {
    logger.info('[Startup] Connecting to Redis...');
    await connectRedis();

    logger.info('[Startup] Testing PostgreSQL connection...');
    await pool.query('SELECT 1');
    logger.info('[Startup] PostgreSQL OK');

    const server = app.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════╗
║   📡 Scraper Service — SamacharDaily             ║
║   http://localhost:${PORT}                           ║
║   Sources: ${String(ALL_SOURCES.length).padEnd(3)} across ${getSupportedLanguages().length} languages        ║
╚══════════════════════════════════════════════════╝`);
    });

    // ── Cron Jobs ────────────────────────────────────────────────

    // 1. Scrape: every N minutes (default 30)
    const scrapeSchedule = process.env.CRON_SCRAPE || '*/30 * * * *';
    logger.info(`[Cron] Scrape schedule: ${scrapeSchedule}`);

    // Run once immediately on startup
    logger.info('[Startup] Running initial scrape...');
    runScrapeJob().catch(err => logger.error('[Startup] Initial scrape error:', err));

    cron.schedule(scrapeSchedule, () => {
      logger.info('[Cron] Scheduled scrape triggered');
      runScrapeJob().catch(err => logger.error('[Cron] Scrape error:', err));
    }, { timezone: 'Asia/Kolkata' });

    // 2. Trending: every 15 minutes
    const trendingSchedule = process.env.CRON_TRENDING || '*/15 * * * *';
    logger.info(`[Cron] Trending schedule: ${trendingSchedule}`);
    cron.schedule(trendingSchedule, () => {
      runTrendingJob().catch(err => logger.error('[Cron] Trending error:', err));
    }, { timezone: 'Asia/Kolkata' });

    // 3. Cleanup: daily at 2:00 AM IST
    const cleanupSchedule = process.env.CRON_CLEANUP || '0 2 * * *';
    logger.info(`[Cron] Cleanup schedule: ${cleanupSchedule}`);
    cron.schedule(cleanupSchedule, () => {
      runCleanupJob().catch(err => logger.error('[Cron] Cleanup error:', err));
    }, { timezone: 'Asia/Kolkata' });

    // ── Graceful Shutdown ─────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`[Shutdown] ${signal} received — shutting down gracefully`);
      server.close(() => {
        pool.end(() => process.exit(0));
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('[Startup] Fatal error:', err);
    process.exit(1);
  }
};

start();

module.exports = app;

