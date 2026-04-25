-- ============================================================
-- V17: Extend ad placements for admin-managed web ads
-- ============================================================
-- Supports Google Ads, Meta, or any third-party HTML/script snippet
-- controlled from the admin dashboard.
-- ============================================================

ALTER TABLE ad_placements
  ADD COLUMN IF NOT EXISTS name VARCHAR(160),
  ADD COLUMN IF NOT EXISTS provider VARCHAR(40) NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS placement_type VARCHAR(40) NOT NULL DEFAULT 'script',
  ADD COLUMN IF NOT EXISTS html_snippet TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS target_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE ad_placements
  ALTER COLUMN ad_unit_id DROP NOT NULL;

UPDATE ad_placements
SET name = COALESCE(name, position_key)
WHERE name IS NULL;

CREATE INDEX IF NOT EXISTS idx_ad_placements_active_position
  ON ad_placements(position_key, language, sort_order)
  WHERE is_active = TRUE;
