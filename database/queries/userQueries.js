/**
 * database/queries/userQueries.js
 * SQL query helpers for the users table.
 * Used by authController when PostgreSQL is available.
 */

const FIND_BY_EMAIL = `
  SELECT id, name, email, password, role, created_at
  FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`;

const INSERT_USER = `
  INSERT INTO users (name, email, password, role)
  VALUES ($1, $2, $3, $4)
  RETURNING id, name, email, role, created_at`;

const EMAIL_EXISTS = `
  SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`;

module.exports = { FIND_BY_EMAIL, INSERT_USER, EMAIL_EXISTS };
