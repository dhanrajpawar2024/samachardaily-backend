# Search Service

Full-text search service with multilingual support, Elasticsearch integration, and real-time indexing via Kafka.

## Overview

The Search Service is responsible for:
- **Full-text Search**: Searching across article titles, descriptions, and content
- **Multilingual**: Support for English, Hindi, and Marathi
- **Real-time Indexing**: Kafka consumer for live article indexing
- **Advanced Filtering**: By category, author, source, date range
- **Autocomplete**: Search suggestions and trending keywords
- **Caching**: Redis-backed result caching for performance
- **Highlighting**: Highlight matching text in search results

## Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Search Engine**: Elasticsearch 8.13
- **Message Queue**: Kafka (for article indexing events)
- **Cache**: Redis (DB 4)
- **Database**: PostgreSQL (shared instance, for filtering options)
- **Authentication**: JWT (via shared Auth Service)

## Architecture

### Search Flow

```
User Query
    ↓
[Express API] → Check Redis Cache
    ↓ (miss)
[Elasticsearch] → Full-text search with filters
    ↓
[Cache Result] → Store in Redis (5 min TTL)
    ↓
Return Results with Highlights
```

### Indexing Flow

```
Article Event
    ↓
[Kafka Consumer] → Listen to article_ingestion topic
    ↓
[Transform] → Prepare article data for indexing
    ↓
[Elasticsearch] → Index article with multilingual analyzers
    ↓
Complete
```

### Multilingual Analyzers

#### English Analyzer
- Standard tokenizer
- English stopwords filtering
- Used for English articles

#### Hindi Analyzer
- Standard tokenizer
- Hindi stopwords (की, का, से, आदि)
- Used for Hindi articles

#### Marathi Analyzer
- Standard tokenizer
- Marathi stopwords (च, व, का, ला, आदि)
- Used for Marathi articles

#### Autocomplete Analyzer
- Edge n-gram tokenizer (2-20 char)
- Supports partial matching
- Used for search suggestions

### Elasticsearch Mappings

**Field Types:**
- `id` (keyword): Unique article identifier
- `title` (text): Article title with multilingual fields
- `description` (text): Article summary
- `content` (text): Full article content
- `category_id` (keyword): Category reference
- `author` (keyword): Author name
- `source` (keyword): News source
- `language` (keyword): Article language (en/hi/mr)
- `published_at` (date): Publication timestamp
- `trending_score` (float): Popularity score
- `is_published` (boolean): Publication status

**Field Variants:**
- `title.english`: English analyzed
- `title.hindi`: Hindi analyzed
- `title.marathi`: Marathi analyzed
- `title.autocomplete`: Edge n-gram for suggestions
- `title.keyword`: Exact match

## API Endpoints

### Public Endpoints (No Auth Required)

#### GET `/health`
Service health check

```bash
curl http://localhost:3004/health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "search-service",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET `/api/v1/search`
Full-text search with advanced filtering

**Query Parameters:**
- `q` (required): Search query
- `language` (default: 'en'): en, hi, mr
- `page` (default: 1): Pagination page
- `limit` (default: 20, max: 100): Results per page
- `category_id` (optional): Filter by category UUID
- `author` (optional): Filter by author name
- `source` (optional): Filter by news source
- `date_from` (optional): ISO date, e.g., 2024-01-01
- `date_to` (optional): ISO date, e.g., 2024-12-31
- `sort_by` (default: 'published_at'): published_at, trending_score, _score
- `sort_order` (default: 'desc'): asc, desc

```bash
# Basic search
curl "http://localhost:3004/api/v1/search?q=inflation&language=en"

# Advanced search with filters
curl "http://localhost:3004/api/v1/search?q=political+news&language=en&category_id=UUID&sort_by=trending_score&limit=10"

# Date range search
curl "http://localhost:3004/api/v1/search?q=election&date_from=2024-01-01&date_to=2024-12-31"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "query": "inflation",
    "total": 1523,
    "articles": [
      {
        "id": "uuid",
        "title": "Inflation reaches 5-year high",
        "description": "...",
        "category_id": "uuid",
        "category_name": "Economics",
        "author": "John Doe",
        "source": "Reuters",
        "language": "en",
        "published_at": "2024-01-15T10:00:00.000Z",
        "trending_score": 85,
        "image_url": "...",
        "highlight": {
          "title": ["<mark>Inflation</mark> reaches 5-year high"],
          "description": ["Central bank reports <mark>inflation</mark> concerns"]
        },
        "_score": 8.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_pages": 77
    },
    "filters": {
      "language": "en",
      "page": 1,
      "limit": 20,
      "sort_by": "published_at",
      "sort_order": "desc"
    }
  }
}
```

#### GET `/api/v1/search/suggestions`
Get autocomplete suggestions

**Query Parameters:**
- `q` (required): Partial query for suggestions
- `language` (default: 'en'): Article language
- `limit` (default: 10, max: 50): Number of suggestions

```bash
curl "http://localhost:3004/api/v1/search/suggestions?q=poli&language=en&limit=5"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "query": "poli",
    "suggestions": [
      "Political Crisis in India",
      "Politics and Economic Growth",
      "Political Analysis 2024",
      "Police Reform Bill",
      "Policy Changes"
    ],
    "count": 5
  }
}
```

#### GET `/api/v1/search/trending`
Get trending keywords/topics

**Query Parameters:**
- `language` (default: 'en'): Article language
- `limit` (default: 20, max: 50): Number of trending items

```bash
curl "http://localhost:3004/api/v1/search/trending?language=en&limit=10"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "language": "en",
    "keywords": [
      {
        "title": "Budget 2024 Analysis",
        "score": 95,
        "category": "Economics"
      },
      {
        "title": "Election Results",
        "score": 89,
        "category": "Politics"
      }
    ],
    "count": 10
  }
}
```

#### GET `/api/v1/search/filters`
Get available filter options (categories, authors, sources)

**Query Parameters:**
- `language` (default: 'en'): Article language

```bash
curl "http://localhost:3004/api/v1/search/filters?language=en"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "language": "en",
    "categories": [
      { "id": "uuid", "name": "Politics", "count": 234 },
      { "id": "uuid", "name": "Economics", "count": 189 },
      { "id": "uuid", "name": "Sports", "count": 156 }
    ],
    "authors": [
      { "name": "John Doe", "count": 45 },
      { "name": "Jane Smith", "count": 38 }
    ],
    "sources": [
      { "name": "Reuters", "count": 120 },
      { "name": "AFP", "count": 98 }
    ]
  }
}
```

## Environment Variables

```bash
# Server
PORT=3004
NODE_ENV=development

# PostgreSQL (shared)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=samachar_daily
POSTGRES_USER=sd_user
POSTGRES_PASSWORD=sd_secret

# Redis (DB 4 for search service)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret
REDIS_DB=4

# Elasticsearch
ES_HOST=http://elasticsearch:9200
ES_USERNAME=elastic
ES_PASSWORD=elastic_secret

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=search-service
KAFKA_GROUP_ID=search-service-group
KAFKA_TOPIC_ARTICLES=article_ingestion

# JWT
JWT_SECRET=your-secret-key-here

# Search Configuration
SEARCH_CACHE_TTL_MINUTES=5
ES_INDEX_ARTICLES=sd_articles
```

## Database Requirements

### PostgreSQL Tables Used:
- `articles`: For filter options and trending data
  - Columns: id, title, category_id, category_name, author, source, language, published_at, is_published, trending_score
- `categories`: For category filtering
  - Columns: id, name

## Running Locally

### Prerequisites
- Node.js 18+
- Elasticsearch 8+
- PostgreSQL 16+
- Redis 7+
- Kafka (optional, for real-time indexing)

### Installation

```bash
cd search-service
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your Elasticsearch connection details
```

### Starting

```bash
npm start
```

Service will be available at `http://localhost:3004`

## Docker Deployment

### Build Image

```bash
docker build -t samachar-search-service:latest .
```

### Run Container

```bash
docker run -d \
  -p 3004:3004 \
  -e ES_HOST=http://elasticsearch:9200 \
  -e POSTGRES_HOST=postgres \
  -e REDIS_HOST=redis \
  -e KAFKA_BROKERS=kafka:9092 \
  --network samachar-network \
  samachar-search-service:latest
```

### Docker Compose

See `backend/docker-compose.yml` for full setup.

```bash
docker compose up -d search-service
```

## Advanced Usage

### Multilingual Search

Search in different languages using the `language` parameter:

```bash
# English search
curl "http://localhost:3004/api/v1/search?q=economy&language=en"

# Hindi search
curl "http://localhost:3004/api/v1/search?q=अर्थव्यवस्था&language=hi"

# Marathi search
curl "http://localhost:3004/api/v1/search?q=अर्थनीति&language=mr"
```

### Complex Filtering

Combine multiple filters:

```bash
curl "http://localhost:3004/api/v1/search?q=budget&language=en&category_id=ECON_UUID&date_from=2024-01-01&author=John+Doe&sort_by=trending_score&limit=50"
```

### Sorting Options

- `published_at`: Most recent articles first
- `trending_score`: Most popular articles first
- `_score`: Relevance to query (default for search)

### Pagination

```bash
# Page 1 (first 20)
curl "http://localhost:3004/api/v1/search?q=news&page=1&limit=20"

# Page 5 (articles 81-100)
curl "http://localhost:3004/api/v1/search?q=news&page=5&limit=20"
```

## Elasticsearch Management

### Check Index Status

```bash
curl -u elastic:elastic_secret http://localhost:9200/sd_articles/_stats
```

### Reindex All Articles

Send POST request to trigger reindexing (requires admin endpoint):

```bash
# Via admin panel (add to routes if needed)
POST /api/v1/admin/reindex
```

### Delete Index

```bash
curl -X DELETE -u elastic:elastic_secret http://localhost:9200/sd_articles
```

## Performance Tuning

### Cache Configuration

Increase cache TTL for better performance:
```bash
SEARCH_CACHE_TTL_MINUTES=15  # Cache search results for 15 minutes
```

### Elasticsearch Settings

Adjust shard/replica configuration in `.env`:
```bash
# For production:
# number_of_shards: 2
# number_of_replicas: 1
```

### Index Refresh Interval

Faster indexing (used during bulk imports):
```bash
PUT /sd_articles/_settings
{
  "index": {
    "refresh_interval": "30s"
  }
}
```

## Troubleshooting

### Search Returns No Results

1. **Check if index exists:**
   ```bash
   curl -u elastic:elastic_secret http://localhost:9200/sd_articles
   ```

2. **Check document count:**
   ```bash
   curl -u elastic:elastic_secret http://localhost:9200/sd_articles/_count
   ```

3. **Check if articles are published:**
   ```sql
   SELECT COUNT(*) FROM articles WHERE is_published = TRUE AND language = 'en';
   ```

### Slow Search Queries

1. **Check Redis cache:**
   ```bash
   redis-cli -n 4 KEYS "search:*"
   ```

2. **Increase cache TTL:**
   ```bash
   SEARCH_CACHE_TTL_MINUTES=15
   ```

3. **Add Elasticsearch index to PostgreSQL for date filtering:**
   ```sql
   CREATE INDEX idx_articles_language_published ON articles(language, is_published, published_at);
   ```

### Kafka Consumer Not Indexing

1. **Check Kafka topic:**
   ```bash
   kafka-console-consumer --bootstrap-server kafka:9092 --topic article_ingestion --from-beginning
   ```

2. **Verify service is connected:**
   ```bash
   curl http://localhost:3004/health
   ```

3. **Check service logs for errors:**
   ```bash
   docker logs sd_search
   ```

### Elasticsearch Connection Issues

1. **Verify Elasticsearch is running:**
   ```bash
   curl http://localhost:9200
   ```

2. **Check credentials in .env file:**
   ```bash
   ES_USERNAME=elastic
   ES_PASSWORD=elastic_secret
   ```

3. **Test connection:**
   ```bash
   curl -u elastic:elastic_secret http://localhost:9200/_cluster/health
   ```

## Future Enhancements

- [ ] Nested search within comments
- [ ] More languages (Tamil, Telugu, Kannada, Bengali)
- [ ] Semantic search with embeddings
- [ ] Query suggestions based on popular searches
- [ ] Search analytics and trending analysis
- [ ] Faceted search with drill-down
- [ ] Did you mean suggestions for typos
- [ ] Regional search optimization
- [ ] Search personalization based on user preferences
- [ ] Video content search

## Integration with Other Services

### Content Service
- Search Service consumes articles from Content Service via Kafka
- Indexes new articles in real-time

### Feed Service
- Feed Service uses search results for enhanced filtering
- Search trending data feeds recommendations

### API Gateway
- Gateway routes search queries to this service

### Notification Service
- Trending search topics trigger breaking news notifications

## Monitoring & Metrics

### Key Metrics to Track
- Query response time
- Cache hit/miss ratio
- Search result relevance
- Index size and document count
- Kafka consumer lag

### Example Monitoring Query

```bash
# Get search service metrics
curl http://localhost:3004/health
curl http://localhost:9200/sd_articles/_stats
```

## License

Proprietary - Samachar Daily
