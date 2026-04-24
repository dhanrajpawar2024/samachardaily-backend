# Auth Service — SamacharDaily

JWT-based authentication service with Google OAuth integration.

## Architecture

```
Android App
    ↓
  [Google ID Token]
    ↓
POST /api/v1/auth/google
    ↓
Verify with Google SDK
    ↓
Create/Update User in PostgreSQL
    ↓
Generate JWT (access + refresh)
    ↓
Store refresh token in Redis
    ↓
Return tokens to client
```

## Setup

### 1. Copy environment file
```bash
cp .env.example .env
# Edit .env with your Google OAuth credentials
```

### 2. Install dependencies
```bash
npm install
```

### 3. Local development
```bash
npm run dev
```

## API Endpoints

### 1. Google OAuth Login
```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "idToken": "google-id-token-from-client"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "avatar_url": "https://..."
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

### 2. Refresh Access Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

### 3. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

### 4. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

### 5. Health Check
```http
GET /health
```

## Environment Variables

- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `JWT_SECRET` - Secret key for signing JWTs (generate: `openssl rand -base64 32`)
- `JWT_ACCESS_TOKEN_EXPIRY` - Default: `15m`
- `JWT_REFRESH_TOKEN_EXPIRY` - Default: `7d`
- `POSTGRES_*` - Database credentials
- `REDIS_*` - Redis configuration

## JWT Verification (for other services)

Import and use the middleware in other services:

```javascript
const { verifyToken } = require('../path/to/middleware/jwt');

app.get('/protected-route', verifyToken, (req, res) => {
  console.log(req.user); // { userId, email, type: 'access' }
  res.send('This is protected');
});
```

## Docker Deployment

```bash
# Build image
docker build -t auth-service:latest .

# Run container
docker run -p 3001:3001 \
  -e GOOGLE_CLIENT_ID=... \
  -e GOOGLE_CLIENT_SECRET=... \
  -e JWT_SECRET=... \
  -e POSTGRES_HOST=postgres \
  -e REDIS_HOST=redis \
  auth-service:latest
```

## Testing

```bash
npm test
```

## Architecture Notes

- **Stateless**: Each service can verify JWTs independently using `JWT_SECRET`
- **Redis**: Stores refresh tokens for revocation (logout)
- **PostgreSQL**: Persistent user storage
- **Scalable**: Multiple instances can run behind load balancer

## Next: Integrate into Backend

Add to `backend/docker-compose.yml`:

```yaml
auth-service:
  build: ../auth-service
  container_name: sd_auth
  ports:
    - "3001:3001"
  environment:
    GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
    GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    JWT_SECRET: ${JWT_SECRET}
    POSTGRES_HOST: postgres
    REDIS_HOST: redis
  depends_on:
    - postgres
    - redis
  networks:
    - sd_network
```

## Troubleshooting

**Port 3001 already in use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Redis connection failed:**
```bash
# Check Redis is running
docker ps | grep redis
# Or: redis-cli ping
```

**PostgreSQL connection failed:**
```bash
# Check credentials in .env
# Test: psql -h localhost -U sd_user -d samachar_daily
```
