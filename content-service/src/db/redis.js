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

const connect = async () => {
  try {
    await redisClient.connect();
    console.log('[Redis] Connection established');
  } catch (error) {
    console.error('[Redis] Connection failed:', error);
    throw error;
  }
};

const set = async (key, value, ttl = null) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, stringValue);
    } else {
      await redisClient.set(key, stringValue);
    }
  } catch (error) {
    console.error('[Redis] SET error:', error);
  }
};

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

const del = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('[Redis] DEL error:', error);
  }
};

module.exports = {
  connect,
  set,
  get,
  del,
};




