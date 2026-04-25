-- ============================================================
-- apply_on_existing_db.sql
-- ============================================================
-- Run this if your Docker Postgres volume already exists and
-- you DON'T want to wipe it (docker compose down -v).
--
-- Usage:
--   docker exec -i sd_postgres psql -U sd_user -d samachar_daily \
--     < backend/db/apply_on_existing_db.sql
-- ============================================================

\echo '→ V13: Seeding categories for all 10 languages...'
\i /docker-entrypoint-initdb.d/V13__seed_categories_all_languages.sql

\echo '→ V14: Adding metadata column + indexes to interactions...'
\i /docker-entrypoint-initdb.d/V14__fix_interactions_metadata.sql

\echo '→ V15: Creating read_history table...'
\i /docker-entrypoint-initdb.d/V15__add_read_history.sql

\echo '→ V16: Creating article engagement tables...'
\i /docker-entrypoint-initdb.d/V16__create_article_engagement.sql

\echo '→ V17: Extending ad placements...'
\i /docker-entrypoint-initdb.d/V17__extend_ad_placements.sql

\echo ''
\echo '=== Verification ==='
SELECT language, COUNT(*) as category_count
FROM categories
WHERE is_active = TRUE
GROUP BY language
ORDER BY language;

\echo ''
\echo '=== Articles table columns ==='
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'articles'
ORDER BY ordinal_position;

\echo ''
\echo '✅ Done! All migrations applied.'

