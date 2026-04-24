-- ============================================================
-- V10: FCM Tokens & Refresh Tokens
-- ============================================================

CREATE TABLE fcm_tokens (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT         NOT NULL UNIQUE,
    platform    VARCHAR(20)  NOT NULL DEFAULT 'android',  -- android | ios | web
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT        NOT NULL UNIQUE,  -- SHA-256 of the token
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

