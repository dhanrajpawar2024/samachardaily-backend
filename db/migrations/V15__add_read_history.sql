-- ============================================================
-- V15: Read History — "Continue Reading" feature
-- ============================================================
-- Tracks which articles a user has read, how far they got,
-- and when — enabling "Continue Reading" in the Android app
-- and web portal.
-- ============================================================

CREATE TABLE read_history (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id      UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    -- 0.0 = opened, 1.0 = fully read
    read_progress   FLOAT       NOT NULL DEFAULT 0.0
                                CHECK (read_progress >= 0.0 AND read_progress <= 1.0),
    -- Total seconds the user spent on the article
    time_spent_sec  INT         NOT NULL DEFAULT 0,
    first_read_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, article_id)
);

CREATE TRIGGER set_read_history_last_read_at
    BEFORE UPDATE ON read_history
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Index for "Continue Reading" feed query (recent reads, incomplete)
CREATE INDEX idx_read_history_user_recent
    ON read_history(user_id, last_read_at DESC)
    WHERE read_progress < 1.0;

-- Index for "Already Read" deduplication in feed
CREATE INDEX idx_read_history_user_article
    ON read_history(user_id, article_id);

-- ── Stored procedure to upsert read progress ─────────────────
-- Called by app every time user closes an article
CREATE OR REPLACE FUNCTION upsert_read_progress(
    p_user_id       UUID,
    p_article_id    UUID,
    p_progress      FLOAT,
    p_time_spent    INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO read_history (user_id, article_id, read_progress, time_spent_sec)
    VALUES (p_user_id, p_article_id, p_progress, p_time_spent)
    ON CONFLICT (user_id, article_id) DO UPDATE
        SET read_progress  = GREATEST(read_history.read_progress, EXCLUDED.read_progress),
            time_spent_sec = read_history.time_spent_sec + EXCLUDED.time_spent_sec,
            last_read_at   = NOW();

    -- Record as 'view' interaction if not already there (dedup by day)
    INSERT INTO user_article_interactions (user_id, article_id, action, metadata)
    VALUES (
        p_user_id, p_article_id, 'view',
        jsonb_build_object('progress', p_progress, 'time_spent', p_time_spent)
    )
    ON CONFLICT DO NOTHING;

    -- Increment view_count on the article
    UPDATE articles SET view_count = view_count + 1 WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql;

