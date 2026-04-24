# Notification Service

Push notification service with Firebase Cloud Messaging (FCM), Kafka event streaming, and user preference management.

## Overview

The Notification Service is responsible for:
- **FCM Token Management**: Register and manage device tokens
- **Push Notifications**: Send notifications via Firebase Cloud Messaging
- **Breaking News**: Real-time breaking news alerts
- **User Preferences**: Notification settings per category
- **Kafka Integration**: Listen to breaking news and notification events
- **Notification History**: Track sent notifications and user interactions
- **Topic Subscriptions**: Topic-based notification groups

## Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Push Service**: Firebase Admin SDK / Firebase Cloud Messaging (FCM)
- **Message Queue**: Kafka (for breaking news events)
- **Cache**: Redis (DB 5)
- **Database**: PostgreSQL (shared instance)
- **Task Scheduling**: node-cron (for scheduled notifications)
- **Authentication**: JWT (via shared Auth Service)

## Architecture

### Notification Flow

```
Event Source (Breaking News / User Action)
    ↓
[Kafka Topic] → breaking_news / notification_events
    ↓
[Kafka Consumer] → Process event
    ↓
[Database] → Get user preferences & FCM tokens
    ↓
[Firebase Admin SDK] → Send push notification
    ↓
[Log] → Record in notification_logs
    ↓
User's Device
```

### FCM Token Lifecycle

```
User installs app
    ↓
GET NEW FCM TOKEN
    ↓
POST /api/v1/notifications/register-token → Service
    ↓
STORE IN DATABASE (fcm_tokens table)
    ↓
SEND PUSH NOTIFICATIONS using token
    ↓
Token expires or user logs out
    ↓
DELETE /api/v1/notifications/unregister-token
    ↓
MARK INACTIVE IN DATABASE
```

### Breaking News Flow

```
Content Service publishes article
    ↓
Publish to Kafka topic: breaking_news
    ↓
Notification Service consumes event
    ↓
Query database for subscribers to category
    ↓
Get all FCM tokens for subscribers
    ↓
Send multicast push notification
    ↓
Log notification event
    ↓
All users in category get alert
```

## Database Schema

### Tables Required

**fcm_tokens**
```sql
id (UUID, PK)
user_id (UUID, FK)
fcm_token (text, unique)
device_name (varchar)
device_os (varchar, e.g., 'iOS', 'Android')
created_at (timestamp)
last_used_at (timestamp)
is_active (boolean)
```

**notification_preferences**
```sql
id (UUID, PK)
user_id (UUID, FK)
category_id (UUID, FK)
breaking_news_enabled (boolean)
trending_enabled (boolean)
comment_notifications_enabled (boolean)
bookmark_notifications_enabled (boolean)
created_at (timestamp)
updated_at (timestamp)
is_active (boolean)

UNIQUE(user_id, category_id)
```

**notification_logs**
```sql
id (UUID, PK)
notification_type (varchar, e.g., 'breaking_news', 'trending', 'comment')
title (text)
description (text)
recipient_count (integer)
sent_at (timestamp)
```

**scheduled_notifications**
```sql
id (UUID, PK)
title (text)
body (text)
category_id (UUID, nullable)
target_time (timestamp)
created_at (timestamp)
is_sent (boolean)
```

## API Endpoints

All endpoints require JWT authentication (except /health)

### Device Token Management

#### POST `/api/v1/notifications/register-token`
Register FCM token for user's device

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "fcmToken": "eEbHc7mHnC8:APA91bGH...",
  "deviceInfo": {
    "device_name": "iPhone 13",
    "device_os": "iOS",
    "app_version": "1.2.3"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "tokenId": "uuid",
    "message": "Token registered successfully"
  }
}
```

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "token_here", "deviceInfo": {"device_name": "My Phone"}}' \
  http://localhost:3005/api/v1/notifications/register-token
```

#### DELETE `/api/v1/notifications/unregister-token`
Unregister FCM token (on logout)

**Request Body**:
```json
{
  "fcmToken": "eEbHc7mHnC8:APA91bGH..."
}
```

**Response**:
```json
{
  "success": true,
  "data": { "message": "Token unregistered" }
}
```

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "token_here"}' \
  http://localhost:3005/api/v1/notifications/unregister-token
```

### Preference Management

#### GET `/api/v1/notifications/preferences`
Get user's notification preferences

**Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "global_breaking_news": true,
    "categories": [
      {
        "category_id": "uuid",
        "breaking_news_enabled": true,
        "trending_enabled": true,
        "comment_notifications_enabled": false,
        "bookmark_notifications_enabled": false,
        "is_active": true
      }
    ]
  }
}
```

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/v1/notifications/preferences
```

#### PUT `/api/v1/notifications/preferences/:categoryId`
Update notification preferences for specific category

**Request Body**:
```json
{
  "breaking_news": true,
  "trending": false,
  "comments": false,
  "bookmarks": true
}
```

**Response**:
```json
{
  "success": true,
  "data": { "message": "Preferences updated" }
}
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"breaking_news": true, "trending": false}' \
  http://localhost:3005/api/v1/notifications/preferences/CATEGORY_UUID
```

### Notification History

#### GET `/api/v1/notifications/history`
Get user's notification history

**Query Parameters**:
- `limit` (default: 50, max: 100): Number of notifications

**Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "notification_type": "breaking_news",
        "title": "Breaking: Election Results",
        "description": "Final results announced...",
        "sent_at": "2024-01-15T10:00:00.000Z",
        "is_read": false
      }
    ],
    "count": 15
  }
}
```

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3005/api/v1/notifications/history?limit=20"
```

#### POST `/api/v1/notifications/mark-read/:notificationId`
Mark notification as read

**Response**:
```json
{
  "success": true,
  "data": { "message": "Marked as read" }
}
```

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/v1/notifications/mark-read/NOTIFICATION_UUID
```

### Health Check

#### GET `/health`
Service health check (no auth required)

```bash
curl http://localhost:3005/health
```

## Firebase Setup

### Prerequisites
1. Firebase project created on Google Cloud Console
2. Firebase service account key downloaded
3. Firebase Cloud Messaging enabled

### Configuration

**Get Service Account Credentials:**

1. Go to Firebase Console → Project Settings → Service Accounts
2. Download JSON key file
3. Extract values and set environment variables:

```bash
FIREBASE_PROJECT_ID=samachardaily-d7fdc
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

### Firebase Configuration in Android App

```xml
<!-- AndroidManifest.xml -->
<service
  android:name=".services.MyFirebaseMessagingService"
  android:exported="false">
  <intent-filter>
    <action android:name="com.google.firebase.MESSAGING_EVENT" />
  </intent-filter>
</service>

<!-- Notification channel -->
<meta-data
  android:name="com.google.firebase.messaging.default_notification_channel_id"
  android:value="news" />
```

## Kafka Integration

### Topics

**breaking_news**
```json
{
  "article_id": "uuid",
  "title": "Breaking: Election Results",
  "description": "Final count announced...",
  "category_id": "uuid",
  "image_url": "https://..."
}
```

**notification_events**
```json
{
  "user_id": "uuid",
  "notification_type": "trending",
  "title": "Trending in Sports",
  "body": "Cricket match analysis...",
  "data": {
    "article_id": "uuid"
  }
}
```

## Environment Variables

```bash
# Server
PORT=3005
NODE_ENV=development

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=samachar_daily
POSTGRES_USER=sd_user
POSTGRES_PASSWORD=sd_secret

# Redis (DB 5)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret
REDIS_DB=5

# Firebase Admin SDK
FIREBASE_PROJECT_ID=project-id
FIREBASE_PRIVATE_KEY_ID=key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=email@project.iam.gserviceaccount.com

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-service-group
KAFKA_TOPIC_BREAKING_NEWS=breaking_news
KAFKA_TOPIC_NOTIFICATIONS=notification_events

# JWT
JWT_SECRET=your-secret-key-here
```

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- Redis 7+
- Firebase project with credentials
- Kafka (optional, for testing Kafka integration)

### Installation

```bash
cd notification-service
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your Firebase credentials and database details
```

### Starting

```bash
npm start
```

Service will be available at `http://localhost:3005`

## Docker Deployment

### Build Image

```bash
docker build -t samachar-notification-service:latest .
```

### Run Container

```bash
docker run -d \
  -p 3005:3005 \
  -e FIREBASE_PROJECT_ID=project-id \
  -e FIREBASE_PRIVATE_KEY="..." \
  -e POSTGRES_HOST=postgres \
  -e REDIS_HOST=redis \
  -e KAFKA_BROKERS=kafka:9092 \
  --network samachar-network \
  samachar-notification-service:latest
```

### Docker Compose

See `backend/docker-compose.yml` for full setup.

```bash
docker compose up -d notification-service
```

## Testing Push Notifications

### Step 1: Get FCM Token from Android App
The app generates FCM token automatically. Usually displayed in logs or can be accessed via:
```java
FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
  String token = task.getResult();
  Log.d("FCM", "Token: " + token);
});
```

### Step 2: Register Token

```bash
# Get JWT token first
JWT=$(curl -X POST http://localhost:3001/api/v1/auth/google \
  -d '{"idToken": "..."}' -H "Content-Type: application/json" | jq -r '.data.accessToken')

# Register FCM token
curl -X POST \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "YOUR_FCM_TOKEN"}' \
  http://localhost:3005/api/v1/notifications/register-token
```

### Step 3: Publish Breaking News Event to Kafka

```bash
# Using kafka-console-producer
echo '{"article_id": "uuid", "title": "Breaking News", "description": "Test", "category_id": "uuid"}' | \
  kafka-console-producer --broker-list localhost:9092 --topic breaking_news
```

## Advanced Features

### Notification Preferences

Users can customize notifications per category:
- Breaking news alerts
- Trending articles
- Comment notifications
- Bookmark recommendations

### Topic-Based Subscriptions

Subscribe users to topics for group messaging:
```
Topic: "breaking_news_politics" → All politics category subscribers
Topic: "trending_sports" → Sports trending alerts
```

### Scheduled Notifications

Send notifications at specific times (e.g., daily digest at 8 AM)

## Troubleshooting

### No Notifications Received

1. **Check FCM Token Registered**:
   ```bash
   curl -H "Authorization: Bearer $JWT" \
     http://localhost:3005/api/v1/notifications/preferences
   ```

2. **Verify Firebase Credentials**:
   - Check `FIREBASE_PROJECT_ID` matches your project
   - Verify service account email has proper permissions
   - Confirm private key format (with newlines)

3. **Check Kafka Connection**:
   - Verify Kafka is running: `docker ps | grep kafka`
   - Check consumer group: `kafka-consumer-groups --list`

4. **Enable Debug Logging**:
   ```bash
   DEBUG=* npm start
   ```

### Firebase Connection Issues

```bash
# Test Firebase connection
curl -X GET \
  https://www.googleapis.com/oauth2/v1/certs

# Verify service account
gcloud iam service-accounts get-iam-policy \
  firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
```

### Notification Preferences Not Saving

1. Ensure database tables exist
2. Check PostgreSQL connection: `psql -h localhost samachar_daily`
3. Verify user_id is valid UUID format

## Integration with Other Services

### Content Service
- Listens to breaking news events
- Notifies users based on category preferences

### Feed Service
- Can trigger notifications for trending content

### API Gateway
- Routes notification requests to this service

### Auth Service
- Provides JWT tokens for authentication

## Monitoring & Analytics

### Metrics to Track
- Notifications sent (by type)
- Token registration/unregistration rates
- FCM failure rate
- Notification delivery rate
- User engagement (opens)

### Example Query

```bash
# Get notification stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/v1/notifications/history?limit=100 | \
  jq '[.[].notification_type] | group_by(.) | map({type: .[0], count: length})'
```

## Future Enhancements

- [ ] In-app notification center UI
- [ ] Rich notifications with images
- [ ] Notification groups/summaries
- [ ] A/B testing for notification content
- [ ] Machine learning based optimal send times
- [ ] SMS fallback notifications
- [ ] Email digest notifications
- [ ] Deep linking to articles
- [ ] Read/click analytics
- [ ] User feedback on notifications (thumbs up/down)

## License

Proprietary - Samachar Daily
