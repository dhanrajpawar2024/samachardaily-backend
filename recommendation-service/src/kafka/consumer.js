const { Kafka } = require('kafkajs');
const postgresDb = require('../db/postgres');

const buildKafkaConfig = () => {
  const config = {
    clientId: process.env.KAFKA_CLIENT_ID || 'recommendation-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
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

const kafka = new Kafka(buildKafkaConfig());

let consumer;
let isRunning = false;

/**
 * Start Kafka consumer for clickstream events
 */
const startConsumer = async () => {
  try {
    consumer = kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'recommendation-service-group',
    });

    await consumer.connect();
    console.log('[Recommendation Service] Kafka consumer connected');

    // Subscribe to clickstream topic
    await consumer.subscribe({
      topic: process.env.KAFKA_TOPIC_CLICKSTREAM || 'clickstream',
      fromBeginning: false,
    });

    isRunning = true;

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          await handleClickstreamEvent(event);
        } catch (error) {
          console.error('[Recommendation Service] Error processing message:', error);
        }
      },
    });
  } catch (error) {
    console.error('[Recommendation Service] Kafka consumer error:', error);
    throw error;
  }
};

/**
 * Stop Kafka consumer
 */
const stopConsumer = async () => {
  if (consumer && isRunning) {
    isRunning = false;
    await consumer.disconnect();
    console.log('[Recommendation Service] Kafka consumer disconnected');
  }
};

/**
 * Handle clickstream event (user interaction)
 */
const handleClickstreamEvent = async (event) => {
  try {
    const { user_id, article_id, interaction_type, timestamp } = event;

    if (!user_id || !article_id) {
      console.warn('[Recommendation Service] Invalid event:', event);
      return;
    }

    // Store interaction in database
    await postgresDb.query(
      `INSERT INTO interactions (id, user_id, article_id, interaction_type, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       ON CONFLICT (user_id, article_id, interaction_type) DO UPDATE
       SET created_at = $4`,
      [user_id, article_id, interaction_type, new Date(timestamp || Date.now())]
    );

    console.log(`[Recommendation Service] Recorded ${interaction_type} by ${user_id} on ${article_id}`);
  } catch (error) {
    console.error('[Recommendation Service] Error handling clickstream event:', error);
  }
};

module.exports = {
  startConsumer,
  stopConsumer,
};
