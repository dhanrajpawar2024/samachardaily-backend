const { Pool } = require('pg');
const logger = require('../utils/logger');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host:     process.env.POSTGRES_HOST     || 'localhost',
      port:     parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB       || 'samachar_daily',
      user:     process.env.POSTGRES_USER     || 'sd_user',
      password: process.env.POSTGRES_PASSWORD || 'sd_secret',
    };

const pool = new Pool({
  ...poolConfig,
  max:      10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => logger.error('[PG] Unexpected error', { err: err.message }));

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    logger.debug(`[PG] query(${Date.now() - start}ms): ${text.substring(0, 60)}`);
    return res;
  } catch (err) {
    logger.error('[PG] Query error', { err: err.message, text: text.substring(0, 80) });
    throw err;
  }
};

const getOne = async (text, params) => {
  const res = await query(text, params);
  return res.rows[0] || null;
};

const getAll = async (text, params) => {
  const res = await query(text, params);
  return res.rows;
};

module.exports = { pool, query, getOne, getAll };

