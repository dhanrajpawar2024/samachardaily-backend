const { v4: uuidv4 } = require('uuid');
const { query, getAll, getOne } = require('../db/postgres');
const { set: redisSet, get: redisGet } = require('../db/redis');

/**
 * Register FCM token for user
 */
const registerFCMToken = async (userId, fcmToken, deviceInfo = {}) => {
  try {
    const tokenId = uuidv4();

    // Check if token already exists
    const existing = await getOne(
      `SELECT id FROM fcm_tokens WHERE token = $1`,
      [fcmToken]
    );

    if (existing) {
      // Update existing
      await query(
        `UPDATE fcm_tokens 
         SET user_id = $1, last_used_at = NOW()
         WHERE token = $2`,
        [userId, fcmToken]
      );
      console.log(`[Notifications] Updated FCM token for user ${userId}`);
    } else {
      // Insert new
      await query(
        `INSERT INTO fcm_tokens (id, user_id, token, platform, created_at, last_used_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [tokenId, userId, fcmToken, deviceInfo.platform || 'android']
      );
      console.log(`[Notifications] Registered FCM token for user ${userId}`);
    }

    return { success: true, tokenId };
  } catch (error) {
    console.error('[Notifications] FCM registration error:', error);
    throw error;
  }
};

/**
 * Unregister FCM token
 */
const unregisterFCMToken = async (fcmToken) => {
  try {
    await query(
      `UPDATE fcm_tokens SET last_used_at = NOW() WHERE token = $1`,
      [fcmToken]
    );
    console.log(`[Notifications] Deactivated FCM token`);
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Unregister error:', error);
    throw error;
  }
};

/**
 * Get or create notification preferences for user
 */
const getNotificationPreferences = async (userId) => {
  const cacheKey = `preferences:${userId}`;
  
  const cached = await redisGet(cacheKey);
  if (cached) return cached;

  try {
    const preferences = await getAll(
      `SELECT category_id, breaking_news_enabled, trending_enabled, 
              comment_notifications_enabled, bookmark_notifications_enabled,
              is_active
       FROM notification_preferences
       WHERE user_id = $1`,
      [userId]
    );

    const result = {
      user_id: userId,
      categories: preferences || [],
      global_breaking_news: await getGlobalSetting(userId, 'breaking_news'),
    };

    // Cache for 1 hour
    await redisSet(cacheKey, result, 3600);

    return result;
  } catch (error) {
    console.error('[Notifications] Get preferences error:', error);
    throw error;
  }
};

/**
 * Update notification preferences for category
 */
const updateCategoryPreferences = async (userId, categoryId, preferences) => {
  try {
    await query(
      `INSERT INTO notification_preferences (id, user_id, category_id, breaking_news_enabled, 
                                           trending_enabled, comment_notifications_enabled, 
                                           bookmark_notifications_enabled, created_at, is_active)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), TRUE)
       ON CONFLICT (user_id, category_id) DO UPDATE SET
         breaking_news_enabled = $3,
         trending_enabled = $4,
         comment_notifications_enabled = $5,
         bookmark_notifications_enabled = $6`,
      [
        userId,
        categoryId,
        preferences.breaking_news ?? true,
        preferences.trending ?? true,
        preferences.comments ?? false,
        preferences.bookmarks ?? false,
      ]
    );

    // Invalidate cache
    await redisSet(`preferences:${userId}`, null);

    console.log(`[Notifications] Updated preferences for user ${userId}, category ${categoryId}`);
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Update preferences error:', error);
    throw error;
  }
};

/**
 * Get global notification setting
 */
const getGlobalSetting = async (userId, setting) => {
  try {
    const result = await getOne(
      `SELECT value FROM user_settings WHERE user_id = $1 AND setting_key = $2`,
      [userId, setting]
    );
    return result?.value === 'true';
  } catch (error) {
    console.error('[Notifications] Get global setting error:', error);
    return true; // Default to enabled
  }
};

/**
 * Get notification history
 */
const getNotificationHistory = async (userId, limit = 50) => {
  try {
    const history = await getAll(
      `SELECT id, user_id, title, body, type, payload_json, is_read, created_at FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return history;
  } catch (error) {
    console.error('[Notifications] Get history error:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (notificationId) => {
  try {
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
      [notificationId]
    );
    console.log(`[Notifications] Marked notification ${notificationId} as read`);
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Mark as read error:', error);
    throw error;
  }
};

/**
 * Send scheduled notification (for breaking news, etc)
 */
const sendScheduledNotification = async (title, body, categoryId, targetTime = null) => {
  try {
    const notificationId = uuidv4();

    await query(
      `INSERT INTO scheduled_notifications (id, title, body, category_id, target_time, created_at, is_sent)
       VALUES ($1, $2, $3, $4, $5, NOW(), FALSE)`,
      [notificationId, title, body, categoryId, targetTime || new Date()]
    );

    console.log(`[Notifications] Scheduled notification ${notificationId}`);
    return { notificationId, success: true };
  } catch (error) {
    console.error('[Notifications] Schedule error:', error);
    throw error;
  }
};

module.exports = {
  registerFCMToken,
  unregisterFCMToken,
  getNotificationPreferences,
  updateCategoryPreferences,
  getGlobalSetting,
  getNotificationHistory,
  markNotificationAsRead,
  sendScheduledNotification,
};
