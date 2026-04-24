-- ============================================================
-- V1: Users
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram index for LIKE search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- accent-insensitive search

CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email            VARCHAR(320) UNIQUE,
    phone            VARCHAR(20)  UNIQUE,
    name             VARCHAR(255) NOT NULL,
    avatar_url       TEXT,
    preferred_languages  TEXT[]   NOT NULL DEFAULT ARRAY['en'],
    provider         VARCHAR(32)  NOT NULL DEFAULT 'google',   -- google | facebook | phone
    provider_id      VARCHAR(255),
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

