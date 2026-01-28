# Pastein

A production-ready Pastebin-like web application built with Next.js and Redis.

## Features

- **Create Pastes**: Share text and code snippets easily.
- **TTL (Time-to-Live)**: Set an optional expiration time in seconds.
- **View Limits**: Set an optional maximum number of views.
- **Atomic Operations**: View counting and expiration are handled atomically using Redis Lua scripts.
- **Deterministic Time**: Supports `TEST_MODE` for automated testing of time-based features.
- **Modern UI**: Clean, responsive design with dark mode support.

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Deployment**: Optimized for Vercel
- **Persistence**: Redis (compatible with Upstash Redis, Vercel KV, or local Redis)
- **Styling**: Vanilla CSS

## Getting Started

### Prerequisites

- Node.js 18+
- A Redis instance (Local or Cloud)

### Environment Variables

Create a `.env.local` file with the following:

```env
REDIS_URL=redis://localhost:6379
# Set to 1 to enable deterministic time via x-test-now-ms header
TEST_MODE=0
```

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## API Documentation

### Health Check
`GET /api/healthz`
- Returns `{"ok": true}` if Redis is reachable.

### Create Paste
`POST /api/pastes`
- Body: `{"content": "string", "ttl_seconds": 60, "max_views": 5}`
- Returns: `{"id": "string", "url": "string"}`

### Fetch Paste (API)
`GET /api/pastes/:id`
- Returns: `{"content": "string", "remaining_views": 4, "expires_at": "ISOString"}`
- Returns 404 if paste is missing, expired, or view limit reached.

## Persistence Layer

## Notable Decisions

- **Atomic Operations**: Used Redis Lua scripts for fetching pastes and decrementing view counts. This ensures that even under concurrent access in a serverless environment, view limits are strictly enforced and no race conditions occur.
- **Deterministic Time**: Implemented a global time utility that respects the `TEST_MODE` and `x-test-now-ms` header, allowing for reliable automated testing of expiration logic.
- **Serverless Safety**: Avoided all global mutable state and in-memory caching. The application relies entirely on Redis for persistence, making it fully compatible with Vercel's serverless functions.
- **Security**: Paste content is rendered within `<pre>` tags in React, ensuring safe display without the risk of script execution.
