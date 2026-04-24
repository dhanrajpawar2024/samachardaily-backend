-- ============================================================
-- V2: Categories & User Category Preferences
-- ============================================================

CREATE TABLE categories (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(100) NOT NULL,
    slug         VARCHAR(100) NOT NULL,
    language     CHAR(2)      NOT NULL,    -- en | hi | mr
    icon_url     TEXT,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order   INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (slug, language)
);

CREATE TABLE user_category_prefs (
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  UUID         NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    weight       FLOAT        NOT NULL DEFAULT 1.0,  -- affinity score 0.0–5.0
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, category_id)
);

CREATE TRIGGER set_user_category_prefs_updated_at
    BEFORE UPDATE ON user_category_prefs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

