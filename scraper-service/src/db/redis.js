const redis = require('redis');
const logger = require('../utils/logger');

let client = null;
let redisDisabled = false;

const getErrorMessage = (err) => {
  if (!err) return 'Unknown Redis error';
  if (typeof err === 'string') return err;
  return err.message || err.code || String(err);
};

const connect = async () => {
  if (redisDisabled) return null;
  if (!process.env.REDIS_URL) {
    redisDisabled = true;
    logger.warn('[Redis] REDIS_URL not set, Redis cache disabled');
    return null;
  }
  if (client?.isOpen) return client;
  client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 5000) },
  });
  client.on('error', (err) => logger.error('[Redis] Error', {
    error: getErrorMessage(err),
    code: err?.code,
  }));
  client.on('reconnecting', () => logger.info('[Redis] Reconnecting...'));
  await client.connect();
  logger.info('[Redis] Connected');
  return client;
};

const get = async (key) => {
  try {
    const c = await connect();
    if (!c) return null;
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    logger.warn(`[Redis] GET failed for ${key}: ${getErrorMessage(err)}`);
    return null;
  }
};

const set = async (key, value, ttlSeconds) => {
  try {
    const c = await connect();
    if (!c) return;
    const opts = ttlSeconds ? { EX: ttlSeconds } : {};
    await c.set(key, JSON.stringify(value), opts);
  } catch (err) {
    logger.warn(`[Redis] SET failed for ${key}: ${getErrorMessage(err)}`);
  }
};

const del = async (key) => {
  try {
    const c = await connect();
    if (!c) return;
    await c.del(key);
  } catch (err) {
    logger.warn(`[Redis] DEL failed for ${key}: ${getErrorMessage(err)}`);
  }
};

module.exports = { connect, get, set, del };

