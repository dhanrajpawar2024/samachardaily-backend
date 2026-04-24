const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const redisDb = require('./db/redis');
const postgresDb = require('./db/postgres');
const feedRoutes = require('./routes/feed');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Request ID tracking
app.use((req, res, next) => {
  req.requestId = uuidv4();
  console.log(`[${req.requestId}] ${req.method} ${req.path}`);
  next();
});

// JWT verification middleware
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// JWT middleware — optional auth for read endpoints
app.use((req, res, next) => {
  if (req.path === '/health') return next();

  const token = req.headers.authorization?.split(' ')[1];

  // Public GET endpoints — serve without user context if no token
  const isPublicRead = req.method === 'GET' && (
    req.path.startsWith('/api/v1/feed')
  );

  if (!token) {
    req.user = null;
    if (isPublicRead) return next();
    return res.status(401).json({ error: 'Missing authorization token', code: 'MISSING_TOKEN' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    req.user = null;
    if (isPublicRead) return next(); // degraded — serve without user context
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'feed-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/feed', feedRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: req.requestId,
  });
});

// Start server
const start = async () => {
  try {
    // Connect to Redis
    await redisDb.connect();
    console.log('[Feed Service] Redis connected');

    // Test PostgreSQL connection
    const testQuery = await postgresDb.query('SELECT NOW()');
    console.log('[Feed Service] PostgreSQL connected:', testQuery.rows[0]);

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`[Feed Service] Running on port ${PORT}`);
      console.log(`[Feed Service] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('[Feed Service] Ranking Weights:');
      console.log(`  - Recency: ${process.env.RECENCY_WEIGHT || 0.2}`);
      console.log(`  - Trending: ${process.env.TRENDING_WEIGHT || 0.3}`);
      console.log(`  - Affinity: ${process.env.AFFINITY_WEIGHT || 0.4}`);
      console.log(`  - Engagement: ${process.env.ENGAGEMENT_WEIGHT || 0.1}`);
      console.log(`[Feed Service] Cache TTL: ${process.env.FEED_CACHE_TTL_MINUTES || 5} minutes`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Feed Service] SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        console.log('[Feed Service] Server closed');
        await postgresDb.pool.end();
        console.log('[Feed Service] Database connection closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[Feed Service] Startup error:', error);
    process.exit(1);
  }
};

start();

module.exports = app;
