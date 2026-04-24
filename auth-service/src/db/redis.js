const { createClient } = require('redis');

const redisClient = createClient(
  process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        socket: {
          host: process.env.REDIS_HOST || 'redis',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '1'),
      }
);

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('[Redis] Connected'));
redisClient.on('ready', () => console.log('[Redis] Ready'));

/**
 * Connect to Redis
 */
const connect = async () => {
  try {
    await redisClient.connect();
    console.log('[Redis] Connection established');
  } catch (error) {
    console.error('[Redis] Connection failed:', error);
    throw error;
  }
};

/**
 * Set value with optional TTL (in seconds)
 */
const set = async (key, value, ttl = null) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, stringValue);
    } else {
      await redisClient.set(key, stringValue);
    }
    console.log(`[Redis] SET ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
  } catch (error) {
    console.error('[Redis] SET error:', error);
    throw error;
  }
};

/**
 * Get value
 */
const get = async (key) => {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('[Redis] GET error:', error);
    return null;
  }
};

/**
 * Delete key
 */
const del = async (key) => {
  try {
    await redisClient.del(key);
    console.log(`[Redis] DEL ${key}`);
  } catch (error) {
    console.error('[Redis] DEL error:', error);
  }
};

/**
 * Clear entire DB
 */
const flushDb = async () => {
  try {
    await redisClient.flushDb();
    console.log('[Redis] Database cleared');
  } catch (error) {
    console.error('[Redis] Flush error:', error);
  }
};

/**
 * Disconnect from Redis
 */
const disconnect = async () => {
  try {
    await redisClient.disconnect();
    console.log('[Redis] Disconnected');
  } catch (error) {
    console.error('[Redis] Disconnect error:', error);
  }
};

module.exports = {
  connect,
  set,
  get,
  del,
  flushDb,
  disconnect,
};


