-- ============================================================
-- V11: Indexes — performance-critical queries
-- ============================================================

-- ── Users ───────────────────────────────────────────────────
CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_phone           ON users(phone);
CREATE INDEX idx_users_provider        ON users(provider, provider_id);

-- ── Articles ────────────────────────────────────────────────
-- Feed query: language + published_at DESC (most common query)
CREATE INDEX idx_articles_language_published
    ON articles(language, published_at DESC)
    WHERE is_published = TRUE;

-- Category feed
CREATE INDEX idx_articles_category_language
    ON articles(category_id, language, published_at DESC)
    WHERE is_published = TRUE;

-- Breaking news tab
CREATE INDEX idx_articles_breaking
    ON articles(language, published_at DESC)
    WHERE is_breaking = TRUE AND is_published = TRUE;

-- Trending score (Feed Service ranking)
CREATE INDEX idx_articles_trending_score
    ON articles(language, trending_score DESC, published_at DESC)
    WHERE is_published = TRUE;

-- Full-text search (fallback if ES is unavailable)
CREATE INDEX idx_articles_title_fts
    ON articles USING gin(to_tsvector('simple', title));

-- Dedup on source_url
CREATE UNIQUE INDEX idx_articles_source_url ON articles(source_url);

-- ── Interactions ────────────────────────────────────────────
-- Personalisation: user's recent interactions
CREATE INDEX idx_interactions_user_timestamp
    ON user_article_interactions(user_id, timestamp DESC);

-- Per-article engagement count
CREATE INDEX idx_interactions_article_action
    ON user_article_interactions(article_id, action);

-- Affinity calculation (last 30 days window)
CREATE INDEX idx_interactions_user_category
    ON user_article_interactions(user_id, timestamp DESC)
    INCLUDE (article_id, action);

-- ── Bookmarks ───────────────────────────────────────────────
CREATE INDEX idx_bookmarks_user_created
    ON bookmarks(user_id, created_at DESC);

-- ── Notifications ───────────────────────────────────────────
CREATE INDEX idx_notifications_user_created
    ON notifications(user_id, created_at DESC)
    WHERE is_read = FALSE;

-- ── FCM Tokens ──────────────────────────────────────────────
CREATE INDEX idx_fcm_tokens_user   ON fcm_tokens(user_id);
CREATE UNIQUE INDEX idx_fcm_token  ON fcm_tokens(token);

-- ── Refresh Tokens ──────────────────────────────────────────
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, expires_at)
    WHERE revoked = FALSE;

-- ── Tags ────────────────────────────────────────────────────
CREATE INDEX idx_tags_name_lang ON tags(name, language);
CREATE INDEX idx_article_tags_article ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag     ON article_tags(tag_id);

-- ── Videos ──────────────────────────────────────────────────
CREATE INDEX idx_videos_language_published
    ON videos(language, published_at DESC)
    WHERE is_published = TRUE;

-- ── Categories ──────────────────────────────────────────────
CREATE INDEX idx_categories_language ON categories(language, sort_order)
    WHERE is_active = TRUE;

-- ── User Category Prefs ─────────────────────────────────────
CREATE INDEX idx_user_cat_prefs_user ON user_category_prefs(user_id, weight DESC);

