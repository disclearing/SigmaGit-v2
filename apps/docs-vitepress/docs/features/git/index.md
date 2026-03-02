# Git Operations

Sigmagit uses [isomorphic-git](https://isomorphic-git.org) to implement a full Git hosting platform. This guide covers the Git operations system.

## Architecture

The Git system consists of several layers:

1. **Storage Layer** - Abstraction over filesystem or S3
2. **Git Operations** - Low-level Git operations via isomorphic-git
3. **Pack File Processing** - Efficient handling of Git pack files
4. **Cache Layer** - Redis caching for performance
5. **API Layer** - REST endpoints for Git operations

## Storage Abstraction

Sigmagit supports multiple storage backends through a unified interface:

### Local Storage

```typescript
// packages/db/src/storage/local.ts
export class LocalStorage implements StorageBackend {
  async readFile(path: string): Promise<Buffer> {
    return fs.readFileSync(path);
  }

  async writeFile(path: string, content: Buffer): Promise<void> {
    fs.writeFileSync(path, content);
  }
}
```

### S3 Storage

```typescript
// packages/db/src/storage/s3.ts
export class S3Storage implements StorageBackend {
  async readFile(path: string): Promise<Buffer> {
    const data = await s3.getObject({ Bucket, Key: path });
    return data.Body as Buffer;
  }

  async writeFile(path: string, content: Buffer): Promise<void> {
    await s3.putObject({ Bucket, Key: path, Body: content });
  }
}
```

## Git Repository Operations

### Creating a Repository

```typescript
import { init, add, commit } from 'isomorphic-git';

export async function createRepository(
  storage: StorageBackend,
  owner: string,
  name: string
) {
  const repoPath = `${owner}/${name}`;

  await init({
    fs: storage,
    dir: repoPath,
    defaultBranch: 'main',
  });

  await add({
    fs: storage,
    dir: repoPath,
    filepath: '.gitignore',
  });

  await commit({
    fs: storage,
    dir: repoPath,
    author: { name: 'Sigmagit', email: 'system@sigmagit.dev' },
    message: 'Initial commit',
  });
}
```

### Fetching Repository Info

```typescript
export async function getRepositoryInfo(
  storage: StorageBackend,
  owner: string,
  name: string
) {
  const repoPath = `${owner}/${name}`;

  const HEAD = await resolveRef({ fs: storage, dir: repoPath, ref: 'HEAD' });
  const commit = await readCommit({ fs: storage, dir: repoPath, oid: HEAD });

  return {
    defaultBranch: 'main',
    commitCount: await getCommitCount(storage, repoPath),
    lastCommit: commit.commit,
  };
}
```

### Reading Files

```typescript
export async function readFile(
  storage: StorageBackend,
  owner: string,
  name: string,
  path: string,
  ref: string = 'HEAD'
): Promise<string> {
  const repoPath = `${owner}/${name}`;
  const oid = await resolveRef({ fs: storage, dir: repoPath, ref });
  const { tree } = await readTree({ fs: storage, dir: repoPath, oid, filepath: path });
  const content = await readFileObject({ fs: storage, dir: repoPath, oid: tree });
  return content.toString();
}
```

## Pack File Processing

Pack files are used by Git to efficiently store and transfer objects. Sigmagit implements custom pack file handling for performance:

```typescript
export async function processPackFile(
  storage: StorageBackend,
  packPath: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const packBuffer = await storage.readFile(packPath);
  const objects = parsePackFile(packBuffer);

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];

    await storage.writeObject(`${objectsPath}/${obj.oid}`, obj.data);

    if (onProgress) {
      onProgress((i + 1) / objects.length);
    }
  }
}
```

### Batch Processing

To handle large pack files efficiently, we process objects in batches:

```typescript
const BATCH_SIZE = 100;

export async function processPackBatch(
  objects: GitObject[],
  storage: StorageBackend
): Promise<void> {
  for (let i = 0; i < objects.length; i += BATCH_SIZE) {
    const batch = objects.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(obj =>
        storage.writeObject(`${objectsPath}/${obj.oid}`, obj.data)
      )
    );
  }
}
```

## Git Transfer Protocol

### Smart HTTP Protocol

Sigmagit implements Git's smart HTTP protocol for clone, fetch, and push operations:

#### Clone/Fetch

```typescript
app.get('/:owner/:repo.git/info/refs', async (c) => {
  const { owner, repo } = c.req.param();
  const service = c.req.query('service');

  const refs = await getRefs(storage, `${owner}/${repo}`);

  return c.text(
    encodePacketHeader(`# service=${service}`) +
    refs.map(ref => encodeRefLine(ref)).join('')
  );
});

app.post('/:owner/:repo.git/git-upload-pack', async (c) => {
  const { owner, repo } = c.req.param();
  const body = await c.req.text();

  const pack = await generatePackFile(storage, `${owner}/${repo}`, body);

  return c.body(pack, 'application/x-git-upload-pack-result');
});
```

#### Push

```typescript
app.post('/:owner/:repo.git/git-receive-pack', async (c) => {
  const { owner, repo } = c.req.param();
  const body = await c.req.text();

  const updates = parseReceivePackRequest(body);
  await processPackFile(storage, `${owner}/${repo}`, updates.pack);

  await updateRefs(storage, `${owner}/${repo}`, updates.refs);

  return c.text(encodeReport(updates));
});
```

## Caching Strategy

### Redis Caching

To improve performance, Sigmagit caches Git objects in Redis:

```typescript
export async function getCachedObject(
  oid: string,
  storage: StorageBackend
): Promise<Buffer | null> {
  const cacheKey = `git:object:${oid}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return Buffer.from(cached, 'base64');
  }

  const obj = await storage.readFile(`${objectsPath}/${oid}`);
  await redis.setex(cacheKey, 3600, obj.toString('base64'));

  return obj;
}
```

### Cache Invalidation

Invalidate cache when objects are modified:

```typescript
export async function writeObject(
  storage: StorageBackend,
  oid: string,
  data: Buffer
): Promise<void> {
  await storage.writeObject(`${objectsPath}/${oid}`, data);
  await redis.del(`git:object:${oid}`);
}
```

## Branch Operations

### Listing Branches

```typescript
export async function listBranches(
  storage: StorageBackend,
  owner: string,
  repo: string
): Promise<Branch[]> {
  const repoPath = `${owner}/${repo}`;
  const refs = await listRefs({ fs: storage, dir: repoPath });

  return refs
    .filter(ref => ref.startsWith('refs/heads/'))
    .map(ref => ({
      name: ref.replace('refs/heads/', ''),
      sha: await resolveRef({ fs: storage, dir: repoPath, ref }),
    }));
}
```

### Creating Branches

```typescript
export async function createBranch(
  storage: StorageBackend,
  owner: string,
  repo: string,
  branch: string,
  startPoint: string
): Promise<void> {
  const repoPath = `${owner}/${repo}`;

  const oid = await resolveRef({ fs: storage, dir: repoPath, ref: startPoint });

  await writeRef({
    fs: storage,
    dir: repoPath,
    ref: `refs/heads/${branch}`,
    value: oid,
    force: false,
  });
}
```

### Deleting Branches

```typescript
export async function deleteBranch(
  storage: StorageBackend,
  owner: string,
  repo: string,
  branch: string
): Promise<void> {
  const repoPath = `${owner}/${repo}`;

  await deleteRef({
    fs: storage,
    dir: repoPath,
    ref: `refs/heads/${branch}`,
  });
}
```

## Commit Operations

### Getting Commits

```typescript
export async function getCommits(
  storage: StorageBackend,
  owner: string,
  repo: string,
  branch: string,
  limit: number = 10,
  skip: number = 0
): Promise<Commit[]> {
  const repoPath = `${owner}/${repo}`;
  const oid = await resolveRef({ fs: storage, dir: repoPath, ref: branch });

  const commits: Commit[] = [];
  let currentOid = oid;
  let count = 0;

  while (currentOid && commits.length < limit + skip) {
    const commit = await readCommit({ fs: storage, dir: repoPath, oid: currentOid });

    if (count >= skip) {
      commits.push(commit);
    }

    currentOid = commit.commit.parent?.[0];
    count++;
  }

  return commits.slice(0, limit);
}
```

### Creating Commits

```typescript
export async function createCommit(
  storage: StorageBackend,
  owner: string,
  repo: string,
  message: string,
  files: FileChange[],
  author: GitAuthor,
  branch: string = 'main'
): Promise<string> {
  const repoPath = `${owner}/${repo}`;

  for (const file of files) {
    if (file.type === 'add') {
      await add({
        fs: storage,
        dir: repoPath,
        filepath: file.path,
        data: file.content,
      });
    } else if (file.type === 'delete') {
      await remove({
        fs: storage,
        dir: repoPath,
        filepath: file.path,
      });
    }
  }

  const result = await commit({
    fs: storage,
    dir: repoPath,
    message,
    author,
  });

  return result;
}
```

## Repository Forking

Forking creates a copy of a repository:

```typescript
export async function forkRepository(
  storage: StorageBackend,
  sourceOwner: string,
  sourceRepo: string,
  targetOwner: string,
  targetRepo: string
): Promise<void> {
  const sourcePath = `${sourceOwner}/${sourceRepo}`;
  const targetPath = `${targetOwner}/${targetRepo}`;

  await clone({
    fs: storage,
    url: sourcePath,
    dir: targetPath,
    singleBranch: true,
  });
}
```

## Webhooks

Sigmagit supports webhooks for repository events:

```typescript
export async function triggerWebhooks(
  owner: string,
  repo: string,
  eventType: string,
  data: any
) {
  const webhooks = await getWebhooksForRepo(owner, repo);

  await Promise.all(
    webhooks.map(webhook =>
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sigmagit-Event': eventType,
          'X-Sigmagit-Signature': createSignature(data, webhook.secret),
        },
        body: JSON.stringify(data),
      })
    )
  );
}
```

## Performance Optimization

### Git Object Caching

Cache frequently accessed Git objects:

```typescript
const COMMIT_CACHE_TTL = 3600; // 1 hour

export async function getCommitWithCache(
  storage: StorageBackend,
  owner: string,
  repo: string,
  oid: string
): Promise<Commit> {
  const cacheKey = `git:commit:${owner}/${repo}:${oid}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const commit = await readCommit({
    fs: storage,
    dir: `${owner}/${repo}`,
    oid,
  });

  await redis.setex(cacheKey, COMMIT_CACHE_TTL, JSON.stringify(commit));

  return commit;
}
```

### Pack File Limits

Limit pack file sizes to prevent memory issues:

```typescript
const MAX_PACK_SIZE = 100 * 1024 * 1024; // 100MB

export async function receivePack(body: Buffer): Promise<void> {
  if (body.length > MAX_PACK_SIZE) {
    throw new Error('Pack file too large');
  }

  await processPackFile(body);
}
```

### Connection Pooling

Use connection pooling for database queries:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});
```

## Error Handling

### Git Errors

Handle Git-specific errors:

```typescript
try {
  await clone({ fs: storage, url, dir });
} catch (error) {
  if (error.code === 'NotFoundError') {
    throw new Error('Repository not found');
  } else if (error.code === 'PermissionDeniedError') {
    throw new Error('Access denied');
  } else {
    throw new Error('Git operation failed');
  }
}
```

### Storage Errors

Handle storage-related errors:

```typescript
try {
  await storage.readFile(path);
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new Error('Object not found');
  } else if (error.code === 'EACCES') {
    throw new Error('Access denied');
  }
  throw error;
}
```

## Testing Git Operations

```typescript
import { describe, it, expect } from 'vitest';
import { createRepository, getRepositoryInfo } from '@/lib/git';

describe('Git Operations', () => {
  it('should create a repository', async () => {
    await createRepository(storage, 'testuser', 'testrepo');
    const info = await getRepositoryInfo(storage, 'testuser', 'testrepo');

    expect(info.defaultBranch).toBe('main');
  });

  it('should read a file', async () => {
    const content = await readFile(storage, 'testuser', 'testrepo', 'README.md');
    expect(content).toContain('Hello World');
  });
});
```
