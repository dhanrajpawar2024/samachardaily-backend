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
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute a query against the database
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise}
 */
const query = async (query, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(query, params);
    const duration = Date.now() - start;
    console.log(`[DB] Query executed in ${duration}ms`, { query: query.substring(0, 50) });
    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
};

/**
 * Get a single row
 */
const getOne = async (query, params = []) => {
  const result = await query(query, params);
  return result.rows[0] || null;
};

/**
 * Get all rows
 */
const getAll = async (query, params = []) => {
  const result = await query(query, params);
  return result.rows;
};

module.exports = {
  pool,
  query,
  getOne,
  getAll,
};
