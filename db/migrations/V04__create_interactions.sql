-- ============================================================
-- V4: User–Article Interactions (clickstream)
-- ============================================================

CREATE TYPE interaction_action AS ENUM ('view', 'like', 'share', 'bookmark', 'skip', 'unlike');

CREATE TABLE user_article_interactions (
    id               UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id       UUID             NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    action           interaction_action NOT NULL,
    duration_seconds INT,             -- seconds spent reading (for 'view' action)
    timestamp        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
-- Partitioned by month for efficient retention queries (optional — add later)

