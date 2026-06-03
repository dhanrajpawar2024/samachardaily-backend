-- ============================================================
-- V15: Add country code to articles
-- ============================================================

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS country_code CHAR(2);

CREATE INDEX IF NOT EXISTS idx_articles_country_language_published_at
    ON articles (country_code, language, published_at DESC)
    WHERE is_published = TRUE;