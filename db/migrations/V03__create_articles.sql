-- ============================================================
-- V3: Articles
-- ============================================================

CREATE TABLE articles (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    title          TEXT         NOT NULL,
    summary        TEXT,
    content        TEXT,
    author         VARCHAR(255),
    source_url     TEXT         NOT NULL UNIQUE,
    source_name    VARCHAR(255) NOT NULL,
    category_id    UUID         REFERENCES categories(id) ON DELETE SET NULL,
    language       CHAR(2)      NOT NULL,
    thumbnail_url  TEXT,
    published_at   TIMESTAMPTZ  NOT NULL,
    view_count     INT          NOT NULL DEFAULT 0,
    like_count     INT          NOT NULL DEFAULT 0,
    share_count    INT          NOT NULL DEFAULT 0,
    comment_count  INT          NOT NULL DEFAULT 0,
    is_premium     BOOLEAN      NOT NULL DEFAULT FALSE,
    is_breaking    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_published   BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Feed ranking pre-computed score (refreshed by Feed Service worker)
    trending_score FLOAT        NOT NULL DEFAULT 0.0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

