const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'samachar_daily',
      user: process.env.POSTGRES_USER || 'sd_user',
      password: process.env.POSTGRES_PASSWORD || 'sd_secret',
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[Recommendation Service] Unexpected error on idle client', err);
});

/**
 * Execute query
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 100) {
      console.warn(`[Recommendation Service] Slow query (${duration}ms):`, text);
    }
    return result;
  } catch (error) {
    console.error('[Recommendation Service] Query error:', error);
    throw error;
  }
};

/**
 * Get single row
 */
const getOne = async (text, params) => {
  const result = await query(text, params);
  return result.rows[0];
};

/**
 * Get all rows
 */
const getAll = async (text, params) => {
  const result = await query(text, params);
  return result.rows;
};

module.exports = {
  pool,
  query,
  getOne,
  getAll,
};
