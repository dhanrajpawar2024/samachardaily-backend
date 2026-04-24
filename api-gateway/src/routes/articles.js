const express = require('express');
const { proxyRequest } = require('../services/proxy');

const router = express.Router();

/**
 * GET /api/v1/articles - Get articles (paginated)
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', '/api/v1/articles', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/articles/:id - Get article by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', `/api/v1/articles/${req.params.id}`, 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/articles - Create article (admin)
 */
router.post('/', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', '/api/v1/articles', 'POST', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/articles/:id - Update article (admin)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', `/api/v1/articles/${req.params.id}`, 'PUT', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/articles/:id - Delete article (admin)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', `/api/v1/articles/${req.params.id}`, 'DELETE', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/articles/:id/interactions - Get article interactions
 */
router.get('/:id/interactions', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', `/api/v1/articles/${req.params.id}/interactions`, 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/articles/:id/like - Like article
 */
router.post('/:id/like', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', `/api/v1/articles/${req.params.id}/like`, 'POST', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/articles/:id/bookmark - Bookmark article
 */
router.post('/:id/bookmark', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', `/api/v1/articles/${req.params.id}/bookmark`, 'POST', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
