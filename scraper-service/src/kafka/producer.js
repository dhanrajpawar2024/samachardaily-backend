/**
 * Kafka Producer for the scraper-service
 * Publishes new article IDs to the 'new-articles' topic so that
 * feed-service, notification-service, and recommendation-service
 * can react in real-time.
 *
 * Gracefully disabled when KAFKA_ENABLED=false (e.g. local dev).
 */

const { Kafka, Partitioners } = require('kafkajs');
const logger = require('../utils/logger');

const KAFKA_ENABLED = process.env.KAFKA_ENABLED !== 'false';
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const TOPIC_NEW_ARTICLES = process.env.KAFKA_TOPIC_NEW_ARTICLES || 'new-articles';

let producer = null;

const getProducer = async () => {
  if (!KAFKA_ENABLED) return null;
  if (producer) return producer;

  const kafkaSasl = process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD
    ? {
        ssl: true,
        sasl: {
          mechanism: 'scram-sha-256',
          username: process.env.KAFKA_SASL_USERNAME,
          password: process.env.KAFKA_SASL_PASSWORD,
        },
      }
    : {};

  const kafka = new Kafka({
    clientId: 'scraper-service',
    brokers: KAFKA_BROKERS,
    retry: { retries: 3 },
    ...kafkaSasl,
  });

  producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });

  await producer.connect();
  logger.info('[Kafka] Producer connected');
  return producer;
};

/**
 * Publish an array of new article IDs to Kafka
 * @param {string[]} articleIds
 */
const publishNewArticles = async (articleIds) => {
  if (!KAFKA_ENABLED || !articleIds.length) return;

  try {
    const p = await getProducer();
    if (!p) return;

    await p.send({
      topic: TOPIC_NEW_ARTICLES,
      messages: articleIds.map(id => ({
        key: id,
        value: JSON.stringify({ articleId: id, timestamp: new Date().toISOString() }),
      })),
    });
    logger.info(`[Kafka] Published ${articleIds.length} new article IDs`);
  } catch (err) {
    logger.error(`[Kafka] Publish failed: ${err.message}`);
    throw err;
  }
};

const disconnect = async () => {
  if (producer) {
    await producer.disconnect().catch(() => {});
    producer = null;
  }
};

module.exports = { publishNewArticles, disconnect };

