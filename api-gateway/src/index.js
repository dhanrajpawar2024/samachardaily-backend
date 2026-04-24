const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Middleware imports
const { requestIdMiddleware, requestLogger, slowRequestLogger } = require('./middleware/logging');
const { jwtMiddleware } = require('./middleware/auth');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const articlesRoutes = require('./routes/articles');
const feedRoutes = require('./routes/feed');
const searchRoutes = require('./routes/search');
const notificationsRoutes = require('./routes/notifications');
const recommendationsRoutes = require('./routes/recommendations');

// Service imports
const { healthCheck } = require('./services/proxy');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security & Performance Middleware ────────────────────

// Trust proxy (for X-Forwarded-For header in load-balanced environments)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Response compression
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Request Processing Middleware ────────────────────────

// Request ID tracking
app.use(requestIdMiddleware);

// Request logging
app.use(requestLogger);

// Slow request logging
app.use(slowRequestLogger);

// Global rate limiting
app.use(globalLimiter);

// ── Health Check (no auth required) ──────────────────────

/**
 * GET /health - Service health check
 */
app.get('/health', async (req, res) => {
  try {
    const health = await healthCheck();
    const allHealthy = Object.values(health.services).every((s) => s.status === 'healthy');

    // Always return 200 so Railway health check passes — gateway itself is alive
    res.status(200).json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      ...health,
    });
  } catch (error) {
    res.status(200).json({
      status: 'degraded',
      service: 'api-gateway',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ── JWT Authentication Middleware ───────────────────────

app.use(jwtMiddleware);

// ── Auth Routes (with strict rate limiting) ─────────────

app.use('/api/v1/auth', authLimiter, authRoutes);

// ── Protected Routes (require JWT) ───────────────────────

/**
 * Articles routes
 */
app.use('/api/v1/articles', articlesRoutes);

/**
 * Feed routes (with additional rate limiting)
 */
app.use('/api/v1/feed', feedRoutes);

/**
 * Search routes (with additional rate limiting)
 */
app.use('/api/v1/search', searchRoutes);

/**
 * Notifications routes (with additional rate limiting)
 */
app.use('/api/v1/notifications', notificationsRoutes);

/**
 * Recommendations routes
 */
app.use('/api/v1/recommendations', recommendationsRoutes);

/**
 * Categories routes (proxied to content service)
 */
app.use('/api/v1/categories', async (req, res, next) => {
  try {
    const { proxyRequest } = require('./services/proxy');
    const result = await proxyRequest('content', `/api/v1/articles/categories${req.path === '/' ? '' : req.path}`, req.method, req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) { next(error); }
});

/**
 * Interactions routes (proxied to feed service)
 */
app.use('/api/v1/interactions', async (req, res, next) => {
  try {
    const { proxyRequest } = require('./services/proxy');
    const result = await proxyRequest('feed', `/api/v1/feed/interactions${req.path === '/' ? '' : req.path}`, req.method, req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) { next(error); }
});

/**
 * Bookmarks routes (proxied to content service)
 */
app.use('/api/v1/bookmarks', async (req, res, next) => {
  try {
    const { proxyRequest } = require('./services/proxy');
    const result = await proxyRequest('content', `/api/v1/bookmarks${req.path === '/' ? '' : req.path}`, req.method, req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) { next(error); }
});

/**
 * Videos routes (proxied to content service)
 */
app.use('/api/v1/videos', async (req, res, next) => {
  try {
    const { proxyRequest } = require('./services/proxy');
    const result = await proxyRequest('content', `/api/v1/videos${req.path === '/' ? '' : req.path}`, req.method, req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) { next(error); }
});

// ── Error Handling ───────────────────────────────────────

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────

const start = async () => {
  try {
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`[API Gateway] Running on port ${PORT}`);
      console.log(`[API Gateway] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('[API Gateway] Routes:');
      console.log('  - GET /health');
      console.log('  - POST /api/v1/auth/google');
      console.log('  - POST /api/v1/auth/refresh');
      console.log('  - POST /api/v1/auth/logout');
      console.log('  - GET /api/v1/articles');
      console.log('  - GET /api/v1/feed');
      console.log('  - GET /api/v1/search');
      console.log('  - GET /api/v1/notifications/history');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[API Gateway] SIGTERM received, shutting down gracefully...');

      server.close(() => {
        console.log('[API Gateway] Server closed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('[API Gateway] Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    });
  } catch (error) {
    console.error('[API Gateway] Startup error:', error);
    process.exit(1);
  }
};

start();

module.exports = app;
