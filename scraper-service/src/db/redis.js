const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

const connect = async () => {
  if (client?.isOpen) return client;
  client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 5000) },
  });
  client.on('error', (err) => logger.error('[Redis] Error', { err: err.message }));
  client.on('reconnecting', () => logger.info('[Redis] Reconnecting...'));
  await client.connect();
  logger.info('[Redis] Connected');
  return client;
};

const get = async (key) => {
  try {
    const c = await connect();
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    logger.warn(`[Redis] GET failed for ${key}: ${err.message}`);
    return null;
  }
};

const set = async (key, value, ttlSeconds) => {
  try {
    const c = await connect();
    const opts = ttlSeconds ? { EX: ttlSeconds } : {};
    await c.set(key, JSON.stringify(value), opts);
  } catch (err) {
    logger.warn(`[Redis] SET failed for ${key}: ${err.message}`);
  }
};

const del = async (key) => {
  try {
    const c = await connect();
    await c.del(key);
  } catch (err) {
    logger.warn(`[Redis] DEL failed for ${key}: ${err.message}`);
  }
};

module.exports = { connect, get, set, del };

