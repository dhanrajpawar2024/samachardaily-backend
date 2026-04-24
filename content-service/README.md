# Content Service — SamacharDaily

Article ingestion service from RSS feeds and NewsAPI.

## Features

- **Automatic ingestion** from RSS feeds and NewsAPI via cron job
- **Article deduplication** using source URL
- **Multi-source support** (RSS, NewsAPI with multiple categories)
- **Category management** from PostgreSQL
- **RESTful API** for article retrieval
- **Pagination** support with filters
- **Redis caching** for ingestion stats

## Architecture

```
┌─────────────────────┐
│   RSS Feeds         │
│   NewsAPI           │
└──────────┬──────────┘
           │
    [Every 30 mins]
           │
           ▼
┌─────────────────────┐
│   Ingestion Service │  (Fetches, deduplicates)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   PostgreSQL        │  (Stores articles)
│   (articles table)  │
└─────────────────────┘
           ▲
           │
      [API queries]
           │
   ┌───────────────┐
   │ Android App   │
   └───────────────┘
```

## Setup

### 1. Environment
```bash
cp .env.example .env
# Edit .env with:
# - NEWSAPI_KEY from https://newsapi.org
# - RSS_FEEDS (comma-separated URLs)
# - INGESTION_INTERVAL_MINUTES (default: 30)
```

### 2. Install
```bash
npm install
```

### 3. Development
```bash
npm run dev
```

## API Endpoints

### Get Articles
```http
GET /api/v1/articles?page=1&limit=20&category=business&language=en&search=economy
```

**Response:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "Article Title",
        "description": "...",
        "image_url": "https://...",
        "source": "BBC News",
        "author": "John Doe",
        "published_at": "2026-04-17T12:00:00Z",
        "trending_score": 85,
        "category": "business"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "pages": 25
    }
  }
}
```

### Get Single Article
```http
GET /api/v1/articles/:id
```

### Get Categories
```http
GET /api/v1/categories
```

### Get Category Articles
```http
GET /api/v1/categories/:categoryId?page=1&limit=20
```

### Trigger Manual Ingestion
```http
POST /api/v1/ingest
```

### Health Check
```http
GET /health
```

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| `NEWSAPI_KEY` | - | Get from https://newsapi.org |
| `RSS_FEEDS` | - | Comma-separated RSS feed URLs |
| `INGESTION_INTERVAL_MINUTES` | 30 | How often to fetch new articles |
| `MAX_ARTICLES_PER_FETCH` | 100 | Max articles per NewsAPI request |
| `LANGUAGE_AUTO_DETECT` | true | Auto-detect article language |
| `POSTGRES_*` | - | Database credentials |
| `REDIS_*` | - | Redis configuration |

## Supported Categories

From NewsAPI:
- general
- business
- entertainment
- health
- science
- sports
- technology

From RSS:
- Configured via `RSS_FEEDS` environment variable

## Ingestion Process

### What happens every 30 minutes (configurable):

1. **Fetch from NewsAPI** (7 categories × 50 articles max)
2. **Parse RSS feeds** (unlimited, depends on feed)
3. **Check for duplicates** (via source_url)
4. **Store new articles** with:
   - Automatic timestamp
   - Category mapping
   - Source attribution
   - Published date
5. **Cache stats** in Redis (recent ingestion count)

### Example Cron Schedule

```
Every 30 minutes: */30 * * * *
Every hour:       0 * * * *
Every 6 hours:    0 */6 * * *
Daily at 8am:     0 8 * * *
```

## Docker Deployment

```bash
# Build
docker build -t content-service:latest .

# Run
docker run -p 3002:3002 \
  -e NEWSAPI_KEY=your-key \
  -e RSS_FEEDS=https://feeds.reuters.com/reuters/india \
  -e POSTGRES_HOST=postgres \
  -e REDIS_HOST=redis \
  content-service:latest
```

## Add to docker-compose

```yaml
content-service:
  build: ../content-service
  container_name: sd_content
  ports:
    - "3002:3002"
  environment:
    NEWSAPI_KEY: ${NEWSAPI_KEY}
    RSS_FEEDS: ${RSS_FEEDS}
    POSTGRES_HOST: postgres
    REDIS_HOST: redis
  depends_on:
    - postgres
    - redis
  networks:
    - sd_network
```

## Integration with Feed Service

Feed Service will:
1. Query Content Service for articles
2. Apply ranking algorithm
3. Return personalized feed

```javascript
// In Feed Service
const articles = await fetch('http://content-service:3002/api/v1/articles?page=1&limit=100');
```

## Performance Optimization

- **Deduplication**: Uses source_url unique constraint
- **Caching**: Ingestion stats cached for 5 minutes
- **Batch inserts**: Can insert multiple articles efficiently
- **Pagination**: Limits results to prevent memory issues
- **Index**: On `published_at`, `category_id`, `source_url`

## Troubleshooting

**Ingestion not working:**
```bash
# Trigger manually
curl -X POST http://localhost:3002/api/v1/ingest

# Check logs
docker logs sd_content
```

**"Duplicate key value" error:**
- Article already exists with same `source_url`
- Deduplication is working correctly

**NewsAPI returns 401:**
- Check `NEWSAPI_KEY` is valid in `.env`

**No RSS articles fetched:**
- Verify RSS_FEEDS format (comma-separated URLs)
- Test feed directly: `curl https://feed-url`

## Testing with curl

```bash
# Get articles
curl http://localhost:3002/api/v1/articles?page=1&limit=10

# Get by category
curl http://localhost:3002/api/v1/articles?category=business

# Search
curl http://localhost:3002/api/v1/articles?search=technology

# Get categories
curl http://localhost:3002/api/v1/categories

# Health check
curl http://localhost:3002/health
```

## Next Steps

→ **Stage 4**: Feed Service (ranking & personalization)
→ **Stage 5**: Search Service (Elasticsearch integration)
