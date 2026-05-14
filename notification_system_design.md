# Notification System Design

---

## Stage 1 — REST API Design & Contract

### Overview

The campus notification platform supports three notification types: **Placements**, **Events**, and **Results**. The API allows students to fetch their notifications, mark them read, and allows administrators to create and manage notifications.

### Authentication

All endpoints are **pre-authorised** for the purpose of this evaluation. No login/registration is required. The `Authorization: Bearer <token>` header is included on every request for identity purposes.

---

### Endpoints

#### 1. Get All Notifications for a Student

```
GET /api/notifications
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `type` | string | No | Filter by type: `Placement`, `Event`, `Result` |
| `read` | boolean | No | Filter by read status: `true` / `false` |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 20, max: 100) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_001",
        "studentId": "stu_12305020",
        "type": "Placement",
        "title": "Amazon Campus Drive",
        "message": "Amazon is conducting a campus placement drive on 20th May 2026.",
        "isRead": false,
        "priority": "high",
        "createdAt": "2026-05-14T10:00:00.000Z",
        "updatedAt": "2026-05-14T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

---

#### 2. Get a Single Notification by ID

```
GET /api/notifications/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "notif_001",
    "studentId": "stu_12305020",
    "type": "Placement",
    "title": "Amazon Campus Drive",
    "message": "Amazon is conducting a campus placement drive on 20th May 2026.",
    "isRead": false,
    "priority": "high",
    "createdAt": "2026-05-14T10:00:00.000Z",
    "updatedAt": "2026-05-14T10:00:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "NotFound",
  "message": "Notification not found"
}
```

---

#### 3. Create a Notification (Admin)

```
POST /api/notifications
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "stu_12305020",
  "type": "Placement",
  "title": "Google Off-Campus Drive",
  "message": "Google is conducting an off-campus drive. Register before 25th May.",
  "priority": "high"
}
```

**Field Validations:**
| Field | Type | Required | Allowed Values |
|---|---|---|---|
| `studentId` | string | Yes | Any valid student ID |
| `type` | enum | Yes | `Placement`, `Event`, `Result` |
| `title` | string | Yes | Max 200 chars |
| `message` | string | Yes | Max 2000 chars |
| `priority` | enum | No | `low`, `medium`, `high` (default: `medium`) |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "notif_002",
    "studentId": "stu_12305020",
    "type": "Placement",
    "title": "Google Off-Campus Drive",
    "message": "Google is conducting an off-campus drive. Register before 25th May.",
    "isRead": false,
    "priority": "high",
    "createdAt": "2026-05-14T11:00:00.000Z",
    "updatedAt": "2026-05-14T11:00:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid notification type. Must be one of: Placement, Event, Result"
}
```

---

#### 4. Mark a Notification as Read

```
PATCH /api/notifications/:id/read
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "isRead": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "notif_001",
    "isRead": true,
    "updatedAt": "2026-05-14T12:00:00.000Z"
  }
}
```

---

#### 5. Delete a Notification

```
DELETE /api/notifications/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

#### 6. Mark All Notifications as Read

```
PATCH /api/notifications/read-all
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "stu_12305020"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 12
  }
}
```

---

#### 7. Get Priority Inbox

```
GET /api/notifications/priority-inbox
```

Returns unread + high-priority notifications, sorted by creation date desc.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_001",
        "studentId": "stu_12305020",
        "type": "Placement",
        "title": "Amazon Campus Drive",
        "message": "Amazon is conducting a campus placement drive on 20th May 2026.",
        "isRead": false,
        "priority": "high",
        "createdAt": "2026-05-14T10:00:00.000Z"
      }
    ],
    "total": 3
  }
}
```

---

### Real-Time Mechanism — Server-Sent Events (SSE)

For real-time delivery of new notifications to connected students, the platform uses **Server-Sent Events (SSE)**.

#### Why SSE over WebSockets?
- Notifications are **server → client** only (unidirectional push). SSE is perfectly suited for this.
- SSE works over standard HTTP — no protocol upgrade needed. Works behind firewalls and proxies.
- Built-in automatic reconnection on disconnect.
- Lower complexity vs WebSockets for purely server-push use cases.

#### SSE Endpoint

```
GET /api/notifications/stream
```

**Headers:**
```
Authorization: Bearer <token>
Accept: text/event-stream
```

**Response (text/event-stream):**
```
event: notification
data: {"id":"notif_003","type":"Result","title":"Semester Results Published","message":"Semester 6 results are now live.","priority":"medium","createdAt":"2026-05-14T14:00:00.000Z"}

event: ping
data: {"timestamp":"2026-05-14T14:00:30.000Z"}
```

The server keeps the connection alive by sending a `ping` event every 30 seconds.

---

## Stage 2 — Database Design & Storage

### Database Choice: PostgreSQL

**Rationale:**
- Notifications have a **well-defined, consistent schema** — perfectly suited for a relational model.
- PostgreSQL provides **ACID transactions**, critical for avoiding duplicate or lost notifications at scale.
- **Enum types** map directly to `notificationType` (Placement, Event, Result).
- Rich **indexing support** (B-tree, partial indexes) enables efficient query patterns (e.g., unread notifications for a student).
- Mature ecosystem with excellent Node.js drivers (`pg`, `prisma`).
- **Horizontal read scaling** via read replicas is well-supported.

NoSQL (e.g., MongoDB) would work too but offers no benefit here — our schema is fixed and relational consistency matters.

---

### Schema

```sql
-- Students table (reference, may be managed by another service)
CREATE TABLE students (
    id           VARCHAR(50) PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    email        VARCHAR(200) UNIQUE NOT NULL,
    roll_no      VARCHAR(50) UNIQUE NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Notification type enum
CREATE TYPE notification_type AS ENUM ('Placement', 'Event', 'Result');

-- Priority enum
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- Notifications table
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE NOT NULL,
    priority        priority_level DEFAULT 'medium' NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_notifications_student_id ON notifications(student_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Partial index for unread notifications (most common query)
CREATE INDEX idx_notifications_unread ON notifications(student_id, created_at DESC)
    WHERE is_read = FALSE;

-- Composite index for priority inbox queries
CREATE INDEX idx_notifications_priority_inbox ON notifications(student_id, priority, created_at DESC)
    WHERE is_read = FALSE;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### SQL Queries

#### Get all notifications for a student (paginated, filtered by type):
```sql
SELECT id, student_id, type, title, message, is_read, priority, created_at, updated_at
FROM notifications
WHERE student_id = $1
  AND ($2::notification_type IS NULL OR type = $2)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
```

#### Get unread count for a student:
```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE student_id = $1 AND is_read = FALSE;
```

#### Get priority inbox (unread + high priority, sorted newest first):
```sql
SELECT id, student_id, type, title, message, priority, created_at
FROM notifications
WHERE student_id = $1
  AND is_read = FALSE
  AND priority = 'high'
ORDER BY created_at DESC;
```

#### Mark all notifications as read for a student:
```sql
UPDATE notifications
SET is_read = TRUE, updated_at = NOW()
WHERE student_id = $1 AND is_read = FALSE
RETURNING id;
```

---

### Scalability Problems & Solutions

As data grows to 50,000 students and 5,000,000 notifications:

| Problem | Solution |
|---|---|
| **Table size bloat** — 5M rows slow down full scans | Use **partial indexes** (e.g., only index `is_read = FALSE`). Archive read notifications older than 90 days to a separate `notifications_archive` table. |
| **Write contention** — bulk inserts from "Notify All" overwhelm primary | Use an async **message queue** (BullMQ/RabbitMQ) to decouple writes. Workers drain the queue and batch-insert. |
| **Read latency** — every page load hits the DB | Add a **Redis cache** layer for hot queries (student's notification list). Invalidate on new notification or read-status change. |
| **Connection exhaustion** — too many concurrent DB connections | Use **PgBouncer** connection pooling. |
| **Index bloat** — indexes grow as rows increase | Regular `VACUUM ANALYZE` jobs. Use partial indexes to keep index size small. |

---

## Stage 3 — Query Analysis & Optimization

### The Problematic Query

An earlier developer wrote the following to fetch all placement notifications for a student:

```sql
SELECT * FROM notifications
WHERE student_id = '12305020'
  AND type = 'Placement';
```

### Is This Query Accurate?

**Partially.** It correctly filters by `student_id` and `type = 'Placement'`. However:
- Using `SELECT *` fetches all columns including the large `message` TEXT field — wasteful if only certain fields are needed by the API.
- Without an `ORDER BY`, the result order is **non-deterministic** — students would see notifications in a random order.
- Without `LIMIT`/`OFFSET`, at scale (5M rows) this could return thousands of rows in one shot.

**Revised query:**
```sql
SELECT id, title, message, is_read, priority, created_at
FROM notifications
WHERE student_id = $1
  AND type = 'Placement'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### Why Is This Slow?

At 5,000,000 rows, without proper indexing:
- PostgreSQL performs a **sequential scan** of the entire `notifications` table.
- Even with a B-tree index on `student_id` alone, if `type` is not indexed, Postgres must scan all rows for that student and then filter by type.
- Estimated cost at 5M rows: ~O(n) — potentially scanning millions of rows.

### Should We Add Indexes on Every Column?

**No. This is bad advice.**

Adding indexes on every column is counterproductive:
- **Write overhead**: Every `INSERT`, `UPDATE`, `DELETE` must update ALL indexes. At high write volume (Notify All for 50K students), this causes severe write amplification.
- **Storage cost**: Each index consumes additional disk space proportional to row count.
- **Query planner confusion**: PostgreSQL's query planner may choose suboptimal plans when too many indexes exist.

**Correct approach — selective, purposeful indexes:**

```sql
-- Composite index for the exact query pattern (student + type + recency)
CREATE INDEX idx_notifications_student_type_created 
ON notifications(student_id, type, created_at DESC);
```

This index satisfies the query in O(log n) + small range scan, making it extremely fast even at 5M rows.

For `notificationType` enum filtering specifically, a **partial index** per type can be even more efficient:

```sql
CREATE INDEX idx_notifications_placement
ON notifications(student_id, created_at DESC)
WHERE type = 'Placement';
```

### Query to Find Students Who Got Placement Notifications in the Last 7 Days

```sql
SELECT DISTINCT s.id, s.name, s.email, s.roll_no
FROM students s
INNER JOIN notifications n ON n.student_id = s.id
WHERE n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days';
```

**With index:**
```sql
-- Supporting index (if not already created)
CREATE INDEX idx_notifications_type_created 
ON notifications(type, created_at DESC);
```

This uses the index to efficiently scan only recent Placement notifications, then joins to students — O(log n + k) where k is the number of recent Placement notifications.

---

## Stage 4 — Performance & Caching Strategy

### The Problem

Notifications are fetched on every page load for every student. With 50,000 concurrent students, this results in ~50,000 DB queries per page load cycle — overwhelming the database.

### Proposed Solutions

#### Solution 1: Redis Cache (Recommended Primary Solution)

**Strategy:**
- Cache each student's notification list in Redis using key pattern: `notifications:{studentId}:{type}:{page}`
- TTL: **60 seconds** for the notification list (short enough to be fresh, long enough to absorb bursts)
- On new notification created → **invalidate** (delete) the affected student's cached keys
- On `isRead` update → invalidate or update the specific key

**Implementation Flow:**
```
GET /api/notifications
  → Check Redis cache for key "notifications:stu_001:all:1"
    → Cache HIT: return cached JSON (sub-millisecond response)
    → Cache MISS: query PostgreSQL → store result in Redis with TTL → return result
```

**Tradeoffs:**
| Pros | Cons |
|---|---|
| Dramatically reduces DB load (cache hit ratio >90% in practice) | Additional infrastructure (Redis server) |
| Sub-millisecond read latency | Cache invalidation complexity — stale data possible within TTL window |
| Redis is horizontally scalable (Redis Cluster) | Memory cost for cached data |
| Supports pub/sub for real-time invalidation | Need to handle cache stampede on cold start (use mutex/lock) |

---

#### Solution 2: HTTP Cache Headers (Client-Side Caching)

Set `Cache-Control` and `ETag` headers so browsers/CDN cache responses:

```
Cache-Control: private, max-age=30
ETag: "v1-stu001-page1-hash"
```

On subsequent requests, client sends `If-None-Match: "v1-stu001-page1-hash"` → server returns `304 Not Modified` if unchanged.

**Tradeoffs:**
| Pros | Cons |
|---|---|
| Zero additional infrastructure | Only helps repeat requests from same client |
| Reduces bandwidth | Real-time updates bypass this (SSE pushes invalidate client cache) |
| Standard HTTP mechanism | Per-user caching (private), CDN can't share across users |

---

#### Solution 3: Database Read Replicas

Route all `GET` queries to PostgreSQL **read replicas**. Only writes go to the primary.

**Tradeoffs:**
| Pros | Cons |
|---|---|
| Near-linear read scaling | Replication lag means replicas may be slightly behind |
| No cache invalidation complexity | More infrastructure cost |
| Strong consistency per replica | Write bottleneck remains on primary |

---

#### Solution 4: Pagination + Lazy Loading (UX approach)

Only load notifications when the student scrolls to that section. Implement cursor-based pagination instead of offset.

```sql
-- Cursor-based pagination (much faster than OFFSET at large page numbers)
SELECT * FROM notifications
WHERE student_id = $1
  AND created_at < $2  -- cursor (last seen created_at)
ORDER BY created_at DESC
LIMIT 20;
```

**Tradeoffs:**
| Pros | Cons |
|---|---|
| Reduces initial query size drastically | Can't jump to arbitrary pages |
| Better UX (progressive loading) | More complex client-side implementation |
| Cursor pagination stays fast at all page depths | |

---

#### Recommended Combined Strategy

1. **Redis cache** as the primary cache layer (TTL 60s, invalidate on write)
2. **Cursor-based pagination** to limit query size
3. **Read replicas** for scaling beyond single DB capacity
4. **SSE** for real-time push (avoids polling entirely)

---

## Stage 5 — Mass Notification Scalability (Notify All)

### The Problem

When HR clicks "Notify All", 50,000 students must receive an email AND an in-app notification simultaneously.

### Pseudocode Analysis

```
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        send_in_app_notification(student_id, message)
```

**Problems with this approach:**
1. **Synchronous loop** — processing 50,000 students sequentially could take minutes. HTTP request times out.
2. **Single point of failure** — if `send_email` fails for student 1000, does it stop? No retry mechanism.
3. **No backpressure** — fires all 50K emails at once, likely overwhelming the email service rate limits.
4. **Blocking the server** — the Node.js event loop is blocked for the duration.
5. **No observability** — no way to check progress or know which notifications were delivered.

---

### Proposed Solution: Async Queue-Based Architecture

```
HR clicks "Notify All"
        │
        ▼
POST /api/notifications/notify-all
        │
        ▼
Create Job in BullMQ Queue ("notify-all-queue")
        │  (immediate 200 response to HR)
        │
        ▼
Worker Pool (N workers running in parallel)
        │
        ├──► Batch 1 (student_ids 1-500)
        │       ├── Bulk INSERT into notifications table
        │       ├── Batch email via SendGrid/SES API
        │       └── Push SSE events to connected students
        │
        ├──► Batch 2 (student_ids 501-1000)
        │       └── ...
        │
        └──► Batch N ...
                └── ...
```

**Key Design Decisions:**

1. **BullMQ (Redis-backed queue)** — jobs are persisted, survive server restarts, support retries with exponential backoff.
2. **Batching** — instead of 50K individual jobs, create jobs of 500 students each (100 jobs total). This reduces queue overhead and allows bulk DB inserts.
3. **Bulk DB insert** — `INSERT INTO notifications (student_id, ...) VALUES (...), (...), ...` — 500 rows per query instead of 500 individual inserts. 100x faster.
4. **Email via batched API** — SendGrid supports sending to 1000 recipients per API call. 50K students = 50 API calls instead of 50K.
5. **Job status endpoint** — HR can poll `GET /api/jobs/:jobId/status` to see progress.
6. **Retry on failure** — BullMQ retries failed jobs up to 3 times with exponential backoff.
7. **Rate limiting** — queue processes N workers concurrently (configurable) to respect email provider rate limits.

**Improved Pseudocode:**

```javascript
async function notifyAll(studentIds, message) {
  // Split into batches of 500
  const batches = chunk(studentIds, 500);
  
  // Enqueue all batches (non-blocking)
  const jobs = await Promise.all(
    batches.map(batch => 
      notifyQueue.add('batch-notify', { studentIds: batch, message })
    )
  );
  
  return { jobIds: jobs.map(j => j.id), totalBatches: batches.length };
}

// Worker (runs in separate process)
notifyQueue.process('batch-notify', async (job) => {
  const { studentIds, message } = job.data;
  
  // Bulk insert notifications
  await bulkInsertNotifications(studentIds, message);
  
  // Batch send emails  
  await emailService.sendBatch(studentIds, message);
  
  // Push SSE to connected students
  sseManager.pushToStudents(studentIds, message);
  
  await Log('backend', 'info', 'worker', `Batch processed: ${studentIds.length} notifications`);
});
```

**Performance Comparison:**

| Approach | Time for 50K students | Failure handling |
|---|---|---|
| Synchronous loop | ~8-15 minutes (blocking) | No retry, partial failure undetected |
| Queue + 10 workers, batch 500 | ~30-60 seconds | Automatic retry, per-batch failure isolation |
| Queue + 50 workers, batch 500 | ~6-12 seconds | Same, with higher concurrency |

