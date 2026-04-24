# SamacharDaily — Backend

> All backend services, web portals, and infrastructure live here.
> The Android app is at `../app/`.

## 📁 Folder Structure

```
backend/
├── api-gateway/           # API Gateway (Node.js) — port 3000
├── auth-service/          # Authentication (Google OAuth + JWT) — port 3002
├── content-service/       # Articles + Bookmarks — port 3003
├── feed-service/          # Personalized Feed — port 3004
├── search-service/        # Full-text Search (Elasticsearch) — port 3005
├── notification-service/  # Push Notifications (FCM + Kafka) — port 3005
├── recommendation-service/# ML Recommendations — port 3006
├── scraper-service/       # 145-source RSS Scraper (10 languages) — port 3007
├── web-app/               # News Reader Web App (Next.js 15) — port 4000
├── admin-dashboard/       # Admin Panel (React + Vite) — port 5000
├── db/                    # PostgreSQL migrations + seed data
├── scripts/               # Kafka topics, health checks
├── docker-compose.yml     # Local development (all services)
└── docker-compose.prod.yml# Production
```

## 🚀 Start Everything

```bash
cd backend
docker compose up -d
```

| Portal | URL |
|--------|-----|
| 📰 News Reader | http://localhost:4000 |
| 🛠️ Admin Dashboard | http://localhost:5000 |
| 🔌 API Gateway | http://localhost:3000 |
| 🕷️ Scraper | http://localhost:3007/health |

### Verify DB is ready for scraper
```bash
# Wait ~30s for postgres to be healthy, then:
bash scripts/verify_db.sh
```

### If you already have an existing DB volume (skip wipe)
```bash
docker exec -i sd_postgres psql -U sd_user -d samachar_daily \
  < db/apply_on_existing_db.sql
```

### Trigger first scrape manually
```bash
curl -X POST http://localhost:3007/api/v1/scrape
# Watch progress:
docker logs -f sd_scraper
```

---

# SamacharDaily — Infrastructure (Stage 1)

## What's included

| Service | Image | Local Port | Purpose |
|---|---|---|---|
| **PostgreSQL 16** | `postgres:16-alpine` | `5432` | Primary database |
| **Redis 7** | `redis:7-alpine` | `6379` | Feed cache, sessions, rate limiting |
| **Kafka 3.7** (KRaft) | `bitnami/kafka:3.7` | `9094` | Event streaming |
| **Elasticsearch 8** | `elastic/elasticsearch:8.13` | `9200` | Full-text / multilingual search |
| **Kafka UI** | `provectuslabs/kafka-ui` | `8080` | Browse topics & messages |
| **Adminer** | `adminer` | `8081` | PostgreSQL web UI |
| **Redis Commander** | `rediscommander` | `8082` | Redis web UI |
| **Kibana** | `elastic/kibana:8.13` | `5601` | Elasticsearch dashboard |

## Quick start

### Prerequisites
- Docker Desktop ≥ 4.20 (or Docker Engine + Compose V2)
- 6 GB free RAM (Elasticsearch needs at least 2 GB)

### 1 — Copy environment file
```bash
cd backend
cp .env.example .env
# Edit .env — change all *_PASSWORD values at minimum
```

### 2 — Start all services
```bash
docker compose up -d
```

### 3 — Wait for healthy state (~60 seconds for Elasticsearch)
```bash
docker compose ps
```

### 4 — Create Kafka topics
The migrations run automatically when Postgres starts (via `docker-entrypoint-initdb.d`).
For Kafka, run the topic creation script from your host (requires Kafka CLI tools) **OR** exec into the container:

```bash
# Option A — exec into Kafka container
docker exec -it sd_kafka \
  kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic clickstream --partitions 3 --replication-factor 1

# Option B — use the script (requires kafka CLI on host)
chmod +x scripts/create-kafka-topics.sh
./scripts/create-kafka-topics.sh
```

### 5 — Verify everything is healthy
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

## Database migrations

Migrations in `db/migrations/` are numbered `V1` → `V12` and run **in order** on first `docker compose up` because they are mounted to `/docker-entrypoint-initdb.d/`.

> ⚠️  `docker-entrypoint-initdb.d` only runs on a **fresh** volume. To re-run migrations on an existing volume:
> ```bash
> docker compose down -v   # destroys all data!
> docker compose up -d
> ```

For incremental migrations in production, integrate [Flyway](https://flywaydb.org/) or [node-pg-migrate](https://github.com/salsita/node-pg-migrate) when building the Auth / Content services.

## Migration overview

| File | Tables created |
|---|---|
| `V1` | `users` + `trigger_set_updated_at()` function |
| `V2` | `categories`, `user_category_prefs` |
| `V3` | `articles` |
| `V4` | `user_article_interactions` + `interaction_action` enum |
| `V5` | `bookmarks` |
| `V6` | `tags`, `article_tags` |
| `V7` | `notifications` + `notification_type` enum |
| `V8` | `ad_placements` |
| `V9` | `videos` |
| `V10` | `fcm_tokens`, `refresh_tokens` |
| `V11` | All performance indexes |
| `V12` | Seed: 15 categories × 3 languages (en/hi/mr) + ad placements |
| `V13` | Seed: 15 categories × 7 remaining languages (te/ta/kn/bn/gu/pa/ml) native names |
| `V14` | Fix: add `metadata JSONB` column to `user_article_interactions` |
| `V15` | `read_history` table + `upsert_read_progress()` function |

## Kafka topics

| Topic | Producers | Consumers | Retention |
|---|---|---|---|
| `clickstream` | Feed Service | Feed Service (affinity), ML Service | 7 days |
| `article_ingestion` | Content Service | Search Service (ES index), Feed Service | 1 day |
| `breaking_news` | Content Service | Notification Service | 1 day |
| `notification_events` | Any service | Notification Service | 1 day |
| `feed_invalidation` | Feed Service | Feed Service (Redis cache eviction) | 1 day |
| `article_trending_update` | Feed worker | Feed Service | 1 day |
| `video_ingestion` | Content Service | Search Service | 1 day |

## Redis key conventions

| Pattern | TTL | Purpose |
|---|---|---|
| `feed:{userId}:{lang}:{page}` | 15 min | Personalised feed cache |
| `feed:anon:{lang}:{page}` | 15 min | Anonymous feed cache |
| `trending:{lang}` | 1 hour | Trending articles list |
| `session:{userId}` | JWT expiry | Session validity check |
| `rate:{ip}` | 1 min | API rate limiting |
| `categories:{lang}` | 1 hour | Category list cache |

## Useful commands

```bash
# View logs for a specific service
docker compose logs -f postgres

# Connect to Postgres directly
docker exec -it sd_postgres psql -U sd_user -d samachar_daily

# Connect to Redis
docker exec -it sd_redis redis-cli -a redis_secret

# List Kafka topics
docker exec -it sd_kafka kafka-topics.sh --bootstrap-server localhost:9092 --list

# Stop everything (keep data)
docker compose stop

# Stop and DESTROY all data
docker compose down -v
```

## Production deployment

Use the production override file:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
This disables all web UIs and increases memory limits. Set all `*_PASSWORD` env vars before running.

## Next steps → Stage 2

Once this stack is healthy, build the **Auth Service**:
- `POST /api/v1/auth/google` — verify Google ID token → issue JWT
- `POST /api/v1/auth/refresh` — refresh access token
- JWT middleware reused by all services

