# Memory Leak and OOM Analysis

## Critical Issues 🔴

### 1. Git Pack File Processing (`git-protocol.ts:604-765`)

**Severity: CRITICAL - Can cause OOM with large repositories**

**Problem:**
```typescript
// Line 621 - Loads entire pack file into memory
const body = await c.req.arrayBuffer();
const requestData = Buffer.from(body);

// Line 654 - Creates another copy
const packData = requestData.slice(packStart);

// Line 476 - Stores ALL objects in memory during unpacking
const objects: Map<number, PackObject> = new Map();

// Line 560 - Stores ALL objects with their FULL data buffers
const objectsToStore: Array<{ oid: string; type: string; data: Buffer }> = [];
```

**Impact:**
- For a repository with 100,000 objects, this stores **ALL objects + their uncompressed data** in RAM
- A 500MB pack file with 50K objects could use **2-3GB+ of RAM**
- Memory accumulates across concurrent git pushes
- No cleanup until function completes

**Memory Calculation Example:**
```
Pack file size: 500MB
Objects in pack: 50,000
Average object size: 10KB (uncompressed)

Total memory:
- Pack file: 500MB
- Pack data copy: 500MB
- Objects Map (overhead): ~10MB
- ObjectsToStore array: 50,000 × 10KB = 500MB
- Object headers: ~5MB
Total: ~1.5GB for ONE git push
```

**Recommended Fix:**
```typescript
// Process objects in batches instead of loading all at once
// Stream the pack file instead of loading entire buffer
// Use streaming decompression
// Implement size limits and reject pushes exceeding thresholds

const MAX_PACK_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_OBJECTS = 10000;

if (requestData.length > MAX_PACK_SIZE) {
  return c.json({ error: "Pack file too large" }, 413);
}

// Process in batches
const BATCH_SIZE = 100;
for (let i = 0; i < objectsToStore.length; i += BATCH_SIZE) {
  const batch = objectsToStore.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(obj => storeObject(obj.oid, obj.type, obj.data)));
  // Allow GC
  if (i % 1000 === 0) {
    await new Promise(resolve => setImmediate(resolve));
  }
}
```

### 2. Git Delta Resolution (`git-protocol.ts:535-576`)

**Severity: CRITICAL**

**Problem:**
```typescript
// Line 535 - Recursive delta resolution keeps all resolved data in memory
const resolveDelta = (obj: PackObject): { type: number; data: Buffer } | null => {
  if (obj.type !== OBJ_OFS_DELTA && obj.type !== OBJ_REF_DELTA) {
    return { type: obj.type, data: obj.data };
  }

  // Recursively resolves deltas, building up memory
  baseData = resolveDelta(base);
  const resolvedData = applyDelta(baseData.data, obj.data);
  return { type: baseData.type, data: resolvedData };
};
```

**Impact:**
- Deep delta chains keep multiple copies of data in memory
- For a delta chain of depth 100 with 1MB objects, uses ~100MB just for that one object
- No streaming or chunking

**Recommended Fix:**
- Implement iterative delta resolution
- Free intermediate data after use
- Limit delta chain depth

### 3. Buffer Concatenation (`git-protocol.ts` multiple locations)

**Severity: HIGH**

**Problem:**
```typescript
// Multiple Buffer.concat() calls creating new buffers
// Lines 170, 348, 363, 640, 683, etc.
Buffer.concat([
  Buffer.from(packetLen),
  Buffer.from(packet),
  Buffer.from("0000"),
  refs,
])
```

**Impact:**
- Each `Buffer.concat()` allocates a new buffer
- No reusing of buffers
- Accumulates during git operations

**Recommended Fix:**
- Pre-allocate buffer when size is known
- Use streaming where possible
- Reuse buffer pools

---

## Moderate Issues 🟡

### 4. WebSocket Connection Management (`websocket.ts`)

**Severity: MODERATE**

**Problems:**
```typescript
// Line 13 - No cleanup for dead connections
wsConnections.set(userId, new Set());

// No timeout mechanism for idle connections
// No heartbeat/ping to detect dead connections
```

**Impact:**
- Dead connections accumulate in memory
- No automatic cleanup of stale connections
- Each failed connection leaves a Set entry

**Recommended Fix:**
```typescript
// Add connection timeout
const CONNECTION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function cleanupStaleConnections() {
  const now = Date.now();
  for (const [userId, connections] of wsConnections.entries()) {
    for (const ws of connections) {
      if (now - ws.data.timestamp > CONNECTION_TIMEOUT) {
        ws.close();
        connections.delete(ws);
      }
    }
    if (connections.size === 0) {
      wsConnections.delete(userId);
    }
  }
}

// Add heartbeat to detect dead connections
ws.data.lastPing = Date.now();
setInterval(() => cleanupStaleConnections(), 5 * 60 * 1000);
```

### 5. File Loading in getStream (`storage.ts:324-340`)

**Severity: MODERATE**

**Problem:**
```typescript
// Line 327 - Loads entire file into memory to create a stream
const data = await readFile(fullPath);
return new ReadableStream({
  start(controller) {
    controller.enqueue(data);
    controller.close();
  },
});
```

**Impact:**
- Defeats purpose of streaming
- 100MB file loads 100MB into RAM
- Multiple concurrent requests multiply memory usage

**Recommended Fix:**
```typescript
async getStream(key: string): Promise<ReadableStream | null> {
  const fullPath = this.getFullPath(key);

  return new ReadableStream({
    async start(controller) {
      try {
        const fileHandle = await open(fullPath);
        const stream = fileHandle.readableWebStream();
        const reader = stream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
          await fileHandle.close();
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
```

### 6. List Operations Without Pagination (`storage.ts:126-155`)

**Severity: MODERATE**

**Problem:**
```typescript
// Line 131 - Loads ALL keys into memory
const keys: string[] = [];

// Line 144 - Pushes all keys to array
for (const obj of response.Contents) {
  if (obj.Key) {
    keys.push(obj.Key);
  }
}

// No pagination or streaming
```

**Impact:**
- Repositories with 100K+ files load all keys into memory
- Each key is a string (~50 bytes average)
- 100K keys = ~5MB just for key strings
- Concurrent requests multiply this

**Recommended Fix:**
- Implement cursor-based pagination
- Use generators/yield
- Add size limits

### 7. Redis Connection Retry (`cache.ts:7-31`)

**Severity: MODERATE**

**Problem:**
```typescript
// Line 16 - Permanent failure flag
if (connectionAttempted) {
  return null;
}

// Never retries after first failure
connectionAttempted = true;
```

**Impact:**
- Redis never reconnects after transient failure
- No connection pooling
- No health checks

**Recommended Fix:**
```typescript
let redis: RedisClientType | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (redis && isHealthy(redis)) {
    return redis;
  }

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    return null;
  }

  try {
    redis = createClient({ url: config.redisUrl });
    await redis.connect();
    reconnectAttempts = 0;
    return redis;
  } catch (error) {
    reconnectAttempts++;
    console.error(`[Cache] Redis connection attempt ${reconnectAttempts} failed:`, error);
    setTimeout(() => {
      reconnectAttempts = 0; // Reset after delay
    }, RECONNECT_DELAY);
    return null;
  }
};

async function isHealthy(client: RedisClientType): Promise<boolean> {
  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}
```

### 8. Cache Pattern Deletion (`cache.ts:82-93`)

**Severity: MODERATE**

**Problem:**
```typescript
// Line 87 - Loads ALL matching keys into memory
const keys = await client.keys(pattern);
if (keys.length > 0) {
  await client.del(keys);
}
```

**Impact:**
- Pattern like `sigmagit:*` could match millions of keys
- Loads all keys into memory before deletion
- No pagination

**Recommended Fix:**
- Use SCAN instead of KEYS
- Delete in batches
- Use Redis streams for large deletions

---

## Low Issues 🟢

### 9. No Connection Pooling

**Problem:**
- S3 client is singleton but no connection pooling configured
- Redis client is singleton but no connection pooling
- No limiting of concurrent operations

**Impact:**
- Could exhaust connection limits under load
- No resource limiting
- Potential connection exhaustion

**Recommended Fix:**
- Configure connection pools
- Add semaphore/bucket for rate limiting
- Implement request queuing

### 10. Slice Operations Creating Copies

**Problem:**
Multiple `.slice()` and `.subarray()` operations throughout codebase creating unnecessary buffer copies.

**Impact:**
- Minor memory overhead
- Unnecessary allocations
- Can add up in hot paths

**Recommended Fix:**
- Use views where possible
- Pre-allocate when size is known
- Document when copies are intentional

---

## Missing Safeguards 🛡️

### 1. No Size Limits

**Missing:**
- Maximum request size limits
- Maximum file size limits
- Maximum object count limits
- Maximum response size limits

**Recommended:**
```typescript
const MAX_REQUEST_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_RESPONSE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_OBJECTS_PER_PUSH = 50000;

app.use('*', async (c, next) => {
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    return c.json({ error: 'Request too large' }, 413);
  }
  await next();
});
```

### 2. No Memory Monitoring

**Missing:**
- Memory usage monitoring
- Automatic GC triggering
- Request rejection under memory pressure
- OOM prevention

**Recommended:**
```typescript
const MEMORY_THRESHOLD = 0.8; // 80% of available memory

function getMemoryUsage(): NodeJS.MemoryUsage {
  return process.memoryUsage();
}

function shouldRejectRequest(): boolean {
  const usage = process.memoryUsage();
  const total = usage.heapTotal;
  const used = usage.heapUsed;
  return (used / total) > MEMORY_THRESHOLD;
}

app.use('*', async (c, next) => {
  if (shouldRejectRequest()) {
    console.warn('[API] Memory threshold exceeded, rejecting request');
    return c.json({ error: 'Server busy' }, 503);
  }
  await next();
});
```

### 3. No Timeout Mechanisms

**Missing:**
- Request timeout
- Git operation timeout
- Storage operation timeout
- Query timeout

**Recommended:**
```typescript
import { setTimeout } from 'timers/promises';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
  const timeout = setTimeout(timeoutMs);
  try {
    const result = await Promise.race([
      promise,
      timeout.then(() => {
        throw new Error(errorMsg);
      })
    ]);
    clearTimeout(timeout);
    return result;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Usage
const data = await withTimeout(
  getObject(key),
  30000,
  'Storage operation timeout'
);
```

---

## Priority Fixes

### Immediate (P0):
1. ✅ Add git push size limits
2. ✅ Stream git pack file processing
3. ✅ Process git objects in batches
4. ✅ Implement delta chain depth limits

### High (P1):
5. ✅ Fix file streaming in storage backend
6. ✅ Add WebSocket connection cleanup
7. ✅ Implement Redis SCAN for pattern deletions
8. ✅ Add request size middleware

### Medium (P2):
9. ✅ Add Redis connection retry with exponential backoff
10. ✅ Implement pagination for list operations
11. ✅ Add memory monitoring and rejection
12. ✅ Add operation timeouts

### Low (P3):
13. ⚪ Optimize buffer allocations
14. ⚪ Add connection pooling
15. ⚪ Implement connection limiting
16. ⚪ Add performance monitoring

---

## Monitoring Recommendations

1. **Add Memory Metrics:**
```typescript
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    percent: `${((usage.heapUsed / usage.heapTotal) * 100).toFixed(2)}%`,
  });
}, 60000); // Every minute
```

2. **Track Git Operations:**
```typescript
const activeGitOperations = new Map<string, { startTime: number; size: number }>();

function trackGitOperation(id: string, size: number) {
  activeGitOperations.set(id, { startTime: Date.now(), size });
}

function completeGitOperation(id: string) {
  const op = activeGitOperations.get(id);
  if (op) {
    const duration = Date.now() - op.startTime;
    console.log(`[Git] Operation ${id} completed in ${duration}ms (${op.size} bytes)`);
    activeGitOperations.delete(id);
  }
}
```

3. **Alert on Thresholds:**
```typescript
const MEMORY_ALERT_THRESHOLD = 0.9; // 90%

setInterval(() => {
  const usage = process.memoryUsage();
  const percent = usage.heapUsed / usage.heapTotal;

  if (percent > MEMORY_ALERT_THRESHOLD) {
    console.error(`[ALERT] Memory usage at ${(percent * 100).toFixed(2)}%`);
    // Trigger alert (Sentry, PagerDuty, etc.)
  }
}, 10000); // Every 10 seconds
```

---

## Testing Recommendations

1. **Load Test with Large Repositories:**
   - Create a repo with 100K objects
   - Test git push operations
   - Monitor memory usage during push
   - Test concurrent pushes

2. **Memory Profiling:**
   ```bash
   # Run with memory profiling
   node --inspect --heap-profiling src/index.ts

   # Or use Bun's built-in profiler
   bun --profile src/index.ts
   ```

3. **Stress Test:**
   - 100 concurrent git pushes
   - 1000 concurrent WebSocket connections
   - 1000 concurrent API requests
   - Monitor for leaks

---

## Summary

**Critical Issues:** 3 (can cause OOM in production)
**Moderate Issues:** 4 (can cause memory buildup over time)
**Low Issues:** 2 (minor memory overhead)
**Missing Safeguards:** 3 (preventive measures)

**Estimated Impact:**
- A single large git push could use **2-3GB of RAM**
- 10 concurrent pushes could easily consume **20GB+ of RAM**
- WebSocket connections may accumulate without cleanup
- No protection against memory exhaustion

**Recommended Actions:**
1. Immediately implement git push size limits (P0)
2. Add memory monitoring and alerts (P1)
3. Refactor git pack processing to use streaming (P0)
4. Add WebSocket cleanup (P1)
5. Implement operation timeouts (P2)
