const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
require('dotenv').config();

const postgresDb = require('./db/postgres');
const redisDb = require('./db/redis');
const firebaseDb = require('./db/firebase');
const notificationRoutes = require('./routes/notifications');
const kafkaConsumer = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 3005;

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

// JWT middleware (all notification endpoints require auth)
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/notifications', notificationRoutes);

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
    console.log('[Notification Service] PostgreSQL connected:', testQuery.rows[0]);

    // Connect to Redis
    await redisDb.connect();
    console.log('[Notification Service] Redis connected (DB 5)');

    // Initialize Firebase Admin SDK
    firebaseDb.initialize();
    console.log('[Notification Service] Firebase initialized');

    // Start Kafka consumer (non-blocking)
    kafkaConsumer.startConsumer()
      .then(() => console.log('[Notification Service] Kafka consumer started'))
      .catch(err => console.warn('[Notification Service] Kafka unavailable:', err.message));

    // Setup scheduled tasks for processing pending notifications
    cron.schedule('*/5 * * * *', async () => {
      console.log('[Notification Service] Running scheduled notification processor...');
      // TODO: Process scheduled notifications
    });

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`[Notification Service] Running on port ${PORT}`);
      console.log(`[Notification Service] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('[Notification Service] Endpoints:');
      console.log('  - GET /health');
      console.log('  - POST /api/v1/notifications/register-token');
      console.log('  - DELETE /api/v1/notifications/unregister-token');
      console.log('  - GET /api/v1/notifications/preferences');
      console.log('  - PUT /api/v1/notifications/preferences/:categoryId');
      console.log('  - GET /api/v1/notifications/history');
      console.log('  - POST /api/v1/notifications/mark-read/:notificationId');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Notification Service] SIGTERM received, shutting down gracefully...');
      
      // Stop Kafka consumer
      await kafkaConsumer.stopConsumer();
      console.log('[Notification Service] Kafka consumer stopped');

      server.close(async () => {
        console.log('[Notification Service] Server closed');
        await postgresDb.pool.end();
        console.log('[Notification Service] Database connection closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[Notification Service] Startup error:', error);
    process.exit(1);
  }
};

start();

module.exports = app;
