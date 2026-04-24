const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  registerFCMToken,
  unregisterFCMToken,
  getNotificationPreferences,
  updateCategoryPreferences,
  getNotificationHistory,
  markNotificationAsRead,
} = require('../services/notification');

const router = express.Router();

/**
 * POST /api/v1/notifications/register-token
 * Register FCM token for device
 */
router.post(
  '/register-token',
  [
    body('fcmToken').notEmpty().withMessage('FCM token required'),
    body('deviceInfo').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { fcmToken, deviceInfo = {} } = req.body;
      const userId = req.user.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'User ID required',
          code: 'MISSING_USER_ID',
        });
      }

      const result = await registerFCMToken(userId, fcmToken, deviceInfo);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[Notifications] Register token error:', error);
      res.status(500).json({
        error: 'Failed to register token',
        code: 'REGISTRATION_FAILED',
      });
    }
  }
);

/**
 * DELETE /api/v1/notifications/unregister-token
 * Unregister FCM token
 */
router.delete(
  '/unregister-token',
  [body('fcmToken').notEmpty().withMessage('FCM token required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { fcmToken } = req.body;

      const result = await unregisterFCMToken(fcmToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[Notifications] Unregister token error:', error);
      res.status(500).json({
        error: 'Failed to unregister token',
        code: 'UNREGISTRATION_FAILED',
      });
    }
  }
);

/**
 * GET /api/v1/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'User ID required',
        code: 'MISSING_USER_ID',
      });
    }

    const preferences = await getNotificationPreferences(userId);

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('[Notifications] Get preferences error:', error);
    res.status(500).json({
      error: 'Failed to get preferences',
      code: 'PREFERENCES_FETCH_FAILED',
    });
  }
});

/**
 * PUT /api/v1/notifications/preferences/:categoryId
 * Update preferences for specific category
 */
router.put(
  '/preferences/:categoryId',
  body('breaking_news').optional().isBoolean(),
  body('trending').optional().isBoolean(),
  body('comments').optional().isBoolean(),
  body('bookmarks').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user.userId;
      const { categoryId } = req.params;
      const preferences = req.body;

      if (!userId) {
        return res.status(401).json({
          error: 'User ID required',
          code: 'MISSING_USER_ID',
        });
      }

      const result = await updateCategoryPreferences(userId, categoryId, preferences);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[Notifications] Update preferences error:', error);
      res.status(500).json({
        error: 'Failed to update preferences',
        code: 'UPDATE_FAILED',
      });
    }
  }
);

/**
 * GET /api/v1/notifications/history
 * Get user's notification history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50 } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'User ID required',
        code: 'MISSING_USER_ID',
      });
    }

    const history = await getNotificationHistory(userId, Math.min(parseInt(limit), 100));

    res.status(200).json({
      success: true,
      data: {
        notifications: history,
        count: history.length,
      },
    });
  } catch (error) {
    console.error('[Notifications] Get history error:', error);
    res.status(500).json({
      error: 'Failed to get notification history',
      code: 'HISTORY_FETCH_FAILED',
    });
  }
});

/**
 * POST /api/v1/notifications/mark-read/:notificationId
 * Mark notification as read
 */
router.post('/mark-read/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await markNotificationAsRead(notificationId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Notifications] Mark as read error:', error);
    res.status(500).json({
      error: 'Failed to mark as read',
      code: 'MARK_READ_FAILED',
    });
  }
});

module.exports = router;
