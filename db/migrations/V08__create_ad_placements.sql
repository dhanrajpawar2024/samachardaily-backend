-- ============================================================
-- V8: Ad Placements
-- ============================================================

CREATE TABLE ad_placements (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_key    VARCHAR(100) NOT NULL UNIQUE, -- e.g. "feed_after_5", "article_bottom"
    article_id_after INT,        -- insert ad after Nth article in feed (nullable)
    ad_unit_id      VARCHAR(255) NOT NULL,
    language        CHAR(2),     -- NULL = show for all languages
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

