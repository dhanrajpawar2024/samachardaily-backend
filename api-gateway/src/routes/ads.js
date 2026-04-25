const express = require('express');
const { proxyRequest } = require('../services/proxy');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', '/api/v1/ads', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

router.get('/active', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', '/api/v1/ads/active', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', '/api/v1/ads', 'POST', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', `/api/v1/ads/${req.params.id}`, 'PUT', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', `/api/v1/ads/${req.params.id}/toggle`, 'PATCH', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await proxyRequest('content', `/api/v1/ads/${req.params.id}`, 'DELETE', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
