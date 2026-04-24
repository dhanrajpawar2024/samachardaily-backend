const express = require('express');
const { proxyRequest } = require('../services/proxy');

const router = express.Router();

/**
 * GET /api/v1/recommendations/for-user - Get personalized recommendations
 */
router.get('/for-user', async (req, res, next) => {
  try {
    const result = await proxyRequest('recommendations', '/api/v1/recommendations/for-user', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommendations/similar/:articleId - Get similar articles
 */
router.get('/similar/:articleId', async (req, res, next) => {
  try {
    const result = await proxyRequest(
      'recommendations',
      `/api/v1/recommendations/similar/${req.params.articleId}`,
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

/**
 * GET /api/v1/recommendations/related/:articleId - Get related articles
 */
router.get('/related/:articleId', async (req, res, next) => {
  try {
    const result = await proxyRequest(
      'recommendations',
      `/api/v1/recommendations/related/${req.params.articleId}`,
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

/**
 * GET /api/v1/recommendations/category/:categoryId - Get recommendations by category
 */
router.get('/category/:categoryId', async (req, res, next) => {
  try {
    const result = await proxyRequest(
      'recommendations',
      `/api/v1/recommendations/category/${req.params.categoryId}`,
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

/**
 * GET /api/v1/recommendations/trending - Get trending articles
 */
router.get('/trending', async (req, res, next) => {
  try {
    const result = await proxyRequest('recommendations', '/api/v1/recommendations/trending', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommendations/popular - Get popular articles
 */
router.get('/popular', async (req, res, next) => {
  try {
    const result = await proxyRequest('recommendations', '/api/v1/recommendations/popular', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/recommendations/feedback - Submit recommendation feedback
 */
router.post('/feedback', async (req, res, next) => {
  try {
    const result = await proxyRequest('recommendations', '/api/v1/recommendations/feedback', 'POST', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
