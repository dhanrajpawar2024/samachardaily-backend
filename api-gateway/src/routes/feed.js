const express = require('express');
const { proxyRequest } = require('../services/proxy');
const { feedLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiter to all feed routes
router.use(feedLimiter);

/**
 * GET /api/v1/feed - Get personalized feed
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await proxyRequest('feed', '/api/v1/feed', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/feed/trending - Get trending articles
 */
router.get('/trending', async (req, res, next) => {
  try {
    const result = await proxyRequest('feed', '/api/v1/feed/trending', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/feed/category/:categoryId - Get articles from specific category
 */
router.get('/category/:categoryId', async (req, res, next) => {
  try {
    const result = await proxyRequest(
      'feed',
      `/api/v1/feed/category/${req.params.categoryId}`,
      'GET',
      null,
      req.headers,
      req.query
    );
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
