const express = require('express');
const { proxyRequest } = require('../services/proxy');
const { notificationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiter to all notification routes
router.use(notificationLimiter);

/**
 * POST /api/v1/notifications/register-token - Register FCM token
 */
router.post('/register-token', async (req, res, next) => {
  try {
    const result = await proxyRequest('notifications', '/api/v1/notifications/register-token', 'POST', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/notifications/unregister-token - Unregister FCM token
 */
router.delete('/unregister-token', async (req, res, next) => {
  try {
    const result = await proxyRequest('notifications', '/api/v1/notifications/unregister-token', 'DELETE', req.body, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/notifications/preferences - Get notification preferences
 */
router.get('/preferences', async (req, res, next) => {
  try {
    const result = await proxyRequest('notifications', '/api/v1/notifications/preferences', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/notifications/preferences/:categoryId - Update preferences
 */
router.put('/preferences/:categoryId', async (req, res, next) => {
  try {
    const result = await proxyRequest(
      'notifications',
      `/api/v1/notifications/preferences/${req.params.categoryId}`,
      'PUT',
      req.body,
      req.headers,
      req.query
    );
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/notifications/history - Get notification history
 */
router.get('/history', async (req, res, next) => {
  try {
    const result = await proxyRequest('notifications', '/api/v1/notifications/history', 'GET', null, req.headers, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/notifications/mark-read/:notificationId - Mark as read
 */
router.post('/mark-read/:notificationId', async (req, res, next) => {
  try {
    const result = await proxyRequest(
      'notifications',
      `/api/v1/notifications/mark-read/${req.params.notificationId}`,
      'POST',
      req.body,
      req.headers,
      req.query
    );
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
