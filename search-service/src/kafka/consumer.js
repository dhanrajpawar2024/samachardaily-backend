const { Kafka } = require('kafkajs');
const elasticsearch = require('../db/elasticsearch');

let consumer = null;

const buildKafkaConfig = () => {
  const config = {
    clientId: process.env.KAFKA_CLIENT_ID || 'search-service',
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
      groupId: process.env.KAFKA_GROUP_ID || 'search-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();
    console.log('[Kafka] Consumer connected');

    // Subscribe to article ingestion events
    await consumer.subscribe({
      topic: process.env.KAFKA_TOPIC_ARTICLES || 'article_ingestion',
      fromBeginning: false,
    });

    console.log('[Kafka] Subscribed to article_ingestion topic');

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          
          if (event.action === 'article_created' || event.action === 'article_updated') {
            const article = event.data;
            
            console.log(`[Kafka] Indexing article: ${article.id}`);
            
            // Prepare article for indexing
            const indexPayload = {
              id: article.id,
              title: article.title,
              description: article.description,
              content: article.content || '',
              category_id: article.category_id,
              category_name: article.category_name || '',
              author: article.author || '',
              source: article.source,
              language: article.language || 'en',
              image_url: article.image_url || '',
              source_url: article.source_url,
              published_at: article.published_at,
              created_at: new Date().toISOString(),
              trending_score: article.trending_score || 0,
              is_published: article.is_published !== false,
              tags: article.tags || [],
            };

            await elasticsearch.indexArticle(indexPayload);
          } else if (event.action === 'article_deleted') {
            console.log(`[Kafka] Deleting article from index: ${event.data.id}`);
            // TODO: Implement deletion if needed
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
