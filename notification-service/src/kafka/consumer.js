const { Kafka } = require('kafkajs');
const { sendMulticast, sendToTopic } = require('../db/firebase');
const { getAll, query } = require('../db/postgres');
const { set: redisSet, get: redisGet } = require('../db/redis');

let consumer = null;

const buildKafkaConfig = () => {
  const config = {
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
    brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    connectionTimeout: 10000,
    requestTimeout: 25000,
  };
  if (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD) {
    config.ssl = true;
    config.sasl = {
      mechanism: 'scram-sha-256',
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD,
    };
  }
  return config;
};

const startConsumer = async () => {
  try {
    const kafka = new Kafka(buildKafkaConfig());

    consumer = kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'notification-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();
    console.log('[Kafka] Consumer connected');

    // Subscribe to topics
    await consumer.subscribe({
      topic: process.env.KAFKA_TOPIC_BREAKING_NEWS || 'breaking_news',
      fromBeginning: false,
    });

    await consumer.subscribe({
      topic: process.env.KAFKA_TOPIC_NOTIFICATIONS || 'notification_events',
      fromBeginning: false,
    });

    console.log('[Kafka] Subscribed to breaking_news and notification_events topics');

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          
          if (topic === 'breaking_news') {
            await handleBreakingNews(event);
          } else if (topic === 'notification_events') {
            await handleNotificationEvent(event);
          }
        } catch (error) {
          console.error('[Kafka] Error processing message:', error);
        }
      },
    });
  } catch (error) {
    console.error('[Kafka] Consumer error:', error);
    throw error;
  }
};

const handleBreakingNews = async (event) => {
  try {
    const { article_id, title, description, category_id, image_url } = event;

    console.log(`[Kafka] Breaking news received: ${article_id} - ${title}`);

    // Get users subscribed to category
    const subscribers = await getAll(
      `SELECT DISTINCT user_id FROM notification_preferences 
       WHERE category_id = $1 AND breaking_news_enabled = TRUE AND is_active = TRUE`,
      [category_id]
    );

    if (subscribers.length === 0) {
      console.log('[Kafka] No subscribers for this category');
      return;
    }

    // Get FCM tokens for subscribers
    const userIds = subscribers.map(s => s.user_id);
    const tokens = await getAll(
      `SELECT fcm_token FROM fcm_tokens WHERE user_id = ANY($1) AND is_active = TRUE`,
      [userIds]
    );

    if (tokens.length === 0) {
      console.log('[Kafka] No active FCM tokens');
      return;
    }

    const deviceTokens = tokens.map(t => t.fcm_token);

    // Send push notification
    await sendMulticast(deviceTokens, title, description, {
      type: 'breaking_news',
      article_id,
      category_id,
      image_url: image_url || '',
    });

    // Log notification
    await query(
      `INSERT INTO notifications (user_id, title, body, type, payload_json)
       VALUES (NULL, $1, $2, 'breaking'::notification_type, $3)`,
      [title, description, JSON.stringify({ article_id, category_id })]
    );
  } catch (error) {
    console.error('[Kafka] Breaking news error:', error);
  }
};

const handleNotificationEvent = async (event) => {
  try {
    const { user_id, notification_type, title, body, data } = event;

    console.log(`[Kafka] Notification event: ${notification_type} for user ${user_id}`);

    // Get user's FCM tokens
    const tokens = await getAll(
      `SELECT fcm_token FROM fcm_tokens WHERE user_id = $1 AND is_active = TRUE`,
      [user_id]
    );

    if (tokens.length === 0) {
      console.log('[Kafka] No FCM tokens for user');
      return;
    }

    const deviceTokens = tokens.map(t => t.fcm_token);

    // Send notification
    await sendMulticast(deviceTokens, title, body, {
      type: notification_type,
      ...data,
    });

    // Log notification
    await query(
      `INSERT INTO notifications (user_id, title, body, type, payload_json)
       VALUES ($1, $2, $3, 'article'::notification_type, $4)`,
      [user_id, title, body, JSON.stringify(data || {})]
    );
  } catch (error) {
    console.error('[Kafka] Notification event error:', error);
  }
};

const stopConsumer = async () => {
  if (consumer) {
    await consumer.disconnect();
    console.log('[Kafka] Consumer disconnected');
  }
};

module.exports = {
  startConsumer,
  stopConsumer,
};
