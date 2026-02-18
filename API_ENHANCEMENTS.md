# API Enhancements - SMTP and Local Storage Support

## Overview
This document describes the enhancements made to the API to support SMTP email and local file system storage, ensuring the entire API remains async and type-safe.

## Changes Made

### 1. Storage Abstraction Layer (`apps/api/src/storage.ts`)

Created a new storage abstraction layer that supports both S3 and local file system storage:

- **StorageBackend Interface**: Type-safe interface defining all storage operations
- **S3StorageBackend**: Implementation for S3-compatible storage
- **LocalStorageBackend**: Implementation for local file system storage
- **getStorageBackend()**: Factory function that returns the appropriate backend based on configuration

**Key Features:**
- Fully type-safe with TypeScript
- All methods are async
- Backwards compatible with existing S3 implementation
- Easy to extend with additional storage backends

**Storage Operations:**
- `get(key: string)`: Retrieve file contents as Buffer
- `put(key: string, body, contentType?)`: Store file contents
- `delete(key: string)`: Delete a file
- `exists(key: string)`: Check if file exists
- `list(prefix: string)`: List files with a prefix
- `deletePrefix(prefix: string)`: Delete all files with a prefix
- `copyPrefix(sourcePrefix, targetPrefix)`: Copy files between prefixes
- `getStream(key: string)`: Get file as ReadableStream

### 2. Email Service Enhancements (`apps/api/src/email/index.ts`)

Updated the email service to support both SMTP and Resend:

- **SMTP Support**: Uses nodemailer for SMTP-based email sending
- **Resend Support**: Maintains existing Resend integration
- **Provider Selection**: Configurable via `EMAIL_PROVIDER` environment variable

**Configuration:**

```typescript
email: {
  provider: 'resend' | 'smtp',
  resendApiKey: string,
  smtp: {
    host: string,
    port: number,
    secure: boolean,
    user: string,
    pass: string,
  },
  fromAddress: string,
}
```

### 3. Configuration Updates (`apps/api/src/config.ts`)

Updated configuration to support new features:

```typescript
storage: {
  type: 's3' | 'local',
  localPath: string,
  s3: {
    endpoint: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
  },
},
email: {
  provider: 'resend' | 'smtp',
  resendApiKey: string,
  smtp: {
    host: string,
    port: number,
    secure: boolean,
    user: string,
    pass: string,
  },
  fromAddress: string,
}
```

### 4. S3 Module Updates (`apps/api/src/s3.ts`)

Updated the S3 module to export from the new storage abstraction layer for backwards compatibility:

- All existing exports (`getObject`, `putObject`, `deleteObject`, etc.) now use the storage abstraction
- Maintains backwards compatibility with existing code
- S3-specific functionality (like `uploadMultipart`) is preserved

### 5. Environment Variables (`.env.example`)

Added new environment variables for configuration:

```
# Storage Configuration
STORAGE_TYPE="s3"              # Options: s3, local
STORAGE_LOCAL_PATH="./data/repos"

# S3 Storage (only needed if STORAGE_TYPE=s3)
S3_ENDPOINT="https://storage.railway.app"
S3_REGION="auto"
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME=""

# Email Configuration
EMAIL_PROVIDER="resend"         # Options: resend, smtp

# Resend (only needed if EMAIL_PROVIDER=resend)
RESEND_API_KEY=""

# SMTP (only needed if EMAIL_PROVIDER=smtp)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
```

## Type Safety

All new code follows TypeScript best practices:

- **Interfaces**: All data structures are defined with interfaces
- **Type Exports**: Types are explicitly exported where needed
- **Generic Types**: Proper use of generics for reusable components
- **Strict Typing**: No `any` types, proper null checks
- **Async/Await**: All I/O operations are properly async

## Async Implementation

All storage and email operations are fully async:

- File system operations use `fs/promises`
- S3 operations use AWS SDK async methods
- SMTP email sending uses nodemailer's async API
- No synchronous I/O operations

## Migration Guide

### Switching from S3 to Local Storage

1. Set environment variable:
   ```
   STORAGE_TYPE=local
   STORAGE_LOCAL_PATH=./data/repos
   ```

2. Restart the API server

3. The API will automatically use local file system storage

### Switching from Resend to SMTP

1. Set environment variables:
   ```
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-username
   SMTP_PASS=your-password
   ```

2. Restart the API server

3. Emails will be sent via SMTP

## Benefits

1. **Flexibility**: Easy to switch between storage and email providers
2. **Development**: Local storage makes development easier without requiring S3 credentials
3. **Testing**: SMTP allows testing email sending without external services
4. **Type Safety**: All operations are fully typed
5. **Async Performance**: No blocking I/O operations
6. **Backwards Compatible**: Existing code continues to work

## Future Enhancements

Potential future storage backends:
- Azure Blob Storage
- Google Cloud Storage
- MinIO
- Other S3-compatible services

Potential future email providers:
- SendGrid
- Mailgun
- Amazon SES
- Custom SMTP servers

## Testing Recommendations

1. Test with local storage for development
2. Test with S3 for production-like scenarios
3. Test both email providers
4. Verify type safety with TypeScript compiler
5. Run lint checks to maintain code quality

## Dependencies Added

- `nodemailer`: SMTP email support
- `@types/nodemailer`: TypeScript types for nodemailer

All other dependencies are existing.
