#!/usr/bin/env bash
# ============================================================
# verify_db.sh — Verify DB is ready for the scraper
# Usage: bash backend/scripts/verify_db.sh
# ============================================================

set -euo pipefail

PG_CONTAINER="${POSTGRES_CONTAINER:-sd_postgres}"
PG_USER="${POSTGRES_USER:-sd_user}"
PG_DB="${POSTGRES_DB:-samachar_daily}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "   $1"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  SamacharDaily — DB Verification                     ║"
echo "╚══════════════════════════════════════════════════════╝"

# 1. Postgres reachable
echo ""
echo "1. Postgres connection"
if docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" > /dev/null 2>&1; then
  pass "Postgres is reachable"
else
  fail "Cannot connect to Postgres container '$PG_CONTAINER'"
fi

# 2. Tables exist
echo ""
echo "2. Required tables"
TABLES=("users" "categories" "articles" "bookmarks" "user_article_interactions" "read_history")
for tbl in "${TABLES[@]}"; do
  COUNT=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$tbl';")
  if [ "$COUNT" -eq 1 ]; then
    pass "Table: $tbl"
  else
    fail "Missing table: $tbl — run migrations!"
  fi
done

# 3. Articles columns
echo ""
echo "3. Articles table columns"
COLS=("trending_score" "view_count" "like_count" "share_count" "is_premium" "is_breaking")
for col in "${COLS[@]}"; do
  EXISTS=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='articles' AND column_name='$col';")
  if [ "$EXISTS" -eq 1 ]; then
    pass "Column: articles.$col"
  else
    fail "Missing column: articles.$col"
  fi
done

# 4. Interactions metadata column
echo ""
echo "4. Interactions metadata column"
EXISTS=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='user_article_interactions' AND column_name='metadata';")
if [ "$EXISTS" -eq 1 ]; then
  pass "Column: user_article_interactions.metadata"
else
  warn "Missing metadata column — run V14 migration"
  echo "  Fix: docker exec -i $PG_CONTAINER psql -U $PG_USER -d $PG_DB -c 'ALTER TABLE user_article_interactions ADD COLUMN IF NOT EXISTS metadata JSONB;'"
fi

# 5. Categories per language
echo ""
echo "5. Categories seeded per language"
EXPECTED_LANGS=("en" "hi" "te" "ta" "kn" "mr" "bn" "gu" "pa" "ml")
ALL_OK=true
for lang in "${EXPECTED_LANGS[@]}"; do
  COUNT=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc \
    "SELECT COUNT(*) FROM categories WHERE language='$lang' AND is_active=TRUE;")
  COUNT=$(echo "$COUNT" | tr -d '[:space:]')
  if [ "$COUNT" -ge 8 ]; then
    pass "Language $lang: $COUNT categories"
  else
    fail "Language $lang: only $COUNT categories (need ≥8) — run V13 migration!"
    ALL_OK=false
  fi
done

# 6. Indexes
echo ""
echo "6. Key indexes"
INDEXES=("idx_articles_language_published" "idx_articles_trending_score" "idx_articles_source_url")
for idx in "${INDEXES[@]}"; do
  EXISTS=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc \
    "SELECT COUNT(*) FROM pg_indexes WHERE indexname='$idx';")
  if [ "$EXISTS" -eq 1 ]; then
    pass "Index: $idx"
  else
    warn "Missing index: $idx"
  fi
done

# 7. Summary stats
echo ""
echo "7. Current row counts"
for tbl in categories articles bookmarks; do
  COUNT=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc "SELECT COUNT(*) FROM $tbl;" | tr -d '[:space:]')
  info "$tbl: $COUNT rows"
done

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ DB verification complete — ready for scraper!    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Next step: trigger a scrape run:"
echo "  curl -X POST http://localhost:3007/api/v1/scrape"
echo ""

