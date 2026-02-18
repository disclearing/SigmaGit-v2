# Security Guide

This guide covers security best practices for developing and deploying Sigmagit.

## Authentication & Authorization

### User Authentication

Sigmagit uses [better-auth](https://better-auth.com) for authentication:

- Email/password authentication
- Passkey (WebAuthn) support
- Session-based authentication
- Secure cookie handling

### Security Features

- Password hashing with bcrypt
- CSRF protection
- Session expiration
- Rate limiting on auth endpoints
- Secure password reset flow

### Implementing Secure Routes

```typescript
import { requireAuth } from '@/middleware/auth';

app.get('/api/protected', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({ data: user });
});
```

## Data Protection

### Encryption at Rest

- Database encryption (PostgreSQL TDE)
- S3 bucket encryption (AES-256)
- Environment variable encryption

### Encryption in Transit

- HTTPS only (TLS 1.2+)
- Secure WebSocket connections (WSS)
- Encrypted database connections

### Sensitive Data Handling

- Never log sensitive data (passwords, tokens)
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Sanitize error messages before returning to users
- Implement data masking in logs

## API Security

### Rate Limiting

Protect endpoints from abuse:

```typescript
import { rateLimiter } from '@/middleware/rate-limiter';

app.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
}));
```

### Input Validation

Always validate and sanitize inputs:

```typescript
import { z } from 'zod';

const createRepoSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  visibility: z.enum(['public', 'private']),
});

app.post('/api/repositories', async (c) => {
  const body = await c.req.json();
  const validated = createRepoSchema.parse(body);
  // Process...
});
```

### SQL Injection Prevention

Use parameterized queries via Drizzle ORM:

```typescript
// Safe - uses parameterized queries
const repos = await db
  .select()
  .from(repositories)
  .where(eq(repositories.ownerId, userId));

// Never do this
const unsafe = db.run(`SELECT * FROM repositories WHERE owner_id = ${userId}`);
```

### XSS Prevention

- Use React's built-in XSS protection
- Sanitize user-generated content
- Set Content Security Policy (CSP) headers
- Escape data in templates

## Webhook Security

### Webhook Verification

Implement signature verification:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Discord Bot Security

- Store Discord bot token in environment variables
- Validate all interaction inputs
- Implement command rate limiting
- Check user permissions for admin commands

## Git Operations Security

### Repository Access Control

- Verify user ownership before operations
- Check visibility settings before access
- Implement branch protection rules
- Limit git pack file sizes

### Storage Security

- Use IAM roles with least privilege
- Implement S3 bucket policies
- Enable versioning for recovery
- Use presigned URLs for temporary access

```typescript
// Secure S3 upload
async function uploadSecureFile(key: string, content: Buffer, userId: string) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${userId}/${key}`,
    Body: content,
    ContentType: 'application/octet-stream',
  };

  return s3.putObject(params).promise();
}
```

## Session Security

### Secure Session Configuration

```typescript
const sessionConfig = {
  secret: process.env.BETTER_AUTH_SECRET,
  cookie: {
    httpOnly: true,
    secure: true, // HTTPS only
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
```

### Session Management

- Implement session rotation
- Force logout after password change
- Track active sessions
- Implement concurrent session limits

## Password Security

### Password Requirements

Enforce strong passwords:

```typescript
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain special character');
```

### Password Storage

- Never store plaintext passwords
- Use bcrypt with appropriate work factor (10+)
- Implement password expiration
- Check password breach lists (Have I Been Pwned API)

## CORS Configuration

Configure CORS properly:

```typescript
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Security Headers

Set security headers in your API:

```typescript
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Content-Security-Policy', "default-src 'self'");
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  return next();
});
```

## Dependency Security

### Keeping Dependencies Updated

```bash
# Check for vulnerabilities
bun audit

# Update dependencies
bun update

# Check for outdated packages
bun outdated
```

### Using Dependabot

Configure `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "bun"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

## Logging & Monitoring

### Security Logging

Log security-relevant events:

- Failed login attempts
- Password changes
- Permission escalations
- API key usage
- Webhook deliveries

```typescript
// Security event logging
await logSecurityEvent({
  type: 'auth_failure',
  userId: attempt.userId,
  ip: c.req.header('x-forwarded-for'),
  userAgent: c.req.header('user-agent'),
  timestamp: new Date(),
});
```

### Monitoring Security Events

Set up alerts for:
- Brute force attacks
- Unusual API usage patterns
- Failed webhook deliveries
- Database connection failures
- Storage access anomalies

## Common Vulnerabilities

### OWASP Top 10

1. **Injection** - Use parameterized queries
2. **Broken Authentication** - Proper session management
3. **Sensitive Data Exposure** - Encrypt data at rest and in transit
4. **XML External Entities (XXE)** - Avoid XML parsing if possible
5. **Broken Access Control** - Verify permissions on every operation
6. **Security Misconfiguration** - Review all settings
7. **Cross-Site Scripting (XSS)** - Escape user input
8. **Insecure Deserialization** - Avoid deserializing untrusted data
9. **Using Components with Known Vulnerabilities** - Update dependencies
10. **Insufficient Logging & Monitoring** - Log and monitor security events

### Preventing Common Attacks

- **CSRF**: Use anti-CSRF tokens
- **SSRF**: Validate all URLs and use allowlists
- **IDOR**: Verify ownership on every resource access
- **Open Redirect**: Validate redirect URLs
- **Path Traversal**: Sanitize file paths

## Security Audits

### Regular Security Reviews

- Code reviews with security focus
- Third-party security audits
- Penetration testing
- Dependency vulnerability scans

### Tools

- **Snyk** - Dependency vulnerability scanner
- **Semgrep** - Static analysis
- **ESLint** - Code quality and security
- **Prettier** - Code formatting

## Incident Response

### Security Incident Checklist

1. Identify and contain the incident
2. Preserve evidence (logs, data)
3. Notify affected users (if required)
4. Patch vulnerabilities
5. Review and update policies
6. Conduct post-mortem

### Reporting Security Issues

Create a `SECURITY.md` file:

```markdown
# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please email security@sigmagit.dev.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Impact assessment

We will respond within 48 hours and work with you to resolve the issue.
```

## Compliance

### GDPR Considerations

- User consent for data collection
- Right to data deletion
- Data export functionality
- Clear privacy policy

### SOC 2 (If Required)

- Implement proper access controls
- Maintain audit logs
- Regular security assessments
- Incident response procedures
