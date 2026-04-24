const express = require('express');
const { proxyRequest } = require('../services/proxy');

const router = express.Router();

/**
 * POST /api/v1/auth/google - Google authentication
 */
router.post('/google', async (req, res, next) => {
  try {
    const result = await proxyRequest('auth', '/api/v1/auth/google', 'POST', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/refresh - Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const result = await proxyRequest('auth', '/api/v1/auth/refresh', 'POST', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/logout - Logout
 */
router.post('/logout', async (req, res, next) => {
  try {
    const result = await proxyRequest('auth', '/api/v1/auth/logout', 'POST', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/me - Get current user info
 */
router.get('/me', async (req, res, next) => {
  try {
    const result = await proxyRequest('auth', '/api/v1/auth/me', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
