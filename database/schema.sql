-- ============================================================
-- database/schema.sql  — SmartWaste PostgreSQL Schema
-- Run: psql $DATABASE_URL -f database/schema.sql
-- ============================================================

DROP TABLE IF EXISTS fill_history CASCADE;
DROP TABLE IF EXISTS bins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  DEFAULT 'operator',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE bins (
  id          SERIAL PRIMARY KEY,
  location    VARCHAR(255) NOT NULL,
  zone        CHAR(1)      NOT NULL CHECK (zone IN ('A','B','C','D')),
  lat         NUMERIC(10,7) NOT NULL,
  lng         NUMERIC(10,7) NOT NULL,
  is_active   BOOLEAN      DEFAULT true,
  installed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fill_history (
  id          SERIAL PRIMARY KEY,
  bin_id      INTEGER      NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
  fill_pct    NUMERIC(5,2) NOT NULL CHECK (fill_pct BETWEEN 0 AND 100),
  priority    NUMERIC(5,2) NOT NULL,
  recorded_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_fill_bin   ON fill_history(bin_id);
CREATE INDEX idx_fill_time  ON fill_history(recorded_at DESC);

-- View: latest fill per bin (used by GET /api/bins)
CREATE OR REPLACE VIEW latest_bin_fills AS
SELECT b.id, b.location, b.zone, b.lat, b.lng,
       COALESCE(h.fill_pct, 0) AS fill_pct,
       COALESCE(h.priority, 0) AS priority,
       h.recorded_at
FROM   bins b
LEFT JOIN LATERAL (
  SELECT fill_pct, priority, recorded_at
  FROM   fill_history WHERE bin_id = b.id
  ORDER  BY recorded_at DESC LIMIT 1
) h ON true
WHERE  b.is_active = true
ORDER  BY b.id;
