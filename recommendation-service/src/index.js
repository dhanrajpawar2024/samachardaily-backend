const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const postgresDb = require('./db/postgres');
const redisDb = require('./db/redis');
const kafkaConsumer = require('./kafka/consumer');
const recommendationRoutes = require('./routes/recommendations');

const app = express();
const PORT = process.env.PORT || 3006;

// ── Security & Performance Middleware ────────────────────

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Request Tracking ────────────────────────────────────

app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  console.log(`[${req.requestId}] ${req.method} ${req.path}`);
  next();
});

// ── JWT Middleware ─────────────────────────────────────

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

app.use((req, res, next) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      error: 'Missing authorization token',
      code: 'MISSING_TOKEN',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
});

// ── Health Check ───────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'recommendation-service',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──────────────────────────────────────────

app.use('/api/v1/recommendations', recommendationRoutes);

// ── 404 Handler ─────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// ── Error Handler ───────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: req.requestId,
  });
});

// ── Start Server ────────────────────────────────────────

const start = async () => {
  try {
    // Connect to PostgreSQL
    const testQuery = await postgresDb.query('SELECT NOW()');
    console.log('[Recommendation Service] PostgreSQL connected');

    // Connect to Redis
    await redisDb.connect();
    console.log('[Recommendation Service] Redis connected (DB 6)');

    // Start Kafka consumer
    await kafkaConsumer.startConsumer();
    console.log('[Recommendation Service] Kafka consumer started');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`[Recommendation Service] Running on port ${PORT}`);
      console.log(`[Recommendation Service] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('[Recommendation Service] Endpoints:');
      console.log('  - GET /health');
      console.log('  - GET /api/v1/recommendations/for-user');
      console.log('  - GET /api/v1/recommendations/similar/:articleId');
      console.log('  - GET /api/v1/recommendations/related/:articleId');
      console.log('  - GET /api/v1/recommendations/category/:categoryId');
      console.log('  - GET /api/v1/recommendations/trending');
      console.log('  - GET /api/v1/recommendations/popular');
      console.log('  - POST /api/v1/recommendations/feedback');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Recommendation Service] SIGTERM received, shutting down gracefully...');

      // Stop Kafka consumer
      await kafkaConsumer.stopConsumer();
      console.log('[Recommendation Service] Kafka consumer stopped');

      server.close(async () => {
        console.log('[Recommendation Service] Server closed');
        await postgresDb.pool.end();
        console.log('[Recommendation Service] Database connection closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[Recommendation Service] Startup error:', error);
    process.exit(1);
  }
};

start();

module.exports = app;
