#!/usr/bin/env bash
# ============================================================
#  Create all Kafka topics for SamacharDaily
#  Run AFTER: docker compose up -d kafka
#  Usage: ./scripts/create-kafka-topics.sh
# ============================================================

set -euo pipefail

BROKER="localhost:9094"
PARTITIONS=3
REPLICATION=1

TOPICS=(
  "clickstream"               # user interaction events (high volume)
  "article_ingestion"         # new articles from scrapers / RSS
  "breaking_news"             # breaking news events → FCM broadcast
  "notification_events"       # per-user notification triggers
  "feed_invalidation"         # invalidate Redis feed cache for a user/language
  "article_trending_update"   # updated trending_score per article
  "video_ingestion"           # new short videos
)

# High-retention topics (clickstream kept 7 days by default)
HIGH_RETENTION_MS=604800000   # 7 days
DEFAULT_RETENTION_MS=86400000 # 1 day

echo "⏳ Waiting for Kafka to be ready at $BROKER ..."
until kafka-topics.sh --bootstrap-server "$BROKER" --list &>/dev/null; do
  sleep 3
  echo "   still waiting..."
done
echo "✅ Kafka is ready."

for TOPIC in "${TOPICS[@]}"; do
  if kafka-topics.sh --bootstrap-server "$BROKER" --describe --topic "$TOPIC" &>/dev/null; then
    echo "⏭  Topic '$TOPIC' already exists — skipping."
  else
    RETENTION=$DEFAULT_RETENTION_MS
    [[ "$TOPIC" == "clickstream" ]] && RETENTION=$HIGH_RETENTION_MS

    kafka-topics.sh \
      --bootstrap-server "$BROKER" \
      --create \
      --topic "$TOPIC" \
      --partitions "$PARTITIONS" \
      --replication-factor "$REPLICATION" \
      --config retention.ms="$RETENTION" \
      --config compression.type=lz4

    echo "✅ Created topic: $TOPIC (partitions=$PARTITIONS, retention=${RETENTION}ms)"
  fi
done

echo ""
echo "📋 All topics:"
kafka-topics.sh --bootstrap-server "$BROKER" --list

