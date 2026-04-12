/**
 * SmartWaste — db/pool.js
 * Member 2 — Backend Developer
 *
 * PostgreSQL connection pool using the 'pg' library.
 * All backend services use this single pool instance.
 * Never import this in frontend code.
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'smartwaste',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  // Connection pool settings
  max:              10,    // max simultaneous connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Verify connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('[DB] ❌ Connection failed:', err.message);
    console.error('[DB] Make sure PostgreSQL is running and .env is configured');
  } else {
    console.log('[DB] ✅ Connected to PostgreSQL at', res.rows[0].now);
  }
});

module.exports = pool;
