/**
 * backend/config/db.js
 * PostgreSQL connection pool
 * Only used when DATABASE_URL or DB_HOST env vars are set.
 * Gracefully skipped when no DB is configured (app uses in-memory fallback).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');

if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
  throw new Error('No DB config — skipping pool (in-memory fallback will be used)');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max:      10,
  idleTimeoutMillis: 30000,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('[DB] ❌ Connection failed:', err.message);
  else     console.log('[DB] ✅ PostgreSQL connected at', res.rows[0].now);
});

module.exports = pool;
