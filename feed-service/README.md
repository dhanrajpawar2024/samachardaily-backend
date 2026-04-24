# Feed Service

Personalized, ranked news feeds with intelligent ranking algorithm combining recency, trending, user affinity, and engagement metrics.

## Overview

The Feed Service is responsible for:
- **Personalization**: Building custom feeds for each user based on their interaction history
- **Ranking**: Scoring articles using a multi-factor algorithm
- **Trending**: Identifying globally popular content
- **Interaction Tracking**: Recording user actions (clicks, bookmarks, shares)
- **Cache Management**: Redis-backed caching for feed performance

## Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL (shared instance)
- **Cache**: Redis (DB 3)
- **Message Queue**: Kafka (for future event streaming)
- **Authentication**: JWT (via shared Auth Service)

## Architecture

### Ranking Algorithm

The feed ranking combines four factors with configurable weights (defaults shown):

```
Final Score = 
  0.20 × Recency Score +
  0.30 × Trending Score +
  0.40 × Affinity Score +
  0.10 × Engagement Score
```

#### Recency Score
- Exponential decay with 7-day half-life
- Recent articles score higher
- Formula: `e^(-0.693 × days_old / 7)`

#### Trending Score
- Normalized article trending_score (0-100)
- Updated when users interact (bookmark, share)
- Real-time updates

#### Affinity Score
- User's preference for article's category
- Based on 30-day interaction history
- Calculated as: `avg_engagement / max_engagement`
- Engagement weights:
  - Clicked: 1.0
  - Bookmarked: 2.0
  - Shared: 2.5
  - Viewed: 0.5

#### Engagement Score
- Global engagement: bookmarks + shares
- Normalized to 0-1 scale
- Encourages popular content

### Cache Strategy

- **Feed Cache**: 5 minutes (configurable)
- **Affinity Cache**: 1 hour
- **Invalidation**: Triggered on user interaction
- **Implementation**: Redis with TTL-based expiration

## API Endpoints

### Public Endpoints

#### GET `/health`
Service health check (no auth required)

```bash
curl http://localhost:3003/health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "feed-service",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET `/api/v1/feed/trending`
Get globally trending articles (no auth required)

**Query Parameters**:
- `language` (default: 'en'): Article language
- `limit` (default: 50, max: 100): Number of articles

```bash
curl "http://localhost:3003/api/v1/feed/trending?language=en&limit=20"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "Breaking news...",
        "description": "...",
        "image_url": "...",
        "source": "...",
        "author": "...",
        "published_at": "2024-01-15T10:00:00.000Z",
        "trending_score": 85,
        "interaction_count": 234
      }
    ],
    "type": "global_trending"
  }
}
```

### Protected Endpoints

All protected endpoints require `Authorization: Bearer <jwt_token>` header

#### GET `/api/v1/feed`
Get personalized feed (requires authentication)

**Query Parameters**:
- `page` (default: 1): Pagination page
- `limit` (default: 50, max: 100): Articles per page
- `language` (default: 'en'): Article language

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3003/api/v1/feed?page=1&limit=20&language=en"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "Personalized article...",
        "description": "...",
        "image_url": "...",
        "source": "...",
        "author": "...",
        "published_at": "2024-01-15T10:00:00.000Z",
        "trending_score": 75,
        "bookmark_count": 45,
        "share_count": 12
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2850
    },
    "ranking_info": {
      "user_affinity": {
        "1": 0.95,
        "2": 0.45,
        "3": 0.60
      },
      "weights": {
        "recency": 0.20,
        "trending": 0.30,
        "affinity": 0.40,
        "engagement": 0.10
      }
    }
  }
}
```

#### POST `/api/v1/feed/interactions`
Record user interaction with article (requires authentication)

**Request Body**:
```json
{
  "articleId": "uuid",
  "action": "clicked"
}
```

**Actions**:
- `clicked`: User tapped article headline
- `viewed`: User scrolled past article
- `bookmarked`: User saved for reading later
- `shared`: User shared article
- `commented`: User left a comment

```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"articleId": "uuid", "action": "bookmarked"}' \
  http://localhost:3003/api/v1/feed/interactions
```

**Response**:
```json
{
  "success": true,
  "data": {
    "interactionId": "uuid",
    "action": "bookmarked"
  }
}
```

## Environment Variables

```bash
# Server
PORT=3003
NODE_ENV=development

# PostgreSQL (shared)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=samachar_daily
POSTGRES_USER=sd_user
POSTGRES_PASSWORD=sd_secret

# Redis (DB 3 for feed service)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=3
REDIS_PASSWORD=

# JWT (shared with Auth Service)
JWT_SECRET=your-secret-key-here

# Ranking Algorithm Weights (must sum to 1.0)
RECENCY_WEIGHT=0.20
TRENDING_WEIGHT=0.30
AFFINITY_WEIGHT=0.40
ENGAGEMENT_WEIGHT=0.10

# Cache Configuration
FEED_CACHE_TTL_MINUTES=5
MIN_AFFINITY_THRESHOLD=0.1
```

## Database Schema

The Feed Service uses tables from the shared schema:

- `articles`: Articles with trending_score
- `user_article_interactions`: User interactions (click, bookmark, share)
- `categories`: Article categories for affinity calculation
- `bookmarks`: Bookmarked articles (for engagement score)

Required columns:
- `articles.trending_score` (numeric): Ranking boost for popular articles
- `articles.is_published` (boolean): Filter unpublished articles
- `articles.language` (varchar): Filter by language
- `user_article_interactions.action` (varchar): Type of interaction
- `user_article_interactions.timestamp` (timestamp): When interaction occurred

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- Redis 7+
- Auth Service running (for JWT verification)

### Installation

```bash
cd feed-service
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

### Starting

```bash
npm start
```

Service will be available at `http://localhost:3003`

## Docker Deployment

### Build Image

```bash
docker build -t samachar-feed-service:latest .
```

### Run Container

```bash
docker run -d \
  -p 3003:3003 \
  -e POSTGRES_HOST=postgres \
  -e REDIS_HOST=redis \
  -e JWT_SECRET=your-secret \
  --network samachar-network \
  samachar-feed-service:latest
```

### Docker Compose

See `backend/docker-compose.yml` for full setup with all services.

```bash
docker compose up -d feed-service
```

## Monitoring & Debugging

### Health Check

```bash
curl http://localhost:3003/health
```

### Debug Logs

Enable debug mode:
```bash
DEBUG=* npm start
```

### Performance Metrics

The service logs slow queries (>100ms):
```
[DB] Slow query (245ms): SELECT ...
```

## Algorithm Tuning

### Adjust Ranking Weights

Modify `.env`:
```bash
# Make affinity more important
AFFINITY_WEIGHT=0.50
ENGAGEMENT_WEIGHT=0.15
RECENCY_WEIGHT=0.15
TRENDING_WEIGHT=0.20
```

### Adjust Cache TTL

```bash
# Cache feeds for 10 minutes instead of 5
FEED_CACHE_TTL_MINUTES=10
```

### Adjust Affinity Calculation

Current: 30-day history
To modify, edit `src/services/ranking.js`:
```javascript
// Change from 30 days to 7 days
WHERE a.is_published = TRUE AND a.language = $1
  AND uai.timestamp > NOW() - INTERVAL '7 days'  // Change here
```

## Troubleshooting

### Feed Returns Empty Results

1. **Check articles exist**: Query directly
   ```sql
   SELECT COUNT(*) FROM articles WHERE is_published = TRUE AND language = 'en';
   ```

2. **Check user affinity**: All categories scoring zero?
   ```sql
   SELECT COUNT(*) FROM user_article_interactions WHERE user_id = 'your-id';
   ```

3. **Check Redis connection**: Verify Redis is running and accessible

### Slow Feed Generation

1. **Check cache**: Is caching working?
   ```bash
   redis-cli -n 3 KEYS "feed:*"
   ```

2. **Increase cache TTL**: Reduce recalculation frequency
   ```bash
   FEED_CACHE_TTL_MINUTES=15
   ```

3. **Optimize database queries**: Add indexes on frequently queried columns

### Rankings Not Personalized

1. **Check affinities**: Recalculate manually
   ```sql
   SELECT category_id, COUNT(*) FROM user_article_interactions 
   WHERE user_id = 'your-id' GROUP BY category_id;
   ```

2. **Increase affinity weight**: Make preferences more prominent
   ```bash
   AFFINITY_WEIGHT=0.50
   ```

## Future Enhancements

- [ ] Kafka event streaming for real-time affinity updates
- [ ] Machine learning based recommendation engine
- [ ] A/B testing for ranking weights
- [ ] Per-region trending articles
- [ ] User follow/unfollow for creator-based personalization
- [ ] Collaborative filtering
- [ ] Article diversity enforcement (avoid repetition)

## License

Proprietary - Samachar Daily
