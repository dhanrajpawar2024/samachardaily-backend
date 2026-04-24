require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const { connect: connectRedis } = require('./db/redis');
const { pool } = require('./db/postgres');
const { ingestArticles } = require('./services/ingestion');
const articlesRoutes = require('./routes/articles');
const videosRoutes = require('./routes/videos');

const app = express();
const PORT = process.env.PORT || 3002;

// ── Middleware ─────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// JWT decode middleware (optional — doesn't reject unauthenticated requests,
// but populates req.user if a valid token is present)
const jwt = require('jsonwebtoken');
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'change_this_to_a_strong_random_secret_min_32_chars');
    } catch (_) {}
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ───────────────────────────
app.get('/health', async (req, res) => {
  try {
    const pgResult = await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      service: 'content-service',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// ── Ingestion trigger endpoint ─────────────
app.post('/api/v1/ingest', async (req, res) => {
  try {
    console.log('[Content] Manual ingestion triggered');
    const result = await ingestArticles();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[Content] Ingestion endpoint error:', error);
    res.status(500).json({ error: 'Ingestion failed' });
  }
});

// ── Routes ─────────────────────────────────
app.use('/api/v1/articles', articlesRoutes);
app.use('/api/v1/videos', videosRoutes);

// ── Admin: manual ingestion trigger ────────
app.post('/admin/ingest', async (req, res) => {
  try {
    const result = await ingestArticles();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[Content] Ingestion endpoint error:', error);
    res.status(500).json({ error: 'Ingestion failed' });
  }
});

// ── Bookmarks Routes ──────────────────────
const { query: queryDb, getAll } = require('./db/postgres');

app.get('/api/v1/bookmarks', async (req, res) => {
  try {
    const userId = req.user?.userId || req.headers['x-user-id'];
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const bookmarks = await getAll(
      `SELECT a.id, a.title, a.summary, a.content, a.thumbnail_url, a.source_url, a.source_name, a.author,
              a.published_at, a.language, a.category_id, a.view_count, a.like_count, a.share_count,
              a.is_premium, b.created_at as bookmarked_at
       FROM bookmarks b
       JOIN articles a ON b.article_id = a.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );
    res.status(200).json({ success: true, data: { bookmarks, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error('[Content] Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks', code: 'BOOKMARKS_FETCH_FAILED' });
  }
});

app.post('/api/v1/bookmarks', async (req, res) => {
  try {
    const userId = req.user?.userId || req.headers['x-user-id'];
    const { articleId } = req.body;
    if (!articleId) return res.status(400).json({ error: 'articleId required' });
    await queryDb(
      `INSERT INTO bookmarks (user_id, article_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, article_id) DO NOTHING`,
      [userId, articleId]
    );
    res.status(201).json({ success: true, data: { articleId, bookmarked: true } });
  } catch (error) {
    console.error('[Content] Add bookmark error:', error);
    res.status(500).json({ error: 'Failed to add bookmark', code: 'BOOKMARK_ADD_FAILED' });
  }
});

app.delete('/api/v1/bookmarks/:articleId', async (req, res) => {
  try {
    const userId = req.user?.userId || req.headers['x-user-id'];
    await queryDb(
      `DELETE FROM bookmarks WHERE user_id = $1 AND article_id = $2`,
      [userId, req.params.articleId]
    );
    res.status(200).json({ success: true, data: { articleId: req.params.articleId, bookmarked: false } });
  } catch (error) {
    console.error('[Content] Remove bookmark error:', error);
    res.status(500).json({ error: 'Failed to remove bookmark', code: 'BOOKMARK_REMOVE_FAILED' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ── Startup ────────────────────────────────
const startServer = async () => {
  try {
    console.log('[Startup] Connecting to Redis...');
    await connectRedis();

    console.log('[Startup] Testing PostgreSQL connection...');
    const pgTest = await pool.query('SELECT 1');
    console.log('[Startup] PostgreSQL connection OK');

    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║   📰 Content Service - SamacharDaily       ║
║   Server running on http://localhost:${PORT}   ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
╚════════════════════════════════════════════╝
      `);
    });

    // ── Cron Job: Periodic article ingestion ────
    const ingestionInterval = parseInt(process.env.INGESTION_INTERVAL_MINUTES || 30);
    console.log(`[Cron] Setting up ingestion every ${ingestionInterval} minutes`);

    // Run immediately on startup
    console.log('[Cron] Running initial ingestion...');
    await ingestArticles();

    // Then schedule recurring
    cron.schedule(`*/${ingestionInterval} * * * *`, async () => {
      console.log('[Cron] Running scheduled ingestion');
      await ingestArticles().catch(err => 
        console.error('[Cron] Ingestion error:', err)
      );
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Shutdown] SIGTERM signal received');
      server.close(() => {
        console.log('[Shutdown] Server closed');
        pool.end();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
