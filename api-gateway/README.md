# API Gateway

Single entry point for all SamacharDaily microservices with JWT authentication, rate limiting, and request routing.

## Overview

The API Gateway serves as the main entry point for the mobile application, routing requests to appropriate microservices while providing:
- **JWT Authentication**: Verify access tokens across all requests
- **Rate Limiting**: Protect services from abuse (global + per-endpoint limits)
- **Request Routing**: Forward requests to auth, content, feed, search, and notification services
- **Error Standardization**: Consistent error responses across all services
- **Request Tracking**: Request ID for distributed logging
- **Health Monitoring**: Check health of all downstream services

## Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Load Balancing**: Axios for HTTP proxying
- **Authentication**: JWT (shared across all services)
- **Rate Limiting**: express-rate-limit
- **Security**: Helmet.js for security headers
- **Logging**: Morgan for request logging
- **Compression**: gzip response compression
- **CORS**: Cross-origin resource sharing

## Architecture

### Request Flow

```
Mobile App Request
    ↓
[API Gateway - Port 3000]
    ↓
[Health Check & CORS]
    ↓
[JWT Verification]
    ↓
[Rate Limiting]
    ↓
[Route to Service]
    ├→ Auth Service (3001)
    ├→ Content Service (3002)
    ├→ Feed Service (3003)
    ├→ Search Service (3004)
    └→ Notification Service (3005)
    ↓
[Forward Response]
    ↓
Mobile App
```

### Service Mapping

| Path | Service | Port | Purpose |
|------|---------|------|---------|
| `/api/v1/auth/*` | Auth | 3001 | Authentication & OAuth |
| `/api/v1/articles/*` | Content | 3002 | Article management |
| `/api/v1/feed/*` | Feed | 3003 | Personalized feed |
| `/api/v1/search/*` | Search | 3004 | Full-text search |
| `/api/v1/notifications/*` | Notifications | 3005 | Push notifications |

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global (per IP) | 100 | 15 min |
| `/api/v1/auth/*` | 5 | 15 min |
| `/api/v1/search/*` | 50 | 1 min |
| `/api/v1/notifications/*` | 30 | 1 min |
| `/api/v1/feed/*` | 60 | 1 min |

### Rate Limit Headers

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1234567890
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "requestId": "uuid"
}
```

## API Endpoints

### Authentication (No Auth Required)

#### POST `/api/v1/auth/google`
Sign in with Google

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"idToken": "..."}' \
  http://localhost:3000/api/v1/auth/google
```

#### POST `/api/v1/auth/refresh`
Refresh access token

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "..."}' \
  http://localhost:3000/api/v1/auth/refresh
```

#### POST `/api/v1/auth/logout`
Logout

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/auth/logout
```

### Articles (Auth Required)

#### GET `/api/v1/articles`
Get articles with pagination

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/articles?page=1&limit=20&category=politics"
```

#### GET `/api/v1/articles/:id`
Get single article

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/articles/article-uuid
```

#### POST `/api/v1/articles/:id/like`
Like article

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/articles/article-uuid/like
```

#### POST `/api/v1/articles/:id/bookmark`
Bookmark article

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/articles/article-uuid/bookmark
```

### Feed (Auth Required)

#### GET `/api/v1/feed`
Get personalized feed

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/feed?page=1&limit=20"
```

#### GET `/api/v1/feed/trending`
Get trending articles

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/feed/trending
```

#### GET `/api/v1/feed/category/:categoryId`
Get articles by category

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/feed/category/sports
```

### Search (Auth Required)

#### GET `/api/v1/search`
Full-text search

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/search?q=election&language=en&limit=20"
```

#### GET `/api/v1/search/suggestions`
Get search suggestions

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/search/suggestions?q=elec"
```

#### GET `/api/v1/search/trending`
Get trending keywords

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/search/trending?language=en"
```

#### GET `/api/v1/search/filters`
Get available search filters

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/search/filters
```

### Notifications (Auth Required)

#### POST `/api/v1/notifications/register-token`
Register FCM token

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "...", "deviceInfo": {"device_name": "iPhone"}}' \
  http://localhost:3000/api/v1/notifications/register-token
```

#### DELETE `/api/v1/notifications/unregister-token`
Unregister FCM token

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "..."}' \
  http://localhost:3000/api/v1/notifications/unregister-token
```

#### GET `/api/v1/notifications/preferences`
Get notification preferences

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/notifications/preferences
```

#### PUT `/api/v1/notifications/preferences/:categoryId`
Update notification preferences

```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"breaking_news": true, "trending": false}' \
  http://localhost:3000/api/v1/notifications/preferences/sports
```

#### GET `/api/v1/notifications/history`
Get notification history

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/notifications/history?limit=50"
```

### Health Check (No Auth Required)

#### GET `/health`
Check health of API Gateway and downstream services

```bash
curl http://localhost:3000/health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "services": {
    "auth": { "status": "healthy", "statusCode": 200 },
    "content": { "status": "healthy", "statusCode": 200 },
    "feed": { "status": "healthy", "statusCode": 200 },
    "search": { "status": "healthy", "statusCode": 200 },
    "notifications": { "status": "healthy", "statusCode": 200 }
  }
}
```

## Authentication

### JWT Token

Tokens are issued by the Auth Service and required for all protected endpoints.

**Header Format**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload** (example):
```json
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "sub": "user-uuid",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Public Endpoints

The following endpoints don't require authentication:
- `GET /health`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout` (logout requires token to identify user)

## Error Responses

### Standardized Error Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "requestId": "request-uuid"
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `MISSING_TOKEN` | 401 | No Authorization header provided |
| `INVALID_TOKEN` | 401 | Token is invalid or expired |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Endpoint not found |
| `SERVICE_UNAVAILABLE` | 503 | Downstream service unavailable |
| `REQUEST_TIMEOUT` | 504 | Service request timeout |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Example Error Response

```bash
curl -X GET http://localhost:3000/api/v1/articles
# Response (401 - Missing Token)
{
  "success": false,
  "error": "Missing authorization token",
  "code": "MISSING_TOKEN",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

```bash
curl -X GET \
  -H "Authorization: Bearer invalid-token" \
  http://localhost:3000/api/v1/articles
# Response (401 - Invalid Token)
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "INVALID_TOKEN",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Middleware Stack

### Request Processing Order

1. **Security** (Helmet)
2. **Compression** (gzip)
3. **CORS**
4. **Body Parsing**
5. **Request ID** (Add X-Request-ID header)
6. **Logging** (Morgan)
7. **Slow Request Tracking** (>500ms)
8. **Global Rate Limiting** (100 req/15min per IP)
9. **JWT Verification** (Set req.user)
10. **Endpoint-specific Rate Limiting** (auth=5, search=50, notifications=30, feed=60)
11. **Route Handler**
12. **Error Handling**

### Middleware Details

**Request ID Middleware**:
- Generates unique UUID for each request
- Available in response header: `X-Request-ID`
- Used for distributed tracing and logging

**JWT Middleware**:
- Verifies JWT token from Authorization header
- Skips auth for public endpoints
- Sets `req.user` with decoded token payload
- Sets `req.userId` for easy access

**Rate Limiter Middleware**:
- Global: 100 requests per IP per 15 minutes
- Endpoint-specific limits (see table above)
- Returns `RateLimit-*` headers
- For authenticated endpoints, rate limiting by user ID after first 5 requests

**Error Handler Middleware**:
- Catches all errors and provides standardized response
- Handles downstream service errors (axios responses)
- Handles connection errors (service unavailable)
- Handles timeout errors
- Logs errors with request ID for debugging

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# JWT
JWT_SECRET=change_this_to_a_strong_random_secret_min_32_chars

# Microservice URLs (defaults to Docker service names)
AUTH_SERVICE_URL=http://auth-service:3001
CONTENT_SERVICE_URL=http://content-service:3002
FEED_SERVICE_URL=http://feed-service:3003
SEARCH_SERVICE_URL=http://search-service:3004
NOTIFICATIONS_SERVICE_URL=http://notification-service:3005
```

## Running Locally

### Prerequisites
- Node.js 18+
- All downstream services running (auth, content, feed, search, notifications)

### Installation

```bash
cd api-gateway
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your service URLs
```

### Starting

```bash
npm start
```

Gateway will be available at `http://localhost:3000`

For development with hot reload:
```bash
npm run dev
```

## Docker Deployment

### Build Image

```bash
docker build -t samachar-api-gateway:latest .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e NODE_ENV=production \
  --network samachar-network \
  samachar-api-gateway:latest
```

### Docker Compose

See `backend/docker-compose.yml` for full setup:

```bash
docker compose up -d api-gateway
```

## Logging & Monitoring

### Request Logging

All requests are logged with Morgan in the following format:

```
[2024-01-15T10:00:00.000Z] GET /api/v1/feed?page=1 HTTP/1.1 200 24ms Content-Length:1024
```

### Slow Request Logging

Requests taking >500ms are logged as warnings:

```
[request-uuid] SLOW_REQUEST: GET /api/v1/search took 750ms
```

### Health Check

Check service health at any time:

```bash
curl http://localhost:3000/health
```

Response includes status of all downstream services.

### Request Tracing

Every request has a unique ID for tracing:

```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

Use this ID in logs and error responses to trace requests through all services.

## Performance Features

1. **Response Compression**: gzip compression for all responses >1KB
2. **Connection Pooling**: Reused HTTP connections to services
3. **Request Timeout**: 10-second timeout for service requests
4. **Rate Limiting**: Prevent abuse and overload
5. **Security Headers**: XSS, CSP, X-Frame-Options via Helmet
6. **Slow Request Tracking**: Identify performance bottlenecks

## Integration with Services

### Auth Service
- Routes: `/api/v1/auth/*`
- Provides JWT tokens
- Token verification for all other endpoints

### Content Service
- Routes: `/api/v1/articles/*`
- Manage and retrieve articles
- Track interactions (likes, bookmarks)

### Feed Service
- Routes: `/api/v1/feed/*`
- Personalized article rankings
- Category-based filtering

### Search Service
- Routes: `/api/v1/search/*`
- Full-text search across articles
- Search suggestions and trending keywords

### Notification Service
- Routes: `/api/v1/notifications/*`
- FCM token management
- Notification preferences and history

## Deployment Considerations

### Production Setup

1. **Environment Variables**:
   - Use strong JWT_SECRET (>32 characters)
   - Set NODE_ENV=production
   - Configure CORS_ORIGIN appropriately

2. **Reverse Proxy**:
   - Place behind nginx or similar
   - Enable SSL/TLS
   - Configure rate limiting at reverse proxy level

3. **Load Balancing**:
   - Run multiple instances behind load balancer
   - Share rate limit state (e.g., Redis-backed)
   - Health checks every 30 seconds

4. **Monitoring**:
   - Monitor response times (target: <100ms p95)
   - Alert on error rates (target: <1%)
   - Track rate limit hits

5. **Logging**:
   - Aggregate logs from all instances
   - Include request ID in all logs
   - Set up log-based alerts for errors

### Scaling

For high-traffic deployments:

```
[Mobile Clients]
    ↓
[Load Balancer]
    ↓
[API Gateway 1] [API Gateway 2] [API Gateway 3]
    ↓
[Microservices]
```

- Run multiple gateway instances
- Use Redis-backed rate limiting for shared state
- Configure session affinity if needed
- Health check frequency: 30 seconds

## Troubleshooting

### Service Unavailable

```
Error: Service temporarily unavailable
Code: SERVICE_UNAVAILABLE
```

Check service is running:
```bash
docker compose ps | grep service-name
docker compose logs service-name
```

### Request Timeout

```
Error: Request timeout
Code: REQUEST_TIMEOUT
```

- Check service is responding: `curl http://service:port/health`
- Increase timeout in proxy.js if needed
- Check network connectivity

### Rate Limit Exceeded

```
Error: Too many requests
Code: RATE_LIMIT_EXCEEDED
```

- Wait for RateLimit-Reset time (in seconds)
- Check rate limits for your endpoint
- Contact support if legitimate high traffic

### Invalid Token

```
Error: Invalid or expired token
Code: INVALID_TOKEN
```

- Refresh token: `POST /api/v1/auth/refresh`
- Re-authenticate: `POST /api/v1/auth/google`
- Check token expiration in JWT payload

## Future Enhancements

- [ ] Redis-backed rate limiting for distributed setups
- [ ] Request caching for GET endpoints
- [ ] Service discovery (Consul, Eureka)
- [ ] Circuit breaker pattern for failing services
- [ ] API versioning strategy
- [ ] GraphQL support
- [ ] WebSocket support for real-time updates
- [ ] API analytics and usage tracking
- [ ] OAuth 2.0 for third-party integrations
- [ ] Request transformation/aggregation

## License

Proprietary - Samachar Daily
