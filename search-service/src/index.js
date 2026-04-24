const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const postgresDb = require('./db/postgres');
const redisDb = require('./db/redis');
const elasticsearchDb = require('./db/elasticsearch');
const searchRoutes = require('./routes/search');
const kafkaConsumer = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 3004;

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

// JWT middleware (optional for search service)
app.use((req, res, next) => {
  // Skip auth for health check, search, and public endpoints
  if (req.path === '/health' || req.path.startsWith('/api/v1/search')) {
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'search-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/search', searchRoutes);

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
    // Connect to PostgreSQL
    const testQuery = await postgresDb.query('SELECT NOW()');
    console.log('[Search Service] PostgreSQL connected:', testQuery.rows[0]);

    // Connect to Redis
    await redisDb.connect();
    console.log('[Search Service] Redis connected (DB 4)');

    // Connect to Elasticsearch
    await elasticsearchDb.connect();
    console.log('[Search Service] Elasticsearch connected');

    // Create index if it doesn't exist
    await elasticsearchDb.createIndex();

    // Start Kafka consumer
    await kafkaConsumer.startConsumer();
    console.log('[Search Service] Kafka consumer started');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`[Search Service] Running on port ${PORT}`);
      console.log(`[Search Service] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('[Search Service] Endpoints:');
      console.log('  - GET /health');
      console.log('  - GET /api/v1/search?q=query');
      console.log('  - GET /api/v1/search/suggestions?q=query');
      console.log('  - GET /api/v1/search/trending');
      console.log('  - GET /api/v1/search/filters');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Search Service] SIGTERM received, shutting down gracefully...');
      
      // Stop Kafka consumer
      await kafkaConsumer.stopConsumer();
      console.log('[Search Service] Kafka consumer stopped');

      server.close(async () => {
        console.log('[Search Service] Server closed');
        await postgresDb.pool.end();
        console.log('[Search Service] Database connection closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[Search Service] Startup error:', error);
    process.exit(1);
  }
};

start();

module.exports = app;
