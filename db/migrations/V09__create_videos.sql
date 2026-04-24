-- ============================================================
-- V9: Short Videos
-- ============================================================

CREATE TABLE videos (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    title          TEXT         NOT NULL,
    description    TEXT,
    video_url      TEXT         NOT NULL,
    thumbnail_url  TEXT,
    author_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
    author_name    VARCHAR(255),
    duration_ms    BIGINT       NOT NULL DEFAULT 0,  -- milliseconds
    language       CHAR(2)      NOT NULL,
    category_id    UUID         REFERENCES categories(id) ON DELETE SET NULL,
    view_count     INT          NOT NULL DEFAULT 0,
    like_count     INT          NOT NULL DEFAULT 0,
    share_count    INT          NOT NULL DEFAULT 0,
    is_published   BOOLEAN      NOT NULL DEFAULT TRUE,
    published_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

