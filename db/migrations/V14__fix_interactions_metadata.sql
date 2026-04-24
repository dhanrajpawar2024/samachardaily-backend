-- ============================================================
-- V14: Fix user_article_interactions — add metadata column
-- ============================================================
-- Bug: feed-service/src/services/interactions.js inserts a
-- `metadata` JSONB column that does not exist in V04.
-- This patch adds it safely.
-- ============================================================

ALTER TABLE user_article_interactions
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Also add an index for fast user timeline lookups
CREATE INDEX IF NOT EXISTS idx_interactions_user_article
  ON user_article_interactions(user_id, article_id);

-- And a partial index to quickly find a user's 'view' interactions
-- (used by read-history queries)
CREATE INDEX IF NOT EXISTS idx_interactions_user_view
  ON user_article_interactions(user_id, timestamp DESC)
  WHERE action = 'view';

