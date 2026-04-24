const admin = require('firebase-admin');

let firebaseApp = null;

const initialize = () => {
  try {
    // Check if Firebase credentials are provided
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('[Firebase] Credentials not configured - Firebase services will be disabled');
      return null;
    }

    // Firebase credentials from environment
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('[Firebase] Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    console.warn('[Firebase] Firebase services disabled - continuing without FCM');
    return null;
  }
};

const sendToDevice = async (deviceToken, title, body, data = {}) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: deviceToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'news',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            'content-available': 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[Firebase] Message sent to ${deviceToken}: ${response}`);
    return response;
  } catch (error) {
    console.error('[Firebase] Send error:', error);
    throw error;
  }
};

const sendMulticast = async (deviceTokens, title, body, data = {}) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'news',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    };

    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens: deviceTokens,
    });

    console.log(`[Firebase] Multicast sent to ${deviceTokens.length} devices. Success: ${response.successCount}, Failed: ${response.failureCount}`);
    
    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(deviceTokens[idx]);
        }
      });
      console.log('[Firebase] Failed tokens:', failedTokens);
    }

    return response;
  } catch (error) {
    console.error('[Firebase] Multicast error:', error);
    throw error;
  }
};

const sendToTopic = async (topic, title, body, data = {}) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      topic,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'news',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[Firebase] Topic message sent to ${topic}: ${response}`);
    return response;
  } catch (error) {
    console.error('[Firebase] Topic send error:', error);
    throw error;
  }
};

const subscribeToTopic = async (tokens, topic) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`[Firebase] Subscribed ${tokens.length} devices to topic ${topic}`);
    return response;
  } catch (error) {
    console.error('[Firebase] Subscribe error:', error);
    throw error;
  }
};

const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log(`[Firebase] Unsubscribed ${tokens.length} devices from topic ${topic}`);
    return response;
  } catch (error) {
    console.error('[Firebase] Unsubscribe error:', error);
    throw error;
  }
};

module.exports = {
  initialize,
  sendToDevice,
  sendMulticast,
  sendToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,
};
