# VPS Deployment Guide

This guide covers deploying Sigmagit to a Virtual Private Server (VPS) running Linux (Ubuntu/Debian).

## Prerequisites

- VPS with at least 2GB RAM and 20GB storage
- Ubuntu 22.04 LTS or Debian 12 (recommended)
- Root access or sudo privileges
- Domain name pointed to VPS IP

## Table of Contents

1. [Initial Server Setup](#initial-server-setup)
2. [Install Dependencies](#install-dependencies)
3. [Database Setup](#database-setup)
4. [Application Setup](#application-setup)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL with Let's Encrypt](#ssl-with-lets-encrypt)
7. [Process Management with PM2](#process-management-with-pm2)
8. [Firewall Configuration](#firewall-configuration)
9. [Security Hardening](#security-hardening)
10. [Monitoring and Logs](#monitoring-and-logs)
11. [Updates and Maintenance](#updates-and-maintenance)
12. [Troubleshooting](#troubleshooting)

## Initial Server Setup

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Create Non-Root User

```bash
# Create user
sudo adduser sigmagit

# Add to sudo group
sudo usermod -aG sudo sigmagit

# Switch to new user
su - sigmagit
```

### Set Up SSH Keys

```bash
# On your local machine
ssh-keygen -t ed25519 -C "your-email@example.com"
ssh-copy-id sigmagit@your-vps-ip

# Disable password authentication (optional but recommended)
sudo nano /etc/ssh/sshd_config
# Change: PasswordAuthentication no
sudo systemctl restart ssh
```

## Install Dependencies

### Install Bun

```bash
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
bun --version
```

### Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo -u postgres psql --version
```

### Install Redis

```bash
sudo apt install redis-server -y

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
# Should return: PONG
```

### Install Nginx

```bash
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### Install PM2

```bash
npm install -g pm2

# Verify
pm2 --version
```

### Install Certbot (for SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

## Database Setup

### Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE sigmagit;
CREATE USER sigmagit WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sigmagit TO sigmagit;
\q
```

### Configure PostgreSQL for Remote Access (Optional)

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf

# Uncomment and modify:
listen_addresses = 'localhost'  # or '*' for remote access

sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add line (if needed):
host    sigmagit    sigmagit    127.0.0.1/32    md5

sudo systemctl restart postgresql
```

### Apply Database Migrations

```bash
cd /home/sigmagit/sigmagit
bun run db:migrate
```

## Application Setup

### Clone Repository

```bash
cd /home/sigmagit
git clone https://github.com/yourusername/sigmagit.git
cd sigmagit
```

### Install Dependencies

```bash
bun install
```

### Create Environment File

```bash
cp .env.example .env
nano .env
```

Configure your environment:

```env
# Application
NODE_ENV=production
API_URL=https://api.yourdomain.com
WEB_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://sigmagit:your_secure_password@localhost:5432/sigmagit

# Storage (Local for VPS)
STORAGE_TYPE=local
STORAGE_PATH=/home/sigmagit/sigmagit-storage

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
BETTER_AUTH_SECRET=your-super-secret-key-min-32-characters
BETTER_AUTH_URL=https://api.yourdomain.com

# Email (Resend or SMTP)
RESEND_API_KEY=re_xxxxxxxxxxxx
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Discord Bot (Optional)
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_BOT_CLIENT_ID=your_client_id
DISCORD_WEBHOOK_SECRET=your_webhook_secret
```

### Create Storage Directory

```bash
mkdir -p /home/sigmagit/sigmagit-storage
chmod 755 /home/sigmagit/sigmagit-storage
```

### Build Applications

```bash
bun run build
```

## Nginx Configuration

### Create Configuration for Web App

```bash
sudo nano /etc/nginx/sites-available/sigmagit-web
```

Add the following:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /home/sigmagit/sigmagit/apps/web/build/client;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

### Create Configuration for API

```bash
sudo nano /etc/nginx/sites-available/sigmagit-api
```

Add the following:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Handle Git smart HTTP protocol
    location ~ /\.git {
        client_max_body_size 100M;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    # API endpoints
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable Sites

```bash
sudo ln -s /etc/nginx/sites-available/sigmagit-web /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/sigmagit-api /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## SSL with Let's Encrypt

### Obtain SSL Certificates

```bash
# For main domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For API subdomain
sudo certbot --nginx -d api.yourdomain.com
```

Follow the prompts to:
- Enter email for renewal notices
- Agree to terms
- Choose to redirect HTTP to HTTPS

### Auto-Renewal

Certbot sets up auto-renewal. Verify:

```bash
sudo certbot renew --dry-run
```

## Process Management with PM2

### Start API Server

```bash
cd /home/sigmagit/sigmagit

# Start API
pm2 start node --name "sigmagit-api" -- apps/api/dist/index.js

# Start Discord Bot (optional)
pm2 start bun --name "sigmagit-discord" -- run --env-file .env apps/discord-bot/src/index.ts
```

### Create PM2 Ecosystem File

```bash
pm2 ecosystem
```

Edit `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'sigmagit-api',
      script: 'apps/api/dist/index.js',
      interpreter: 'node',
      cwd: '/home/sigmagit/sigmagit',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/home/sigmagit/logs/api-error.log',
      out_file: '/home/sigmagit/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G',
    },
    {
      name: 'sigmagit-discord',
      script: 'apps/discord-bot/src/index.ts',
      interpreter: 'bun',
      interpreter_args: '--env-file .env',
      cwd: '/home/sigmagit/sigmagit',
      error_file: '/home/sigmagit/logs/discord-error.log',
      out_file: '/home/sigmagit/logs/discord-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ],
};
```

### Start with Ecosystem

```bash
# Start all apps
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Run the command output by pm2 startup
```

### PM2 Commands

```bash
# List all processes
pm2 list

# View logs
pm2 logs

# View logs for specific app
pm2 logs sigmagit-api

# Restart app
pm2 restart sigmagit-api

# Stop app
pm2 stop sigmagit-api

# Delete app
pm2 delete sigmagit-api

# Monitor
pm2 monit
```

## Firewall Configuration

### Configure UFW (Uncomplicated Firewall)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Limit SSH Access

```bash
# Limit SSH to specific IP (optional)
sudo ufw limit from your-ip-address to any port 22

# Or disable password auth (already done in SSH config)
```

## Security Hardening

### System Updates

```bash
# Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### File Permissions

```bash
# Secure environment file
chmod 600 .env

# Secure storage directory
chmod 755 /home/sigmagit/sigmagit-storage
```

### Fail2Ban (Optional)

```bash
sudo apt install fail2ban -y
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### Disable Root SSH Login

```bash
sudo nano /etc/ssh/sshd_config

# Change:
PermitRootLogin no

sudo systemctl restart ssh
```

## Monitoring and Logs

### Create Log Directory

```bash
mkdir -p /home/sigmagit/logs
```

### View Application Logs

```bash
# API logs
pm2 logs sigmagit-api --lines 100

# Discord bot logs
pm2 logs sigmagit-discord --lines 100

# Real-time monitoring
pm2 logs
```

### View System Logs

```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# System logs
sudo journalctl -f
```

### Monitor System Resources

```bash
# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top

# Process monitoring
htop  # Install: sudo apt install htop
```

### Set Up Log Rotation

Create `/etc/logrotate.d/sigmagit`:

```bash
sudo nano /etc/logrotate.d/sigmagit
```

Add:

```
/home/sigmagit/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 sigmagit sigmagit
    sharedscripts
    postrotate
        pm2 reload sigmagit-api
    endscript
}
```

## Updates and Maintenance

### Update Application

```bash
cd /home/sigmagit/sigmagit

# Pull latest changes
git pull origin main

# Install new dependencies
bun install

# Build
bun run build

# Run migrations
bun run db:migrate

# Restart PM2
pm2 restart all
```

### Update Database Schema

```bash
cd /home/sigmagit/sigmagit

# Generate migrations (if schema changed)
bun run db:generate

# Apply migrations
bun run db:migrate
```

### Backup Database

```bash
# Create backup script
nano /home/sigmagit/scripts/backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/sigmagit/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sigmagit_$DATE.sql"

mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='your_password' pg_dump -h localhost -U sigmagit sigmagit > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

Make executable and set up cron job:

```bash
chmod +x /home/sigmagit/scripts/backup.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/sigmagit/scripts/backup.sh
```

### Update Bun

```bash
bun upgrade
```

### Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

## Troubleshooting

### Application Won't Start

Check PM2 logs:

```bash
pm2 logs sigmagit-api --err
```

Common issues:
- Port already in use: `lsof -ti:3001 | xargs kill`
- Database connection: Check `DATABASE_URL` in `.env`
- Missing dependencies: Run `bun install`

### Nginx 502 Bad Gateway

Check if API is running:

```bash
pm2 list
curl http://localhost:3001
```

Check Nginx error log:

```bash
sudo tail -f /var/log/nginx/error.log
```

### Database Connection Issues

Test PostgreSQL connection:

```bash
psql -h localhost -U sigmagit -d sigmagit
```

Check PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

### SSL Certificate Issues

Check certificate status:

```bash
sudo certbot certificates
```

Renew manually:

```bash
sudo certbot renew
```

### Memory Issues

Check memory usage:

```bash
free -h
pm2 monit
```

Reduce PM2 instances in ecosystem.config.js if needed.

### Disk Space Issues

Check disk usage:

```bash
df -h
du -sh /home/sigmagit/*
```

Clean up old logs:

```bash
pm2 flush
```

Clean npm cache:

```bash
bun pm cache rm
```

## Production Checklist

Before going live, ensure:

- [ ] Domain DNS is pointing to VPS IP
- [ ] SSL certificates are installed and working
- [ ] Firewall is configured
- [ ] Database migrations are applied
- [ ] Environment variables are set correctly
- [ ] Applications are running under PM2
- [ ] Logs are being collected
- [ ] Database backup script is configured
- [ ] Monitor system resources
- [ ] Test all critical features (auth, git operations, etc.)

## Performance Tuning

### Nginx Optimizations

Add to `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### PostgreSQL Optimizations

Edit `/etc/postgresql/*/main/postgresql.conf`:

```ini
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 2
max_parallel_workers_per_gather = 2
max_parallel_workers = 2
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### Redis Optimizations

Edit `/etc/redis/redis.conf`:

```ini
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

Restart Redis:

```bash
sudo systemctl restart redis-server
```

## Scaling Considerations

### Horizontal Scaling

When you need to scale beyond single VPS:

1. Move database to managed PostgreSQL (RDS, Neon, Supabase)
2. Move Redis to managed Redis (ElastiCache, Upstash)
3. Use load balancer for multiple app instances
4. Set up Redis for session storage across instances

### Vertical Scaling

Upgrade VPS resources:
- RAM: 4GB+ for high traffic
- CPU: 4+ cores for concurrent requests
- Storage: SSD for better I/O performance

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
