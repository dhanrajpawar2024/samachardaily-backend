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

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

const query = async (queryStr, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(queryStr, params);
    const duration = Date.now() - start;
    if (duration > 100) {
      console.log(`[DB] Slow query (${duration}ms)`);
    }
    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
};

const getOne = async (queryStr, params = []) => {
  const result = await query(queryStr, params);
  return result.rows[0] || null;
};

const getAll = async (queryStr, params = []) => {
  const result = await query(queryStr, params);
  return result.rows;
};

module.exports = {
  pool,
  query,
  getOne,
  getAll,
};
