-- ============================================================
-- V5: Bookmarks
-- ============================================================

CREATE TABLE bookmarks (
    user_id     UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    article_id  UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

