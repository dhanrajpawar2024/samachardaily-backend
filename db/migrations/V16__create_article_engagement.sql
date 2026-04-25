-- ============================================================
-- V16: Article engagement
-- ============================================================
-- Supports article detail screen likes, comments, and view counts.
-- ============================================================

ALTER TYPE interaction_action ADD VALUE IF NOT EXISTS 'comment';

CREATE TABLE IF NOT EXISTS article_likes (
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id  UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

CREATE TABLE IF NOT EXISTS article_comments (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id  UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT        NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 2000),
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_article_comments_updated_at'
    ) THEN
        CREATE TRIGGER set_article_comments_updated_at
            BEFORE UPDATE ON article_comments
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_article_likes_article
    ON article_likes(article_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_comments_article_created
    ON article_comments(article_id, created_at DESC)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_article_comments_user_created
    ON article_comments(user_id, created_at DESC)
    WHERE is_deleted = FALSE;
