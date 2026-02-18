#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables
DEPLOY_USER="sigmagit"
DEPLOY_DIR="/home/$DEPLOY_USER"
APP_DIR="$DEPLOY_DIR/sigmagit"
STORAGE_DIR="$DEPLOY_DIR/sigmagit-storage"
LOGS_DIR="$DEPLOY_DIR/logs"
BACKUP_DIR="$DEPLOY_DIR/backups"
SCRIPTS_DIR="$DEPLOY_DIR/scripts"
DB_NAME="sigmagit"
DB_USER="sigmagit"
WEB_DOMAIN=""
API_DOMAIN=""
GIT_REPO=""
DB_PASSWORD=""
RESEND_API_KEY=""
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
BETTER_AUTH_SECRET=""
DISCORD_BOT_TOKEN=""
DISCORD_BOT_CLIENT_ID=""
DISCORD_WEBHOOK_SECRET=""

# Helper functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
  if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root or with sudo"
    exit 1
  fi
}

check_ubuntu_debian() {
  if ! command -v apt-get &> /dev/null; then
    log_error "This script is designed for Ubuntu/Debian systems only"
    exit 1
  fi
}

prompt_input() {
  local prompt_text="$1"
  local default_value="$2"
  local var_name="$3"
  
  if [ -n "$default_value" ]; then
    read -p "$prompt_text [$default_value]: " input
    input=${input:-$default_value}
  else
    read -p "$prompt_text: " input
  fi
  
  eval "$var_name='$input'"
}

prompt_password() {
  local prompt_text="$1"
  local var_name="$2"
  
  while true; do
    read -s -p "$prompt_text: " input1
    echo
    read -s -p "Confirm $prompt_text: " input2
    echo
    
    if [ "$input1" == "$input2" ]; then
      eval "$var_name='$input1'"
      break
    else
      log_error "Passwords do not match. Please try again."
    fi
  done
}

update_system() {
  log_info "Updating system packages..."
  apt update && apt upgrade -y
}

create_user() {
  log_info "Creating deployment user..."
  
  if id "$DEPLOY_USER" &>/dev/null; then
    log_warn "User $DEPLOY_USER already exists. Skipping..."
  else
    adduser --gecos "" --disabled-password "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    
    # Set up passwordless sudo for specific commands
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:/usr/sbin/service, /bin/systemctl" > /etc/sudoers.d/$DEPLOY_USER
    chmod 440 /etc/sudoers.d/$DEPLOY_USER
    
    log_info "User $DEPLOY_USER created successfully"
  fi
  
  # Create necessary directories
  mkdir -p "$LOGS_DIR"
  mkdir -p "$BACKUP_DIR"
  mkdir -p "$SCRIPTS_DIR"
  mkdir -p "$STORAGE_DIR"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
}

install_bun() {
  log_info "Installing Bun..."
  
  if command -v bun &> /dev/null; then
    log_warn "Bun is already installed. Skipping..."
    bun upgrade
  else
    su - "$DEPLOY_USER" -c 'curl -fsSL https://bun.sh/install | bash'
    
    # Add Bun to PATH for the user
    echo 'export BUN_INSTALL="$HOME/.bun"' >> "$DEPLOY_DIR/.bashrc"
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$DEPLOY_DIR/.bashrc"
    
    log_info "Bun installed successfully"
  fi
  
  # Verify installation
  su - "$DEPLOY_USER" -c 'bun --version'
}

install_postgresql() {
  log_info "Installing PostgreSQL..."
  
  if command -v psql &> /dev/null; then
    log_warn "PostgreSQL is already installed. Skipping..."
  else
    apt install postgresql postgresql-contrib -y
    systemctl start postgresql
    systemctl enable postgresql
    log_info "PostgreSQL installed successfully"
  fi
}

setup_database() {
  log_info "Setting up database..."
  
  # Create database and user
  sudo -u postgres psql << EOF
SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
DO
\$do\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
   END IF
END
\$do\$;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
  
  log_info "Database and user created successfully"
}

install_redis() {
  log_info "Installing Redis..."
  
  if command -v redis-cli &> /dev/null; then
    log_warn "Redis is already installed. Skipping..."
  else
    apt install redis-server -y
    systemctl start redis-server
    systemctl enable redis-server
    log_info "Redis installed successfully"
  fi
  
  # Configure Redis
  sed -i 's/^# maxmemory 256mb/maxmemory 512mb/' /etc/redis/redis.conf 2>/dev/null || echo "maxmemory 512mb" >> /etc/redis/redis.conf
  sed -i 's/^# maxmemory-policy volatile-lru/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf 2>/dev/null || echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
  
  systemctl restart redis-server
  
  # Verify
  redis-cli ping
}

install_nginx() {
  log_info "Installing Nginx..."
  
  if command -v nginx &> /dev/null; then
    log_warn "Nginx is already installed. Skipping..."
  else
    apt install nginx -y
    systemctl start nginx
    systemctl enable nginx
    log_info "Nginx installed successfully"
  fi
}

install_pm2() {
  log_info "Installing PM2..."
  
  if su - "$DEPLOY_USER" -c 'command -v pm2' &> /dev/null; then
    log_warn "PM2 is already installed. Skipping..."
  else
    apt install -y npm
    npm install -g pm2
    log_info "PM2 installed successfully"
  fi
  
  # Verify
  pm2 --version
}

install_certbot() {
  log_info "Installing Certbot..."
  
  if command -v certbot &> /dev/null; then
    log_warn "Certbot is already installed. Skipping..."
  else
    apt install certbot python3-certbot-nginx -y
    log_info "Certbot installed successfully"
  fi
}

clone_repository() {
  log_info "Cloning repository..."
  
  if [ -d "$APP_DIR" ]; then
    log_warn "Repository already exists. Pulling latest changes..."
    cd "$APP_DIR"
    su - "$DEPLOY_USER" -c "cd $APP_DIR && git pull origin main"
  else
    su - "$DEPLOY_USER" -c "git clone $GIT_REPO $APP_DIR"
    log_info "Repository cloned successfully"
  fi
}

install_dependencies() {
  log_info "Installing application dependencies..."
  su - "$DEPLOY_USER" -c "cd $APP_DIR && bun install"
}

create_env_file() {
  log_info "Creating environment file..."
  
  cat > "$APP_DIR/.env" << EOF
# Application
NODE_ENV=production
API_URL=https://$API_DOMAIN
WEB_URL=https://$WEB_DOMAIN

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Storage (Local for VPS)
STORAGE_TYPE=local
STORAGE_PATH=$STORAGE_DIR

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
BETTER_AUTH_URL=https://$API_DOMAIN

# Email
RESEND_API_KEY=$RESEND_API_KEY
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD

# Discord Bot (Optional)
DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
DISCORD_BOT_CLIENT_ID=$DISCORD_BOT_CLIENT_ID
DISCORD_WEBHOOK_SECRET=$DISCORD_WEBHOOK_SECRET
EOF
  
  chmod 600 "$APP_DIR/.env"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/.env"
  
  log_info "Environment file created successfully"
}

run_migrations() {
  log_info "Running database migrations..."
  su - "$DEPLOY_USER" -c "cd $APP_DIR && bun run db:migrate"
}

build_application() {
  log_info "Building application..."
  su - "$DEPLOY_USER" -c "cd $APP_DIR && bun run build"
}

configure_nginx() {
  log_info "Configuring Nginx..."
  
  # Web app configuration
  cat > "/etc/nginx/sites-available/sigmagit-web" << EOF
server {
    listen 80;
    server_name $WEB_DOMAIN www.$WEB_DOMAIN;

    root $APP_DIR/apps/web/build/client;
    index index.html;

    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF
  
  # API configuration
  cat > "/etc/nginx/sites-available/sigmagit-api" << EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    # Handle Git smart HTTP protocol
    location ~ /\.git {
        client_max_body_size 100M;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    # API endpoints
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
  
  # Enable sites
  ln -sf /etc/nginx/sites-available/sigmagit-web /etc/nginx/sites-enabled/
  ln -sf /etc/nginx/sites-available/sigmagit-api /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default
  
  # Test and reload Nginx
  nginx -t && systemctl reload nginx
  
  log_info "Nginx configured successfully"
}

setup_ssl() {
  log_info "Setting up SSL certificates..."
  
  # Obtain SSL for web domain
  certbot --nginx -d "$WEB_DOMAIN" -d "www.$WEB_DOMAIN" --non-interactive --agree-tos --email "admin@$WEB_DOMAIN" || true
  
  # Obtain SSL for API domain
  certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos || true
  
  log_info "SSL certificates configured"
}

create_pm2_ecosystem() {
  log_info "Creating PM2 ecosystem configuration..."
  
  cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'sigmagit-api',
      script: 'apps/api/dist/index.js',
      interpreter: 'node',
      cwd: '$APP_DIR',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '$LOGS_DIR/api-error.log',
      out_file: '$LOGS_DIR/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G',
    },
    {
      name: 'sigmagit-discord',
      script: 'apps/discord-bot/src/index.ts',
      interpreter: 'bun',
      interpreter_args: '--env-file .env',
      cwd: '$APP_DIR',
      error_file: '$LOGS_DIR/discord-error.log',
      out_file: '$LOGS_DIR/discord-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ],
};
EOF
  
  chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/ecosystem.config.js"
  
  log_info "PM2 ecosystem configuration created"
}

start_applications() {
  log_info "Starting applications with PM2..."
  
  su - "$DEPLOY_USER" -c "cd $APP_DIR && pm2 start ecosystem.config.js"
  su - "$DEPLOY_USER" -c "pm2 save"
  
  # Setup PM2 startup
  su - "$DEPLOY_USER" -c "pm2 startup" -u "$DEPLOY_USER" | grep -E '^sudo env PATH=' | sh || true
  
  log_info "Applications started successfully"
}

configure_firewall() {
  log_info "Configuring firewall..."
  
  # Check if UFW is installed
  if ! command -v ufw &> /dev/null; then
    apt install ufw -y
  fi
  
  # Allow SSH
  ufw allow 22/tcp
  
  # Allow HTTP
  ufw allow 80/tcp
  
  # Allow HTTPS
  ufw allow 443/tcp
  
  # Enable firewall
  echo "y" | ufw enable
  
  log_info "Firewall configured"
}

create_backup_script() {
  log_info "Creating backup script..."
  
  cat > "$SCRIPTS_DIR/backup.sh" << EOF
#!/bin/bash
BACKUP_DIR="$BACKUP_DIR"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\$BACKUP_DIR/sigmagit_\$DATE.sql"

mkdir -p \$BACKUP_DIR

# Backup database
PGPASSWORD='$DB_PASSWORD' pg_dump -h localhost -U $DB_USER $DB_NAME > \$BACKUP_FILE

# Compress
gzip \$BACKUP_FILE

# Delete backups older than 7 days
find \$BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: \${BACKUP_FILE}.gz"
EOF
  
  chmod +x "$SCRIPTS_DIR/backup.sh"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$SCRIPTS_DIR/backup.sh"
  
  # Add to crontab
  (crontab -l -u "$DEPLOY_USER" 2>/dev/null || true; echo "0 2 * * * $SCRIPTS_DIR/backup.sh >> $LOGS_DIR/backup.log 2>&1") | crontab -u "$DEPLOY_USER" -
  
  log_info "Backup script created and scheduled"
}

setup_log_rotation() {
  log_info "Setting up log rotation..."
  
  cat > "/etc/logrotate.d/sigmagit" << EOF
$LOGS_DIR/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $DEPLOY_USER $DEPLOY_USER
    sharedscripts
    postrotate
        su - $DEPLOY_USER -c 'pm2 reload sigmagit-api'
    endscript
}
EOF
  
  log_info "Log rotation configured"
}

optimize_system() {
  log_info "Optimizing system configuration..."
  
  # Optimize PostgreSQL
  PG_VERSION=$(ls /etc/postgresql/ 2>/dev/null | head -1)
  if [ -n "$PG_VERSION" ]; then
    cat >> "/etc/postgresql/$PG_VERSION/main/postgresql.conf" << EOF

# Sigmagit optimizations
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
EOF
    systemctl restart postgresql
  fi
  
  log_info "System optimizations applied"
}

print_summary() {
  log_info "Deployment completed successfully!"
  echo
  echo "=== Summary ==="
  echo "Web URL: https://$WEB_DOMAIN"
  echo "API URL: https://$API_DOMAIN"
  echo "User: $DEPLOY_USER"
  echo "App Directory: $APP_DIR"
  echo "Storage Directory: $STORAGE_DIR"
  echo "Logs Directory: $LOGS_DIR"
  echo
  echo "=== Useful Commands ==="
  echo "View logs: pm2 logs"
  echo "Monitor: pm2 monit"
  echo "Restart apps: pm2 restart all"
  echo "Update apps: cd $APP_DIR && git pull && bun install && bun run build && pm2 restart all"
  echo "Nginx logs: sudo tail -f /var/log/nginx/access.log"
  echo "PostgreSQL logs: sudo tail -f /var/log/postgresql/postgresql-*-main.log"
  echo
}

# Main deployment flow
main() {
  echo "==================================="
  echo "  Sigmagit VPS Deployment Script  "
  echo "==================================="
  echo
  
  # Pre-flight checks
  check_root
  check_ubuntu_debian
  
  # Gather configuration
  log_info "Please provide the following configuration:"
  prompt_input "Git repository URL" "" GIT_REPO
  prompt_input "Web domain (e.g., yourdomain.com)" "" WEB_DOMAIN
  prompt_input "API domain (e.g., api.yourdomain.com)" "" API_DOMAIN
  prompt_password "Database password" DB_PASSWORD
  prompt_input "Better Auth Secret (min 32 chars)" "" BETTER_AUTH_SECRET
  prompt_input "Resend API Key (optional, press Enter to skip)" "" RESEND_API_KEY
  prompt_input "SMTP Host (optional)" "smtp.gmail.com" SMTP_HOST
  prompt_input "SMTP Port (optional)" "587" SMTP_PORT
  prompt_input "SMTP User (optional)" "" SMTP_USER
  prompt_input "SMTP Password (optional)" "" SMTP_PASSWORD
  prompt_input "Discord Bot Token (optional)" "" DISCORD_BOT_TOKEN
  prompt_input "Discord Bot Client ID (optional)" "" DISCORD_BOT_CLIENT_ID
  prompt_input "Discord Webhook Secret (optional)" "" DISCORD_WEBHOOK_SECRET
  
  echo
  log_warn "Starting deployment process..."
  echo
  
  # Execute deployment steps
  update_system
  create_user
  install_bun
  install_postgresql
  install_redis
  install_nginx
  install_pm2
  install_certbot
  
  setup_database
  clone_repository
  install_dependencies
  create_env_file
  build_application
  run_migrations
  configure_nginx
  setup_ssl
  create_pm2_ecosystem
  start_applications
  configure_firewall
  create_backup_script
  setup_log_rotation
  optimize_system
  
  print_summary
}

main
