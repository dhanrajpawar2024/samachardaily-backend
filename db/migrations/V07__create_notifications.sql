-- ============================================================
-- V7: Notifications
-- ============================================================

CREATE TYPE notification_type AS ENUM ('article', 'video', 'breaking', 'promo', 'system');

CREATE TABLE notifications (
    id           UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID              REFERENCES users(id) ON DELETE CASCADE,  -- NULL = broadcast
    title        VARCHAR(255)      NOT NULL,
    body         TEXT              NOT NULL,
    type         notification_type NOT NULL DEFAULT 'article',
    payload_json JSONB,            -- { article_id, video_id, deep_link, ... }
    is_read      BOOLEAN           NOT NULL DEFAULT FALSE,
    sent_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

