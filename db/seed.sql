-- ============================================================
-- SmartWaste — Seed Data
-- Member 3 — Database & Deployment
-- 22 bins across 4 GIFT City zones + 1 demo user
-- Run AFTER schema.sql: psql $DATABASE_URL -f db/seed.sql
-- ============================================================

-- Demo user (password: "demo123" — hash in production)
INSERT INTO users (name, email, password, role) VALUES
  ('Demo Operator', 'demo@smartwaste.in', 'demo123',      'operator'),
  ('Admin User',    'admin@smartwaste.in','admin123',      'admin')
ON CONFLICT (email) DO NOTHING;

-- ── Zone A — Financial District (NE) ────────────────────────
INSERT INTO bins (location, zone, lat, lng) VALUES
  ('Zone A – GIFT Tower Plaza',       'A', 23.1685000, 72.6835000),
  ('Zone A – Financial Hub Entrance', 'A', 23.1680000, 72.6843000),
  ('Zone A – Riverside Walk',         'A', 23.1673000, 72.6850000),
  ('Zone A – Central Park East',      'A', 23.1668000, 72.6828000),
  ('Zone A – Corporate Block 5',      'A', 23.1678000, 72.6820000),
  ('Zone A – Heritage Walk',          'A', 23.1663000, 72.6832000);

-- ── Zone B — Residential (SE) ──────────────────────────────
INSERT INTO bins (location, zone, lat, lng) VALUES
  ('Zone B – Sector 7 Residency',     'B', 23.1645000, 72.6840000),
  ('Zone B – Garden Apartments',      'B', 23.1638000, 72.6833000),
  ('Zone B – Metro Station North',    'B', 23.1632000, 72.6845000),
  ('Zone B – Community Hall',         'B', 23.1648000, 72.6855000),
  ('Zone B – School Road Junction',   'B', 23.1625000, 72.6852000),
  ('Zone B – Hospital Gate',          'B', 23.1640000, 72.6862000);

-- ── Zone C — Commercial (NW) ────────────────────────────────
INSERT INTO bins (location, zone, lat, lng) VALUES
  ('Zone C – Market Square',          'C', 23.1685000, 72.6768000),
  ('Zone C – Food Court Area',        'C', 23.1678000, 72.6778000),
  ('Zone C – Shopping Arcade',        'C', 23.1672000, 72.6788000),
  ('Zone C – Civic Centre',           'C', 23.1665000, 72.6762000),
  ('Zone C – Weekend Bazaar',         'C', 23.1682000, 72.6755000);

-- ── Zone D — Industrial (SW) ────────────────────────────────
INSERT INTO bins (location, zone, lat, lng) VALUES
  ('Zone D – Industrial Gate 1',      'D', 23.1638000, 72.6775000),
  ('Zone D – Logistics Hub',          'D', 23.1628000, 72.6762000),
  ('Zone D – Warehouse District',     'D', 23.1618000, 72.6770000),
  ('Zone D – Factory Row',            'D', 23.1632000, 72.6750000),
  ('Zone D – Export Terminal',        'D', 23.1642000, 72.6782000);

-- ── Initial fill_history (all bins at 0% on first run) ──────
INSERT INTO fill_history (bin_id, fill_pct, priority)
SELECT id, 0.00, 0.00 FROM bins;

SELECT 'Seed complete — ' || COUNT(*) || ' bins seeded.' AS result FROM bins;
