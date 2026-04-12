-- database/migrations/001_initial.sql
-- Performance index added after Day 1 setup

CREATE INDEX IF NOT EXISTS idx_fill_composite
  ON fill_history(bin_id, recorded_at DESC);
