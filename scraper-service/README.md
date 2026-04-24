# 📡 Scraper Service — SamacharDaily

Standalone microservice that continuously scrapes **100+ Indian news sources** across **10 languages** and feeds the SamacharDaily database.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  scraper-service                     │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  Cron Jobs   │    │      Source Registry      │   │
│  │              │    │  100+ sources × 10 langs  │   │
│  │ ⏱ Scrape/30m │    │  en hi te ta kn mr bn    │   │
│  │ 📈 Trending/15m   │  gu pa ml               │   │
│  │ 🧹 Cleanup/day│    └──────────────────────────┘   │
│  └──────┬───────┘                                    │
│         │                                            │
│  ┌──────▼───────────────────┐                        │
│  │      Scrape Job           │                        │
│  │  1. RSS Scraper (fast)    │                        │
│  │  2. Content Enricher      │                        │
│  │     (Cheerio full text)   │                        │
│  │  3. Dedup (Redis+PG)      │                        │
│  │  4. Store → PostgreSQL    │                        │
│  │  5. Publish → Kafka       │                        │
│  └───────────────────────────┘                        │
└─────────────────────────────────────────────────────┘
         │                          │
    PostgreSQL                    Kafka
  (articles table)          (new-articles topic)
                                   │
                    ┌──────────────┴────────────┐
              feed-service          notification-service
```

---

## 🌐 Supported Languages & Source Count

| Language | Code | Sources |
|----------|------|---------|
| English  | en   | 34      |
| Hindi    | hi   | 28      |
| Telugu   | te   | 15      |
| Tamil    | ta   | 13      |
| Kannada  | kn   | 11      |
| Marathi  | mr   | 11      |
| Bengali  | bn   | 9       |
| Gujarati | gu   | 8       |
| Punjabi  | pa   | 6       |
| Malayalam| ml   | 10      |
| **Total**|      | **145** |

---

## ⚡ Cron Schedule

| Job | Default | Purpose |
|-----|---------|---------|
| Scrape | `*/30 * * * *` | Fetch all RSS feeds, enrich, store |
| Trending | `*/15 * * * *` | Recalculate trending scores with time-decay |
| Cleanup | `0 2 * * *` | Archive old zero-view articles, delete stale |

All crons run in **Asia/Kolkata (IST)** timezone.

---

## 🚀 Quick Start

```bash
# 1. Copy env
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev

# 4. OR run with Docker
docker compose -f ../backend/docker-compose.yml up scraper-service
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/health` | Service health + last run stats |
| GET  | `/api/v1/sources?language=hi&category=sports` | List all sources |
| GET  | `/api/v1/stats` | Last scrape run statistics |
| POST | `/api/v1/scrape` | Trigger a scrape now (body: `{languages,categories}`) |
| POST | `/api/v1/trending/recalculate` | Recalculate trending scores now |
| POST | `/api/v1/cleanup` | Run cleanup job now |

### Example: Scrape only Hindi + Telugu
```bash
curl -X POST http://localhost:3007/api/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"languages": ["hi", "te"]}'
```

---

## 📦 Adding New Sources

Edit the appropriate language file in `src/sources/`:

```js
// src/sources/hi.js
{ 
  name: 'My News Source',    // Display name
  language: 'hi',            // ISO 639-1 code
  category: 'top-stories',   // Category slug
  type: 'rss',               // 'rss' or 'web'
  url: 'https://example.com/rss.xml'
}
```

For sites without RSS, use `type: 'web'` and add CSS selectors in `src/scrapers/web.js` under `SITE_SELECTORS`.

---

## 🎛️ Tuning

| Env Var | Default | Description |
|---------|---------|-------------|
| `RSS_CONCURRENCY` | 8 | Parallel RSS feeds fetched at once |
| `MAX_INGEST_PER_RUN` | 500 | Max articles stored per scrape run |
| `ENABLE_CONTENT_ENRICHMENT` | true | Fetch full article text via Cheerio |
| `MAX_ENRICH_PER_RUN` | 100 | Max articles enriched per run |
| `TRENDING_DECAY_LAMBDA` | 0.1 | Time-decay rate (higher = faster decay) |
| `TRENDING_WINDOW_HOURS` | 48 | Hours of history for trending calculation |

