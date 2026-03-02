# Deployment Guide

This guide covers deploying Sigmagit to production environments.

## Prerequisites

- Production database (PostgreSQL 15+)
- Object storage (S3 or compatible)
- Redis instance (optional, for caching)
- Domain name with SSL certificate
- Server with Node.js/Bun support

## Environment Variables

Create a production `.env` file with all required variables:

```env
# Application
NODE_ENV=production
API_URL=https://api.yourdomain.com
WEB_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/sigmagit

# Storage (choose one)
# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=sigmagit-storage

# Or local filesystem
STORAGE_TYPE=local
STORAGE_PATH=/var/lib/sigmagit/storage

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://api.yourdomain.com

# Email (Resend or SMTP)
RESEND_API_KEY=your_resend_key
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Discord Bot (optional)
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_BOT_CLIENT_ID=your_client_id
DISCORD_WEBHOOK_SECRET=your_webhook_secret
```

## Building for Production

### Build All Applications

```bash
bun install --production
bun run build
```

### Individual Applications

```bash
# Web app
cd apps/web && bun run build

# API server
cd apps/api && bun run build

# Discord bot
cd apps/discord-bot && bun run build
```

## Database Setup

1. Create production database:
   ```sql
   CREATE DATABASE sigmagit;
   ```

2. Run migrations:
   ```bash
   bun run db:migrate
   ```

3. Seed initial data (optional):
   ```bash
   bun run db:seed
   ```

## Deployment Options

### Option 1: Docker Deployment

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/sigmagit
    depends_on:
      - db

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/sigmagit
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=sigmagit
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Deploy with:
```bash
docker-compose up -d
```

### Option 2: Cloud Platform Deployment

#### Vercel (Web App)

1. Connect repository to Vercel
2. Set root directory to `apps/web`
3. Configure environment variables
4. Deploy

#### Railway/API/AWS (API Server)

1. Push built `apps/api/dist` to server
2. Install dependencies: `bun install --production`
3. Set environment variables
4. Start with PM2:
   ```bash
   npm install -g pm2
   pm2 start node --name sigmagit-api -- apps/api/dist/index.js
   pm2 startup
   pm2 save
   ```

#### Render/Heroku (All-in-One)

Create a `Procfile`:
```
web: cd apps/web && bun run dev
api: cd apps/api && bun run dev
```

Configure build commands and environment variables in platform settings.

### Option 3: Kubernetes Deployment

Create deployment manifests for each service.

Example `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sigmagit-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sigmagit-web
  template:
    metadata:
      labels:
        app: sigmagit-web
    spec:
      containers:
      - name: web
        image: your-registry/sigmagit-web:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: sigmagit-secrets
              key: database-url
```

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] DNS records updated
- [ ] Health check endpoints working
- [ ] Monitoring and logging setup
- [ ] Backup strategy configured
- [ ] Discord bot registered (if using)
- [ ] Webhook URLs configured
- [ ] Storage buckets accessible
- [ ] Redis connected (if using)

## Monitoring and Logging

### Health Checks

Add health check endpoints:
- `/api/health` - API server health
- `/api/health/db` - Database connection

### Log Aggregation

Use services like:
- Datadog
- LogRocket
- Sentry
- CloudWatch (AWS)
- Cloud Logging (GCP)

### Performance Monitoring

- APM tools (New Relic, Datadog)
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot, Pingdom)

## Scaling Considerations

### Database

- Use connection pooling
- Add read replicas for high read loads
- Enable query caching
- Regular vacuum and analyze

### API Server

- Horizontal scaling behind load balancer
- Implement rate limiting
- Use Redis for session storage
- Enable compression

### Storage

- Use S3 lifecycle policies
- Enable CDN for static assets
- Implement cache headers
- Use multipart uploads for large files

### Redis

- Configure persistence (RDB + AOF)
- Set memory limits and eviction policies
- Use Redis Cluster for scaling
- Monitor memory usage

## Backup Strategy

### Database Backups

```bash
# Daily backup
pg_dump -U postgres sigmagit > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres sigmagit < backup_20240218.sql
```

### Storage Backups

- Enable S3 versioning
- Cross-region replication
- Regular snapshot backups

### Configuration Backups

- Version control all configuration
- Backup environment variables securely
- Document all custom configurations

## Security Hardening

- Enable HTTPS only
- Set secure HTTP headers (CSP, HSTS, etc.)
- Implement rate limiting
- Use secrets management (HashiCorp Vault, AWS Secrets Manager)
- Regular security audits
- Keep dependencies updated
- Enable firewall rules
- Use WAF (Web Application Firewall)

## Rollback Procedure

1. Identify last stable version
2. Revert database migrations if needed
3. Deploy previous build
4. Verify health checks
5. Monitor logs and metrics

## Troubleshooting

### Database Connection Failed

- Check `DATABASE_URL`
- Verify database is running
- Check firewall rules
- Verify credentials

### Storage Access Denied

- Check IAM permissions
- Verify bucket name and region
- Check access keys

### High Memory Usage

- Check for memory leaks
- Review caching strategy
- Increase allocated memory
- Add horizontal scaling

### Slow API Response Times

- Review database queries (use EXPLAIN)
- Check Redis caching
- Review logs for bottlenecks
- Consider CDN for static assets
