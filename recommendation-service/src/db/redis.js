const redis = require('redis');

let client;

/**
 * Connect to Redis
 */
const connect = async () => {
  client = redis.createClient(
    process.env.REDIS_URL
      ? { url: process.env.REDIS_URL }
      : {
          socket: {
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                return new Error('Max Redis retries reached');
              }
              return retries * 50;
            },
          },
          password: process.env.REDIS_PASSWORD || 'redis_secret',
          database: parseInt(process.env.REDIS_DB || '6'),
        }
  );

  client.on('error', (err) => {
    console.error('[Recommendation Service] Redis error:', err);
  });

  client.on('connect', () => {
    console.log('[Recommendation Service] Redis connected');
  });

  await client.connect();
};

/**
 * Set value in Redis with optional TTL
 */
const set = async (key, value, ttlSeconds) => {
  const jsonValue = JSON.stringify(value);
  if (ttlSeconds) {
    await client.setEx(key, ttlSeconds, jsonValue);
  } else {
    await client.set(key, jsonValue);
  }
};

/**
 * Get value from Redis
 */
const get = async (key) => {
  const value = await client.get(key);
  if (value) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return null;
};

/**
 * Delete key
 */
const del = async (key) => {
  await client.del(key);
};

/**
 * Get client
 */
const getClient = () => client;

module.exports = {
  connect,
  set,
  get,
  del,
  getClient,
};




