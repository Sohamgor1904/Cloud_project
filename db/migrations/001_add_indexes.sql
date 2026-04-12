-- ============================================================
-- SmartWaste — Migration 001
-- Member 3 — Database & Deployment
-- Adds performance indexes post Day 1
-- ============================================================

-- Run: psql $DATABASE_URL -f db/migrations/001_add_indexes.sql

CREATE INDEX IF NOT EXISTS idx_fill_history_composite
  ON fill_history(bin_id, recorded_at DESC);

COMMENT ON INDEX idx_fill_history_composite IS
  'Composite index — speeds up the LATERAL join in latest_bin_fills view.';
