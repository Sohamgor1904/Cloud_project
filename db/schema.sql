-- ============================================================
-- SmartWaste — Database Schema
-- Member 3 — Database & Deployment
-- PostgreSQL 14+
-- Run: psql $DATABASE_URL -f db/schema.sql
-- ============================================================

-- Drop existing tables (for clean re-run during development)
DROP TABLE IF EXISTS fill_history CASCADE;
DROP TABLE IF EXISTS bins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── USERS (for login/signup) ─────────────────────────────────
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,      -- hashed in production
  role        VARCHAR(20)  DEFAULT 'operator',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── BINS (master registry of all bins) ──────────────────────
CREATE TABLE bins (
  id          SERIAL PRIMARY KEY,
  location    VARCHAR(255) NOT NULL,
  zone        CHAR(1)      NOT NULL CHECK (zone IN ('A','B','C','D')),
  lat         NUMERIC(10,7) NOT NULL,
  lng         NUMERIC(10,7) NOT NULL,
  capacity_l  INTEGER      DEFAULT 240,  -- litres
  is_active   BOOLEAN      DEFAULT true,
  installed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FILL_HISTORY (one row per simulation run per bin) ────────
CREATE TABLE fill_history (
  id          SERIAL PRIMARY KEY,
  bin_id      INTEGER      NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
  fill_pct    NUMERIC(5,2) NOT NULL CHECK (fill_pct BETWEEN 0 AND 100),
  priority    NUMERIC(5,2) NOT NULL,
  recorded_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_fill_history_bin_id    ON fill_history(bin_id);
CREATE INDEX idx_fill_history_recorded  ON fill_history(recorded_at DESC);
CREATE INDEX idx_bins_zone              ON bins(zone);

-- ── LATEST FILL VIEW (Member 2 uses this for /api/bins) ──────
CREATE OR REPLACE VIEW latest_bin_fills AS
SELECT
  b.id,
  b.location,
  b.zone,
  b.lat,
  b.lng,
  COALESCE(fh.fill_pct, 0)   AS fill_pct,
  COALESCE(fh.priority, 0)   AS priority,
  fh.recorded_at
FROM bins b
LEFT JOIN LATERAL (
  SELECT fill_pct, priority, recorded_at
  FROM   fill_history
  WHERE  bin_id = b.id
  ORDER  BY recorded_at DESC
  LIMIT  1
) fh ON true
WHERE b.is_active = true
ORDER BY b.id;

COMMENT ON VIEW latest_bin_fills IS
  'Returns the most recent fill_pct and priority for every active bin. Used by GET /api/bins.';
