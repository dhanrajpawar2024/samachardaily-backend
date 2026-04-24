require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connect: connectRedis } = require('./db/redis');
const { pool } = require('./db/postgres');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ───────────────────────────
app.get('/health', async (req, res) => {
  try {
    // Check PostgreSQL
    const pgResult = await pool.query('SELECT 1');
    if (!pgResult) throw new Error('PostgreSQL check failed');

    res.status(200).json({
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        redis: 'pending', // Redis health checked at startup
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// ── Routes ─────────────────────────────────
app.use('/api/v1/auth', authRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
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
    // Connect to Redis
    console.log('[Startup] Connecting to Redis...');
    await connectRedis();

    // Test PostgreSQL
    console.log('[Startup] Testing PostgreSQL connection...');
    const pgTest = await pool.query('SELECT 1');
    console.log('[Startup] PostgreSQL connection OK');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║   🔐 Auth Service - SamacharDaily         ║
║   Server running on http://localhost:${PORT}   ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
╚════════════════════════════════════════════╝
      `);
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
