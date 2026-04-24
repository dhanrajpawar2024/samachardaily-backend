#!/usr/bin/env bash
# ============================================================
#  Health check for all SamacharDaily infrastructure services
#  Usage: ./scripts/health-check.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}  ✅ $1${NC}"; }
fail() { echo -e "${RED}  ❌ $1${NC}"; }
info() { echo -e "${YELLOW}  ℹ  $1${NC}"; }

echo ""
echo "════════════════════════════════════════"
echo "  SamacharDaily Infrastructure Health"
echo "════════════════════════════════════════"

# ── PostgreSQL ──────────────────────────────────────────────
echo ""
echo "PostgreSQL (5432)"
if pg_isready -h localhost -p 5432 -U "${POSTGRES_USER:-sd_user}" &>/dev/null; then
  pass "Accepting connections"
  TABLE_COUNT=$(psql "${DATABASE_URL:-postgresql://sd_user:sd_secret@localhost:5432/samachar_daily}" \
    -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "?")
  info "Tables in public schema: $TABLE_COUNT"
else
  fail "Not reachable"
fi

# ── Redis ───────────────────────────────────────────────────
echo ""
echo "Redis (6379)"
if redis-cli -h localhost -p 6379 -a "${REDIS_PASSWORD:-redis_secret}" ping 2>/dev/null | grep -q PONG; then
  pass "PONG received"
  KEY_COUNT=$(redis-cli -h localhost -p 6379 -a "${REDIS_PASSWORD:-redis_secret}" DBSIZE 2>/dev/null || echo "?")
  info "Keys in DB: $KEY_COUNT"
else
  fail "Not reachable"
fi

# ── Kafka ───────────────────────────────────────────────────
echo ""
echo "Kafka (9094)"
if kafka-topics.sh --bootstrap-server localhost:9094 --list &>/dev/null; then
  pass "Broker reachable"
  TOPIC_COUNT=$(kafka-topics.sh --bootstrap-server localhost:9094 --list 2>/dev/null | wc -l)
  info "Topics: $TOPIC_COUNT"
else
  fail "Not reachable (run create-kafka-topics.sh first)"
fi

# ── Elasticsearch ───────────────────────────────────────────
echo ""
echo "Elasticsearch (9200)"
if curl -sf http://localhost:9200/_cluster/health &>/dev/null; then
  STATUS=$(curl -sf http://localhost:9200/_cluster/health | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "?")
  pass "Reachable — cluster status: $STATUS"
else
  fail "Not reachable"
fi

# ── UIs ─────────────────────────────────────────────────────
echo ""
echo "Web UIs"
curl -sf http://localhost:8080 &>/dev/null && pass "Kafka UI      → http://localhost:8080" || fail "Kafka UI not ready"
curl -sf http://localhost:8081 &>/dev/null && pass "Adminer       → http://localhost:8081" || fail "Adminer not ready"
curl -sf http://localhost:8082 &>/dev/null && pass "Redis UI      → http://localhost:8082" || fail "Redis UI not ready"
curl -sf http://localhost:5601 &>/dev/null && pass "Kibana        → http://localhost:5601" || fail "Kibana not ready"

echo ""
echo "════════════════════════════════════════"

