# Storage Backend

Sigmagit provides a pluggable storage abstraction layer that supports multiple backends for storing Git repositories, user files, and other data.

## Overview

The storage system provides:

- Unified interface for multiple storage backends
- Support for local filesystem and S3-compatible storage
- Abstracted Git operations
- Efficient pack file handling
- Caching layer for performance

## Storage Interface

The core storage interface is defined in `packages/db/src/storage/index.ts`:

```typescript
export interface StorageBackend {
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, content: Buffer): Promise<void>;
  deleteFile(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  listFiles(path: string): Promise<string[]>;
  createReadStream(path: string): Promise<ReadableStream>;
  createWriteStream(path: string): Promise<WritableStream>;
}
```

## Local Storage

### Configuration

```env
STORAGE_TYPE=local
STORAGE_PATH=/var/lib/sigmagit/storage
```

### Implementation

```typescript
import fs from 'fs/promises';
import path from 'path';

export class LocalStorage implements StorageBackend {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  getFullPath(relativePath: string): string {
    const fullPath = path.join(this.basePath, relativePath);
    const resolved = path.resolve(fullPath);

    if (!resolved.startsWith(this.basePath)) {
      throw new Error('Path traversal attempt detected');
    }

    return resolved;
  }

  async readFile(filePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(filePath);
    return await fs.readFile(fullPath);
  }

  async writeFile(filePath: string, content: Buffer): Promise<void> {
    const fullPath = this.getFullPath(filePath);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    await fs.unlink(fullPath);
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const fullPath = this.getFullPath(dirPath);
    const entries = await fs.readdir(fullPath, { recursive: true });
    return entries;
  }

  createReadStream(filePath: string): Promise<ReadableStream> {
    const fullPath = this.getFullPath(filePath);
    const stream = fs.createReadStream(fullPath);
    return Promise.resolve(
      new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (error) => controller.error(error));
        },
      })
    );
  }

  createWriteStream(filePath: string): Promise<WritableStream> {
    const fullPath = this.getFullPath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const stream = fs.createWriteStream(fullPath);
    return Promise.resolve(
      new WritableStream({
        write(chunk) {
          return new Promise((resolve, reject) => {
            stream.write(chunk, (error) => {
              if (error) reject(error);
              else resolve();
            });
          });
        },
        close() {
          return new Promise((resolve) => {
            stream.end(resolve);
          });
        },
      })
    );
  }
}
```

### Setup Local Storage

```typescript
// apps/api/src/storage.ts
import { LocalStorage } from '@sigmagit/db';

export const storage = new LocalStorage(
  process.env.STORAGE_PATH || './data/storage'
);
```

## S3 Storage

### Configuration

```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=sigmagit-storage
AWS_S3_PREFIX=storage/
```

### Implementation

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

export class S3Storage implements StorageBackend {
  private client: S3Client;
  private bucket: string;
  private prefix: string;

  constructor(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    prefix?: string;
  }) {
    this.client = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      region: config.region,
    });

    this.bucket = config.bucket;
    this.prefix = config.prefix || '';
  }

  private getKey(path: string): string {
    return `${this.prefix}${path}`.replace(/^\/+/, '');
  }

  async readFile(path: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.getKey(path),
    });

    const response = await this.client.send(command);
    const bytes = await response.Body.transformToByteArray();

    return Buffer.from(bytes);
  }

  async writeFile(path: string, content: Buffer): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.getKey(path),
      Body: content,
    });

    await this.client.send(command);
  }

  async deleteFile(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.getKey(path),
    });

    await this.client.send(command);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.readFile(path);
      return true;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: this.getKey(dirPath),
    });

    const response = await this.client.send(command);
    return (response.Contents || []).map(obj => obj.Key.replace(this.prefix, ''));
  }

  async createReadStream(path: string): Promise<ReadableStream> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.getKey(path),
    });

    const response = await this.client.send(command);
    return response.Body.transformToWebStream();
  }

  async createWriteStream(path: string): Promise<WritableStream> {
    // Note: S3 doesn't support true streaming uploads in the same way
    // This implementation buffers and uploads when the stream closes
    let chunks: Buffer[] = [];

    return new WritableStream({
      write(chunk) {
        chunks.push(Buffer.from(chunk));
      },
      async close() {
        const content = Buffer.concat(chunks);
        await this.writeFile(path, content);
      },
    });
  }
}
```

### Setup S3 Storage

```typescript
// apps/api/src/storage.ts
import { S3Storage } from '@sigmagit/db';

export const storage = new S3Storage({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
  bucket: process.env.AWS_S3_BUCKET!,
  prefix: process.env.AWS_S3_PREFIX || 'storage/',
});
```

## Storage Factory

A factory function creates the appropriate storage backend based on configuration:

```typescript
// packages/db/src/storage/factory.ts
import { LocalStorage } from './local';
import { S3Storage } from './s3';

export function createStorage(): StorageBackend {
  const type = process.env.STORAGE_TYPE || 'local';

  switch (type) {
    case 'local':
      return new LocalStorage(
        process.env.STORAGE_PATH || './data/storage'
      );
    case 's3':
      return new S3Storage({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        region: process.env.AWS_REGION!,
        bucket: process.env.AWS_S3_BUCKET!,
        prefix: process.env.AWS_S3_PREFIX,
      });
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
}
```

## Storage for Git Operations

The storage backend integrates with isomorphic-git:

```typescript
import { fs } from 'isomorphic-git';
import { createStorage } from './factory';

const storage = createStorage();

// Create fs adapter for isomorphic-git
const gitFs = {
  promises: {
    readFile: (path: string) => storage.readFile(path).then(b => b.toString()),
    writeFile: (path: string, content: string) => storage.writeFile(path, Buffer.from(content)),
    unlink: (path: string) => storage.deleteFile(path),
    readdir: (path: string) => storage.listFiles(path),
    mkdir: (path: string) => storage.writeFile(path + '/.gitkeep', Buffer.from('')),
    rmdir: async (path: string) => {
      // Implement directory deletion
    },
    stat: async (path: string) => {
      const exists = await storage.exists(path);
      if (!exists) throw new Error('Not found');
      return { isFile: () => true, isDirectory: () => false, mtimeMs: Date.now() };
    },
    lstat: async (path: string) => {
      return gitFs.promises.stat(path);
    },
    readlink: async (path: string) => {
      throw new Error('Not supported');
    },
    symlink: async (target: string, path: string) => {
      throw new Error('Not supported');
    },
    chmod: async (path: string, mode: number) => {
      // Not applicable for object storage
    },
  },
};

// Use with isomorphic-git
import { clone, commit, push } from 'isomorphic-git';

await clone({
  fs: gitFs,
  dir: 'username/repo',
  url: 'https://example.com/repo.git',
});
```

## Repository Storage Structure

Repositories are stored in the following structure:

```
storage/
├── repositories/
│   ├── username/
│   │   ├── repo1.git/
│   │   │   ├── objects/
│   │   │   ├── refs/
│   │   │   ├── HEAD
│   │   │   ├── config
│   │   │   └── pack/
│   │   └── repo2.git/
│   │       └── ...
│   └── otheruser/
│       └── ...
├── uploads/
│   ├── avatars/
│   └── files/
└── caches/
    └── ...
```

## Caching

### Redis Cache Layer

Cache frequently accessed objects:

```typescript
import { redis } from './redis';

export class CachedStorage implements StorageBackend {
  private storage: StorageBackend;

  constructor(storage: StorageBackend) {
    this.storage = storage;
  }

  async readFile(path: string): Promise<Buffer> {
    const cacheKey = `storage:${path}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return Buffer.from(cached, 'base64');
    }

    const data = await this.storage.readFile(path);
    await redis.setex(cacheKey, 3600, data.toString('base64'));

    return data;
  }

  async writeFile(path: string, content: Buffer): Promise<void> {
    await this.storage.writeFile(path, content);
    await redis.del(`storage:${path}`);
  }

  // Delegate other methods...
}
```

## Storage Backends Comparison

| Feature | Local | S3 |
|---------|-------|-----|
| Setup Complexity | Low | Medium |
| Cost | Free | Usage-based |
| Scalability | Limited | Unlimited |
| Performance | High | Medium |
| Reliability | Single point | Highly available |
| Backups | Manual | Built-in |

## Best Practices

### Local Storage

- Use SSD for better performance
- Implement regular backups
- Monitor disk usage
- Use filesystem quotas

### S3 Storage

- Enable versioning
- Set up lifecycle policies
- Use appropriate storage classes
- Configure CORS if needed
- Enable encryption at rest

### General

- Implement retries for network operations
- Use presigned URLs for temporary access
- Monitor storage costs
- Implement cleanup policies for old data
- Log all storage operations for debugging

## Troubleshooting

### Permission Issues

Ensure the storage directory has proper permissions:

```bash
chmod 755 /var/lib/sigmagit/storage
chown -R appuser:appuser /var/lib/sigmagit/storage
```

### S3 Access Denied

Check IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::sigmagit-storage/*",
        "arn:aws:s3:::sigmagit-storage"
      ]
    }
  ]
}
```

### Slow Performance

- Use Redis caching
- Optimize S3 region selection
- Use multipart uploads for large files
- Consider CloudFront for S3 access
