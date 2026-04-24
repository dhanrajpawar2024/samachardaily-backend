const express = require('express');
const { proxyRequest } = require('../services/proxy');
const { searchLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiter to all search routes
router.use(searchLimiter);

/**
 * GET /api/v1/search - Full-text search articles
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await proxyRequest('search', '/api/v1/search', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/search/suggestions - Get search suggestions
 */
router.get('/suggestions', async (req, res, next) => {
  try {
    const result = await proxyRequest('search', '/api/v1/search/suggestions', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/search/trending - Get trending keywords
 */
router.get('/trending', async (req, res, next) => {
  try {
    const result = await proxyRequest('search', '/api/v1/search/trending', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/search/filters - Get available search filters
 */
router.get('/filters', async (req, res, next) => {
  try {
    const result = await proxyRequest('search', '/api/v1/search/filters', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
