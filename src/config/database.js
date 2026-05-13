const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle DB client', err);
});

const query = async (text, params) => {
  const start = Date.now();

  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`DB query executed in ${duration}ms`);
    return res;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool,
};