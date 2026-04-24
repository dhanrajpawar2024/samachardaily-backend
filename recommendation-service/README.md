# Recommendation Service

ML-based recommendation engine with collaborative filtering, content-based filtering, and embedding-based similarity search.

## Overview

The Recommendation Service provides personalized content recommendations using machine learning techniques:
- **Collaborative Filtering**: User-to-user and item-to-item recommendations
- **Content-Based Filtering**: Recommend articles from categories user engages with
- **Embedding-Based Search**: Find similar articles using vector embeddings
- **Cold-Start Handling**: Trending/popular articles for new users
- **Real-time Processing**: Kafka consumer for user interaction tracking
- **Caching**: Redis caching of computed recommendations

## Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **ML Libraries**: ml-distance, numeric.js for similarity calculations
- **Message Queue**: Kafka (for user interactions)
- **Cache**: Redis (DB 6)
- **Database**: PostgreSQL (shared instance)
- **Authentication**: JWT (via shared Auth Service)

## Architecture

### Recommendation Pipeline

```
User Views/Likes Article
    ↓
[Kafka] - clickstream topic
    ↓
[Recommendation Service] - Kafka Consumer
    ↓
[Store Interaction] - PostgreSQL
    ↓
User Requests Recommendations
    ↓
[Collaborative Filtering] - Find similar users
    ↓
[Content-Based] - Find similar categories
    ↓
[Embedding-Based] - Vector similarity search
    ↓
[Combine & Rank] - Weighted ensemble
    ↓
[Cache Result] - Redis (1-2 hours)
    ↓
Return Recommendations
```

### Recommendation Algorithms

1. **Collaborative Filtering (60% weight)**
   - User-to-User: Find users with similar interaction patterns
   - Item-to-Item: Find articles frequently liked together
   - Aggregate recommendations from similar users

2. **Content-Based Filtering (40% weight)**
   - Identify user's preferred categories
   - Recommend recent articles from those categories
   - Popular + trending + fresh content

3. **Embedding-Based Similarity**
   - Vector embeddings for each article
   - Cosine similarity between embeddings
   - Finds semantically similar content

4. **Cold-Start Handling**
   - For new users: popular and trending articles
   - For new articles: content-based matching
   - Gradual personalization as interactions accumulate

## Database Schema

### Tables Required

**interactions** (for collaborative filtering)
```sql
id (UUID, PK)
user_id (UUID, FK)
article_id (UUID, FK)
interaction_type (varchar: 'view', 'like', 'bookmark', 'share')
created_at (timestamp)
UNIQUE(user_id, article_id, interaction_type)
```

**articles** (article metadata + embeddings)
```sql
id (UUID, PK)
title (text)
category_id (UUID, FK)
embedding (vector/float array, 384 dimensions)
published_at (timestamp)
```

**recommendation_feedback** (user feedback on recommendations)
```sql
id (UUID, PK)
user_id (UUID, FK)
article_id (UUID, FK)
feedback_type (varchar: 'helpful', 'not_helpful')
created_at (timestamp)
UNIQUE(user_id, article_id)
```

## API Endpoints

All endpoints require JWT authentication (via Authorization header)

### Personalized Recommendations

#### GET `/api/v1/recommendations/for-user`
Get personalized recommendations for current user

**Query Parameters**:
- `limit` (optional, default: 20, max: 100) - Number of recommendations

**Response**:
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "article-uuid",
        "title": "Article title",
        "source": "collaborative",
        "weight": 0.6
      }
    ],
    "count": 5
  }
}
```

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3006/api/v1/recommendations/for-user?limit=20"
```

### Content-Based Recommendations

#### GET `/api/v1/recommendations/category/:categoryId`
Get trending articles in a category

**Parameters**:
- `categoryId` (required) - Category UUID

**Query Parameters**:
- `limit` (optional, default: 20, max: 100)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3006/api/v1/recommendations/category/sports?limit=10"
```

### Similarity-Based Recommendations

#### GET `/api/v1/recommendations/similar/:articleId`
Get articles similar to a given article (embedding-based)

**Parameters**:
- `articleId` (required) - Article UUID

**Query Parameters**:
- `limit` (optional, default: 10, max: 50)

**Response**:
```json
{
  "success": true,
  "data": {
    "article_id": "uuid",
    "similar_articles": [
      {
        "article_id": "uuid",
        "similarity": 0.92
      }
    ],
    "count": 5
  }
}
```

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3006/api/v1/recommendations/similar/ARTICLE_UUID?limit=10"
```

#### GET `/api/v1/recommendations/related/:articleId`
Get related articles (item-to-item collaborative filtering)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3006/api/v1/recommendations/related/ARTICLE_UUID?limit=10"
```

### Trending Recommendations

#### GET `/api/v1/recommendations/trending`
Get trending articles globally

**Query Parameters**:
- `limit` (optional, default: 20, max: 100)
- `timeframe` (optional, default: '7d'): '1h', '24h', '7d', '30d'

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3006/api/v1/recommendations/trending?timeframe=24h&limit=20"
```

#### GET `/api/v1/recommendations/popular`
Get popular articles (engagement-based)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3006/api/v1/recommendations/popular?limit=20"
```

### Feedback

#### POST `/api/v1/recommendations/feedback`
Submit feedback on a recommendation (helpful/not helpful)

**Request Body**:
```json
{
  "article_id": "article-uuid",
  "feedback_type": "helpful"
}
```

**Feedback Types**:
- `helpful` - User found recommendation relevant
- `not_helpful` - User didn't like recommendation

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"article_id": "uuid", "feedback_type": "helpful"}' \
  http://localhost:3006/api/v1/recommendations/feedback
```

### Health Check

#### GET `/health`
Service health check (no auth required)

```bash
curl http://localhost:3006/health
```

## Algorithms Explained

### Collaborative Filtering - User-to-User

```
1. Get target user's interactions (likes, bookmarks)
2. Find other users with similar interactions
3. Get articles liked by similar users
4. Filter out articles target user already saw
5. Rank by similarity score and engagement
6. Return top N recommendations
```

**Cache Key**: `collaborative:{userId}`
**Cache TTL**: 2 hours

### Collaborative Filtering - Item-to-Item

```
1. Get target article ID
2. Find users who liked this article
3. Find other articles those users also liked
4. Calculate co-occurrence frequency
5. Rank by popularity among similar users
6. Return top N related articles
```

**Cache Key**: `related_articles:{articleId}`
**Cache TTL**: 2 hours

### Content-Based Filtering

```
1. Get user's interaction history
2. Identify categories user engages with
3. Get recent articles from those categories
4. Filter out already-viewed articles
5. Rank by popularity and recency
6. Return top N recommendations
```

**Cache Key**: `content_based:{userId}`
**Cache TTL**: 1 hour

### Embedding-Based Similarity

```
1. Get embedding for target article
2. Query similar articles by vector distance
3. Calculate cosine similarity
4. Rank by similarity score
5. Return top N similar articles
```

**Cache Key**: `similar_articles:{articleId}`
**Cache TTL**: 1 hour

**Embedding Vector**:
- Dimension: 384 (typical for semantic embeddings)
- Source: Pre-computed by Content Service
- Method: SentenceTransformers or similar

### Cold-Start for New Users

```
1. Check user interaction count
2. If < 5 interactions:
   a. Return popular articles (system-wide)
   b. Calculate popularity by engagement count
   c. Weight by recency (last 30 days)
   d. Diversify across categories
3. As user interacts, gradually personalize
```

**Cache Key**: `cold_start_recommendations`
**Cache TTL**: 1 hour

### Recommendation Weighting

**Personalized Recommendations** (combines multiple sources):
- 60% Collaborative filtering (what similar users like)
- 40% Content-based (articles in user's preferred categories)
- Deduplicated and ranked

**Cold-Start Recommendations** (for new users):
- Trending articles (high engagement in last 7 days)
- Diversified across categories
- Sorted by engagement rate and recency

## Kafka Integration

### clickstream Topic

Receives user interaction events:

```json
{
  "user_id": "user-uuid",
  "article_id": "article-uuid",
  "interaction_type": "like",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

Interaction types:
- `view` - User opened article
- `like` - User liked article
- `bookmark` - User bookmarked article
- `share` - User shared article

### Consumer Processing

1. Receives event from Kafka topic
2. Extracts user_id, article_id, interaction_type
3. Stores in PostgreSQL interactions table
4. Invalidates relevant recommendation cache entries

**Processing**:
- Non-blocking async processing
- Handles duplicate events gracefully
- Logs all processed interactions

## Caching Strategy

| What | TTL | Key Pattern | Hit Rate |
|------|-----|-------------|----------|
| Personalized recommendations | 2 hours | `collaborative:{userId}` | High |
| Content-based recommendations | 1 hour | `content_based:{userId}` | High |
| Similar articles | 1 hour | `similar_articles:{articleId}` | High |
| Related articles | 2 hours | `related_articles:{articleId}` | High |
| Trending articles | 1 hour | `trending:{timeframe}` | High |
| Cold-start recommendations | 1 hour | `cold_start_recommendations` | Medium |

## Environment Variables

```bash
# Server
PORT=3006
NODE_ENV=development

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=samachar_daily
POSTGRES_USER=sd_user
POSTGRES_PASSWORD=sd_secret

# Redis (DB 6)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret
REDIS_DB=6

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=recommendation-service
KAFKA_GROUP_ID=recommendation-service-group
KAFKA_TOPIC_CLICKSTREAM=clickstream

# JWT
JWT_SECRET=your-secret-key-here
```

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- Redis 7+
- Kafka (optional, for testing interaction tracking)

### Installation

```bash
cd recommendation-service
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your database and service details
```

### Starting

```bash
npm start
```

Service will be available at `http://localhost:3006`

For development with hot reload:
```bash
npm run dev
```

## Docker Deployment

### Build Image

```bash
docker build -t samachar-recommendation-service:latest .
```

### Run Container

```bash
docker run -d \
  -p 3006:3006 \
  -e POSTGRES_HOST=postgres \
  -e REDIS_HOST=redis \
  -e KAFKA_BROKERS=kafka:9092 \
  --network samachar-network \
  samachar-recommendation-service:latest
```

### Docker Compose

See `backend/docker-compose.yml`:

```bash
docker compose up -d recommendation-service
```

## Performance Characteristics

- **Personalized Recommendation Query**: ~50-100ms (with caching)
- **Similar Articles Query**: ~20-50ms (with caching)
- **Cache Hit Rate**: >70% for active users
- **Kafka Lag**: <1 second (Kafka consumer)
- **Memory Usage**: ~200MB base + ~100MB per 10k users

## Scaling Considerations

### Database Optimization

```sql
-- Recommended indexes
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_article_id ON interactions(article_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_articles_embedding ON articles USING ivfflat (embedding vector_cosine_ops);
```

### Caching Strategy for High Traffic

1. Pre-compute trending recommendations (cron job, 5-min interval)
2. Cache popular recommendations for 2 hours
3. Use Redis with LRU eviction policy
4. Set max memory: 256MB with `maxmemory-policy allkeys-lru`

### Batch Recommendation Generation

For efficiency, pre-compute:
- Cold-start recommendations (5 min)
- Trending articles per category (1 hour)
- Popular articles (1 hour)
- Top 100 user similarities (periodic)

## API Usage Examples

### Get Recommendations for User

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3006/api/v1/recommendations/for-user?limit=10
```

### Find Similar Articles

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3006/api/v1/recommendations/similar/article-123?limit=5
```

### Get Trending Articles

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3006/api/v1/recommendations/trending?timeframe=24h&limit=20"
```

### Submit Feedback

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"article_id": "article-456", "feedback_type": "helpful"}' \
  http://localhost:3006/api/v1/recommendations/feedback
```

## Troubleshooting

### Slow Recommendations

1. Check Redis connection: `redis-cli ping`
2. Check database indexes: `EXPLAIN ANALYZE` on slow queries
3. Verify Kafka consumer is running: `docker compose logs recommendation-service`
4. Check cache hit rates in logs

### Missing Recommendations for User

1. User has <5 interactions → Cold-start recommendations shown
2. User preferences cached incorrectly → Check Redis cache
3. Database schema missing interaction data → Verify migration
4. Kafka consumer not receiving events → Check kafka-ui

### Embedding Issues

1. Verify articles have embeddings: `SELECT COUNT(*) WHERE embedding IS NOT NULL`
2. Embeddings dimension consistency (should be 384)
3. Cosine similarity calculation within [-1, 1] range

## Integration with Other Services

### Content Service
- Provides article embeddings
- Tracks published articles

### Feed Service
- Complements personalized ranking
- Can use recommendations for initial ranking

### API Gateway
- Routes `/api/v1/recommendations/*` to this service

### Kafka Producers
- Content Service publishes breaking_news
- Feed Service may publish engagement metrics
- (This service consumes clickstream)

## Future Enhancements

- [ ] Matrix factorization for collaborative filtering
- [ ] Deep learning models (neural networks)
- [ ] Real-time online learning (update model during requests)
- [ ] User segmentation (personas)
- [ ] A/B testing framework
- [ ] Recommendation explanations ("You liked X, similar to Y")
- [ ] Diversity penalties (reduce similar recommendations)
- [ ] Temporal dynamics (trending over time)
- [ ] Cross-domain recommendations
- [ ] Export recommendations for offline use
- [ ] GraphQL API for complex queries
- [ ] Recommendation system evaluation metrics

## License

Proprietary - Samachar Daily
