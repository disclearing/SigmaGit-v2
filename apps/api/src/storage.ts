import { readdir, readFile, writeFile, unlink, mkdir, stat, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { config } from './config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

export type StorageType = 's3' | 'local';

export interface StorageBackend {
  type: StorageType;
  get(key: string): Promise<Buffer | null>;
  put(key: string, body: Buffer | Uint8Array | string, contentType?: string): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
  deletePrefix(prefix: string): Promise<void>;
  copyPrefix(sourcePrefix: string, targetPrefix: string): Promise<void>;
  getStream(key: string): Promise<ReadableStream | null>;
}

class S3StorageBackend implements StorageBackend {
  type: StorageType = 's3';
  private client: S3Client | null = null;
  private bucket: string;

  constructor() {
    const { s3 } = config.storage;
    this.bucket = s3.bucket;

    if (s3.endpoint && s3.region && s3.accessKeyId && s3.secretAccessKey) {
      this.client = new S3Client({
        endpoint: s3.endpoint,
        region: s3.region,
        credentials: {
          accessKeyId: s3.accessKeyId,
          secretAccessKey: s3.secretAccessKey,
        },
        forcePathStyle: true,
      });
    }
  }

  async get(key: string): Promise<Buffer | null> {
    if (!this.client) {
      throw new Error('S3 is not configured');
    }

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      if (!response.Body) {
        return null;
      }

      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async put(key: string, body: Buffer | Uint8Array | string, contentType?: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 is not configured');
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  }

  async delete(key: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 is not configured');
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async list(prefix: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) {
            keys.push(obj.Key);
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  async deletePrefix(prefix: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 is not configured');
    }

    const keys = await this.list(prefix);

    if (keys.length === 0) {
      return;
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((key) => this.delete(key)));
    }
  }

  async copyPrefix(sourcePrefix: string, targetPrefix: string): Promise<void> {
    const keys = await this.list(sourcePrefix);
    const normalizedSource = sourcePrefix.replace(/\/$/, '');
    const normalizedTarget = targetPrefix.replace(/\/$/, '');

    for (const key of keys) {
      const data = await this.get(key);
      if (!data) {
        continue;
      }
      const suffix = key.slice(normalizedSource.length);
      const targetKey = `${normalizedTarget}${suffix}`;
      await this.put(targetKey, data);
    }
  }

  async getStream(key: string): Promise<ReadableStream | null> {
    if (!this.client) {
      return null;
    }

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      if (!response.Body) {
        return null;
      }

      return response.Body.transformToWebStream();
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }
}

class LocalStorageBackend implements StorageBackend {
  type: StorageType = 'local';
  private basePath: string;

  constructor() {
    this.basePath = config.storage.localPath;

    if (!existsSync(this.basePath)) {
      mkdir(this.basePath, { recursive: true });
    }
  }

  private getFullPath(key: string): string {
    return join(this.basePath, key);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const fullPath = this.getFullPath(key);
      const data = await readFile(fullPath);
      return data;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async put(key: string, body: Buffer | Uint8Array | string): Promise<void> {
    const fullPath = this.getFullPath(key);
    const dir = dirname(fullPath);

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(fullPath, body);
  }

  async delete(key: string): Promise<void> {
    try {
      const fullPath = this.getFullPath(key);
      await unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(key);
      await stat(fullPath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async list(prefix: string): Promise<string[]> {
    const fullPath = this.getFullPath(prefix);

    if (!existsSync(fullPath)) {
      return [];
    }

    const keys: string[] = [];
    const files = await readdir(fullPath, { recursive: true });

    for (const file of files) {
      const relativePath = join(prefix, file);
      keys.push(relativePath);
    }

    return keys;
  }

  async deletePrefix(prefix: string): Promise<void> {
    const fullPath = this.getFullPath(prefix);

    if (!existsSync(fullPath)) {
      return;
    }

    await rm(fullPath, { recursive: true, force: true });
  }

  async copyPrefix(sourcePrefix: string, targetPrefix: string): Promise<void> {
    const keys = await this.list(sourcePrefix);

    for (const key of keys) {
      const data = await this.get(key);
      if (!data) {
        continue;
      }
      const suffix = key.slice(sourcePrefix.length);
      const targetKey = `${targetPrefix}${suffix}`;
      await this.put(targetKey, data);
    }
  }

  async getStream(key: string): Promise<ReadableStream | null> {
    try {
      const fullPath = this.getFullPath(key);
      const data = await readFile(fullPath);
      return new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}

export function getStorageBackend(): StorageBackend {
  const type = config.storage.type;

  switch (type) {
    case 'local':
      return new LocalStorageBackend();
    case 's3':
    default:
      return new S3StorageBackend();
  }
}

export const getRepoPrefix = (owner: string, repo: string): string => {
  return `repos/${owner}/${repo}`;
};

export const getObject = async (key: string): Promise<Buffer | null> => {
  const storage = getStorageBackend();
  return storage.get(key);
};

export const putObject = async (key: string, body: Buffer | Uint8Array | string, contentType?: string): Promise<void> => {
  const storage = getStorageBackend();
  return storage.put(key, body, contentType);
};

export const deleteObject = async (key: string): Promise<void> => {
  const storage = getStorageBackend();
  return storage.delete(key);
};

export const objectExists = async (key: string): Promise<boolean> => {
  const storage = getStorageBackend();
  return storage.exists(key);
};

export const listObjects = async (prefix: string): Promise<string[]> => {
  const storage = getStorageBackend();
  return storage.list(prefix);
};

export const deletePrefix = async (prefix: string): Promise<void> => {
  const storage = getStorageBackend();
  return storage.deletePrefix(prefix);
};

export const copyPrefix = async (sourcePrefix: string, targetPrefix: string): Promise<void> => {
  const storage = getStorageBackend();
  return storage.copyPrefix(sourcePrefix, targetPrefix);
};

export const getObjectStream = async (key: string): Promise<ReadableStream | null> => {
  const storage = getStorageBackend();
  return storage.getStream(key);
};
