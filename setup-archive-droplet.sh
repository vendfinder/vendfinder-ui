#!/bin/bash
# setup-archive-droplet.sh
# Complete setup for archive droplet with PostgreSQL

set -euo pipefail

echo "=== VendFinder Archive Droplet Setup ==="
echo "Timestamp: $(date)"
echo

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo "📋 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create archive directory structure
echo "📁 Creating archive directory structure..."
sudo mkdir -p /opt/vendfinder-archive
sudo mkdir -p /opt/vendfinder-archive/data
sudo mkdir -p /opt/vendfinder-archive/backups
sudo mkdir -p /opt/vendfinder-archive/logs

# Set proper permissions
sudo chown -R $USER:$USER /opt/vendfinder-archive

# Create Docker Compose configuration
echo "🐳 Creating Docker Compose configuration..."
cat > /opt/vendfinder-archive/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: vendfinder-archive-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: vendfinder_archive
      POSTGRES_PASSWORD: ${ARCHIVE_DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - ./data:/var/lib/postgresql/data
      - ./backups:/backups
      - ./logs:/var/log/postgresql
    networks:
      - archive-network
    command: postgres -c logging_collector=on -c log_directory=/var/log/postgresql

  pgadmin:
    image: dpage/pgadmin4
    container_name: vendfinder-archive-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "8080:80"
    depends_on:
      - postgres
    networks:
      - archive-network

networks:
  archive-network:
    driver: bridge
EOF

# Create environment file
echo "🔐 Creating environment configuration..."
cat > /opt/vendfinder-archive/.env << EOF
# Archive Database Credentials
ARCHIVE_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-20)

# PgAdmin Credentials
PGADMIN_EMAIL=admin@vendfinder.com
PGADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)
EOF

# Create archive management scripts
echo "📝 Creating management scripts..."

# Start script
cat > /opt/vendfinder-archive/start-archive.sh << 'EOF'
#!/bin/bash
cd /opt/vendfinder-archive
docker-compose up -d
echo "✅ Archive database started"
echo "📊 PgAdmin available at: http://$(curl -s ifconfig.me):8080"
echo "🔗 Database connection: postgresql://vendfinder_archive:$(grep ARCHIVE_DB_PASSWORD .env | cut -d= -f2)@$(curl -s ifconfig.me):5432/postgres"
EOF

# Stop script
cat > /opt/vendfinder-archive/stop-archive.sh << 'EOF'
#!/bin/bash
cd /opt/vendfinder-archive
docker-compose down
echo "🛑 Archive database stopped"
EOF

# Backup script
cat > /opt/vendfinder-archive/backup-archive.sh << 'EOF'
#!/bin/bash
cd /opt/vendfinder-archive
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dumpall -U vendfinder_archive > backups/full_archive_backup_$BACKUP_DATE.sql
echo "💾 Archive backup created: backups/full_archive_backup_$BACKUP_DATE.sql"
EOF

# Status script
cat > /opt/vendfinder-archive/status-archive.sh << 'EOF'
#!/bin/bash
cd /opt/vendfinder-archive
echo "=== Archive Database Status ==="
docker-compose ps
echo
echo "=== Database Size ==="
docker-compose exec postgres psql -U vendfinder_archive -c "
SELECT
    datname as database,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
WHERE datistemplate = false
ORDER BY pg_database_size(datname) DESC;
"
EOF

# Make scripts executable
chmod +x /opt/vendfinder-archive/*.sh

# Create firewall rules
echo "🔥 Configuring firewall..."
sudo ufw allow 5432/tcp comment "PostgreSQL Archive Database"
sudo ufw allow 8080/tcp comment "PgAdmin Web Interface"
sudo ufw --force enable

# Start the archive database
echo "🚀 Starting archive database..."
cd /opt/vendfinder-archive
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Create archive databases
echo "🔨 Creating archive databases..."
source .env

docker-compose exec postgres createdb -U vendfinder_archive user_db_archive
docker-compose exec postgres createdb -U vendfinder_archive order_db_archive
docker-compose exec postgres createdb -U vendfinder_archive product_db_archive
docker-compose exec postgres createdb -U vendfinder_archive chat_db_archive
docker-compose exec postgres createdb -U vendfinder_archive analytics_db_archive
docker-compose exec postgres createdb -U vendfinder_archive vendor_db_archive

echo "✅ Archive droplet setup complete!"
echo
echo "📊 Archive Database Details:"
echo "   Host: $(curl -s ifconfig.me)"
echo "   Port: 5432"
echo "   User: vendfinder_archive"
echo "   Password: $ARCHIVE_DB_PASSWORD"
echo
echo "🌐 PgAdmin Web Interface:"
echo "   URL: http://$(curl -s ifconfig.me):8080"
echo "   Email: admin@vendfinder.com"
echo "   Password: $(grep PGADMIN_PASSWORD .env | cut -d= -f2)"
echo
echo "🎯 Ready for data import!"

# Save connection details for import script
cat > /opt/vendfinder-archive/connection-info.txt << EOF
# Archive Database Connection Details
# Use these values when running the import script

export ARCHIVE_HOST="$(curl -s ifconfig.me)"
export ARCHIVE_PORT="5432"
export ARCHIVE_USER="vendfinder_archive"
export ARCHIVE_PASSWORD="$ARCHIVE_DB_PASSWORD"
export ARCHIVE_SSLMODE="disable"

# Import command:
# source /opt/vendfinder-archive/connection-info.txt
# ./import-to-archive.sh database_exports_YYYYMMDD_HHMMSS
EOF

echo "📄 Connection details saved to: /opt/vendfinder-archive/connection-info.txt"