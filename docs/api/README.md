# Sigmagit API

RESTful API server built with Hono and Bun.

## Overview

The Sigmagit API provides endpoints for managing repositories, issues, pull requests, authentication, and more.

## 📚 Base URL

```
http://localhost:3001
```

## 🔐 Authentication

All endpoints (except public ones) require authentication via session cookies or authorization headers.

### Sessions
- **Cookie-based**: `session` cookie sent with auth
- **Authorization Header**: `Authorization: Bearer <token>`
- **Discord**: Via linked Discord account (see [Account Linking](../features/account-linking/))

## 📡 API Endpoints

### Authentication

#### `POST /auth/sign-up`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password",
  "name": "User Name"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name"
  }
}
```

#### `POST /auth/sign-in`
Sign in with email/password or username/password.

#### `POST /auth/sign-out`
Sign out current session.

### Users

#### `GET /api/users/me`
Get current authenticated user profile.

#### `GET /api/users/:username`
Get public user profile by username.

#### `GET /api/users/:username/profile`
Get detailed user profile including bio, location, etc.

#### `GET /api/users/me/summary`
Get current user's summary (name, avatar).

#### `GET /api/users/:username/avatar`
Get user's avatar with cache busting.

### Repositories

#### `GET /api/repositories/:owner/:name`
Get repository information.

**Response:**
```json
{
  "repo": {
    "id": "string",
    "name": "repo-name",
    "description": "Repository description",
    "visibility": "public" | "private",
    "defaultBranch": "main",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "owner": {
      "id": "string",
      "username": "string",
      "name": "User Name",
      "avatarUrl": "https://avatar.url"
    },
    "starCount": 42,
    "starred": false,
    "forkCount": 10,
    "isOwner": true
  }
}
```

#### `POST /api/repositories/:owner/:name/fork`
Fork a repository to your account.

**Request:**
```json
{
  "name": "my-fork",
  "description": "My fork of repository"
}
```

#### `POST /api/repositories/:owner/:name/star`
Star a repository.

#### `DELETE /api/repositories/:owner/:name/star`
Unstar a repository.

#### `GET /api/repositories/:owner/:name/forks`
List all forks of a repository.

#### `GET /api/repositories/:owner/:name/stars`
List all users who starred a repository.

### Issues

#### `GET /api/repositories/:owner/:name/issues`
List issues for a repository.

**Query Parameters:**
- `state`: Filter by state (`open` | `closed`)
- `limit`: Number of results (default: 30)
- `offset`: Offset for pagination (default: 0)

**Response:**
```json
{
  "issues": [...],
  "hasMore": true
}
```

#### `POST /api/repositories/:owner/:name/issues`
Create a new issue.

**Request:**
```json
{
  "title": "Issue title",
  "body": "Issue description",
  "labels": ["bug", "enhancement"],
  "assignees": ["username"]
}
```

#### `GET /api/repositories/:owner/:name/issues/:number`
Get a specific issue by number.

#### `PATCH /api/repositories/:owner/:name/issues/:number`
Update an issue.

#### `POST /api/repositories/:owner/:name/issues/:number/comments`
Add a comment to an issue.

#### `DELETE /api/repositories/:owner/:name/issues/:number`
Delete an issue.

### Pull Requests

#### `GET /api/repositories/:owner/:name/pulls`
List pull requests for a repository.

**Query Parameters:**
- `state`: Filter by state (`open` | `closed` | `merged`)
- `limit`: Number of results (default: 30)
- `ignoreUnknown: true`: (default: false)

**Response:**
```json
{
  "pullRequests": [...],
  "hasMore": true
}
```

#### `POST /api/repositories/:owner/:name/pulls`
Create a new pull request.

#### `GET /api/repositories/:owner/:name/pulls/:number`
Get a specific pull request by number.

#### `PATCH /api/repositories/:owner/:name/pulls/:number`
Update a pull request (title, body, state, etc.).

#### `POST /api/repositories/:owner/:name/pulls/:number/merge`
Merge a pull request.

#### `POST /api/repositories/:owner/:name/pulls/:number/comments`
Add a comment to a pull request.

### Git Operations

#### `GET /api/repositories/:owner/:name/branches`
List all branches in a repository.

#### `GET /api/repositories/:owner/:name/commits`
List commits for a repository.

**Query Parameters:**
- `branch`: Branch name (default: "main")
- `limit`: Number of results (default: 30)
- `skip`: Skip N commits (default: 0)

**Response:**
```json
{
  "commits": [...],
  "hasMore": true
}
```

#### `GET /api/repositories/:owner/:name/commits/:oid/diff`
Get commit diff for a specific commit.

#### `GET /api/repositories/:owner/:name/tree`
Get repository tree structure.

**Query Parameters:**
- `branch`: Branch name (default: "main")
- `path`: Directory path (default: "")

**Response:**
```json
{
  "files": [...],
  "isEmpty": false
}
```

#### `GET /api/repositories/:owner/:name/file`
Get file contents.

**Query Parameters:**
- `branch`: Branch name (default: "main")
- `path`: File path
- `return`: Return raw content with `?return=1`

### Search

#### `GET /api/search`
Search across repositories, issues, and pull requests.

**Query Parameters:**
- `q`: Search query
- `type`: Resource type (`repositories` | `issues` | `pulls` | `users`, default: `repositories`)
- `limit`: Number of results (default: 20)
- `offset`: Offset for pagination (default: 0)

**Response:**
```json
{
  "results": [...],
  "hasMore": true,
  "query": "search query"
}
```

### Settings

#### `GET /api/users/me/settings`
Get user settings.

#### `PATCH /api/users/me/settings`
Update user settings (bio, location, website, etc.).

#### `PATCH /api/users/me/avatar`
Update user avatar.

#### `DELETE /api/users/me/avatar`
Delete user avatar.

#### `POST /api/users/me/settings/preferences`
Update user preferences (theme, notifications, etc.).

### Discord Account Linking

#### `POST /api/discord/link/generate`
Generate a link token for Discord account linking.

**Request:**
```json
{
  "discordId": "discord-user-id",
  "sigmagitEmail": "user@sigmagit.dev"  // optional, for verification
}
```

**Response:**
```json
{
  "success": true,
  "token": "64-character-hex-string"
}
```

#### `POST /api/discord/link/verify`
Verify a link token and create account link.

**Request:**
```json
{
  "token": "64-character-hex-token",
  "sigmagitUserId": "user-id-from-token"
}
```

**Response:**
```json
{
  "success": true,
  "linked": true,
  "user": {...}
}
```

#### `POST /api/discord/link/unlink`
Unlink Discord account from Sigmagit.

**Request:**
```json
{
  "discordId": "discord-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "unlinked": true
}
```

#### `GET /api/discord/link/status/:discordId`
Check link status for a Discord ID.

**Response:**
```json
{
  "linked": true,
  "verified": true,
  "user": {...}
}
```

#### `GET /api/discord/link/test`
Test Discord webhook (debug endpoint).

### Webhooks

#### `POST /api/webhooks/discord`
Endpoint for receiving Discord webhook notifications (from external services).

**Request:**
```json
{
  "type": "issue" | "pull_request" | "push" | "star" | "fork",
  "repository": {
    "owner": "repo-owner",
    "name": "repo-name"
  },
  "data": {...}
}
```

#### `GET /api/webhooks/discord/test`
Test Discord webhook connectivity.

## 🔒 Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- - `403` - Forbidden
- `404 - Not Found
- `409 - Conflict
- `413 - Payload Too Large
- `429 - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable
```

## 📊 Rate Limiting

- Default: 60 requests per minute per IP
- Burst: 100 requests per 30 seconds
- WebSocket: Connection limit per IP

## 🔐 Rate Limit Headers

```http
RateLimit-Limit: 60
RateLimit-Reset: 60
Retry-After: 60
```

## 🌐 WebSocket

### Connection

**URL:** `ws://localhost:3001/ws`

**Auth:** Query param: `token=<session-token>`

### Events

- `connected` - Connected to WebSocket
- `ping` - Heartbeat
- `pong` - Pong response
- `notification` - Real-time notification

## 🔐 Development

### Running API Server

```bash
# Development
bun run dev:api

# Production
bun run start

# With hot reload
bun run --watch src/index.ts
```

### Testing

```bash
# Run tests
cd apps/api
bun run test

# Check database connection
bun run db:studio

# Test API endpoints
curl http://localhost:3001/health
```

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret for session encryption

Optional:
- `REDIS_URL` - Redis connection for caching
- `STORAGE_TYPE` - "s3" or "local"
- S3 storage (if STORAGE_TYPE=s3):
  - `S3_ENDPOINT`
  - `S3_REGION`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_BUCKET_NAME`
- Local storage (if STORAGE_TYPE=local):
  - `STORAGE_LOCAL_PATH`
- Email:
  - `EMAIL_PROVIDER` - "resend" or "smtp"
  - Resend: `RESEND_API_KEY`
  - SMTP: `SMTP_HOST`, `SMTP_PORT`, etc.
- Discord:
  - `DISCORD_WEBHOOK_URL`
  - `WEBHOOK_SECRET`
- `PUBLIC_WEBHOOK_URL`

## 📚 See Also

- [Architecture](../architecture/README.md) - System architecture
- [Development](../development/README.md) - Development guide
- [Deployment](../deployment/README.md) - Deployment guides
- [Git Operations](../features/git/README.md) - Git features
- [Authentication](../features/auth/README.md) - Auth details
- [Storage](../storage/README.md) - Storage backend
- [Webhooks](../webhooks/README.md) - Webhook system
- [Account Linking](../features/account-linking/README.md) - Discord integration

## 📞 API Reference

For complete API reference, see the inline JSDoc comments in the source code at `apps/api/src/routes/`.

---

**Built with Hono + Bun**
