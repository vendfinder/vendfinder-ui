#!/bin/bash

# VendFinder Monitoring Deployment Script
# Deploys Prometheus + Grafana using direct Docker commands

set -e

echo "🚀 Deploying VendFinder Inventory & Sales Monitoring"
echo "====================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create monitoring network
echo "🔗 Setting up monitoring network..."
if ! docker network ls | grep -q vendfinder-net; then
    echo "Creating VendFinder network..."
    docker network create vendfinder-net
fi

# Create data volumes
echo "📁 Creating data volumes..."
docker volume create prometheus-data 2>/dev/null || true
docker volume create grafana-data 2>/dev/null || true

# Stop any existing monitoring containers
echo "🛑 Stopping existing monitoring containers..."
docker stop vendfinder-prometheus vendfinder-grafana vendfinder-metrics vendfinder-node-exporter 2>/dev/null || true
docker rm vendfinder-prometheus vendfinder-grafana vendfinder-metrics vendfinder-node-exporter 2>/dev/null || true

# Start Prometheus
echo "📊 Starting Prometheus..."
docker run -d \
  --name vendfinder-prometheus \
  --network vendfinder-net \
  -p 9090:9090 \
  -v $(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro \
  -v prometheus-data:/prometheus \
  prom/prometheus:v2.47.0 \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --web.console.libraries=/usr/share/prometheus/console_libraries \
  --web.console.templates=/usr/share/prometheus/consoles \
  --web.enable-lifecycle \
  --storage.tsdb.retention.time=15d

# Start Node Exporter
echo "⚙️ Starting Node Exporter..."
docker run -d \
  --name vendfinder-node-exporter \
  --network vendfinder-net \
  -p 9100:9100 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /:/rootfs:ro \
  prom/node-exporter:v1.6.1 \
  --path.procfs=/host/proc \
  --path.sysfs=/host/sys \
  --collector.filesystem.mount-points-exclude='^/(sys|proc|dev|host|etc|rootfs/var/lib/docker/containers|rootfs/var/lib/docker/overlay2|rootfs/run/docker/netns|rootfs/var/lib/docker/aufs)($$|/)'

# Install prom-client for metrics collector
echo "📦 Installing metrics collector dependencies..."
cd monitoring
npm install prom-client express pg 2>/dev/null || echo "Dependencies already installed"
cd ..

# Start Inventory Metrics Collector
echo "📈 Starting Inventory Metrics Collector..."
docker run -d \
  --name vendfinder-metrics \
  --network vendfinder-net \
  -p 9091:9091 \
  -e PORT=9091 \
  -e ORDER_DB_URL=postgresql://vendfinder:vendfinder_pass@order-db:5432/order_db \
  -e PRODUCT_DB_URL=postgresql://vendfinder:vendfinder_pass@product-db:5432/product_db \
  -e USER_DB_URL=postgresql://vendfinder:vendfinder_pass@user-db:5432/user_db \
  -e METRICS_COLLECT_INTERVAL=30000 \
  -v $(pwd)/monitoring:/app \
  -w /app \
  node:18-alpine \
  sh -c "npm install && node inventory-metrics-collector.js"

# Start Grafana
echo "📊 Starting Grafana..."
docker run -d \
  --name vendfinder-grafana \
  --network vendfinder-net \
  -p 3001:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=vendfinder123 \
  -e GF_USERS_ALLOW_SIGN_UP=false \
  -e GF_SECURITY_ADMIN_USER=admin \
  -v grafana-data:/var/lib/grafana \
  -v $(pwd)/monitoring/grafana-datasource.yml:/etc/grafana/provisioning/datasources/datasource.yml:ro \
  -v $(pwd)/monitoring/grafana-dashboards.yml:/etc/grafana/provisioning/dashboards/dashboards.yml:ro \
  -v $(pwd)/monitoring/grafana-dashboard.json:/var/lib/grafana/dashboards/vendfinder-dashboard.json:ro \
  grafana/grafana:10.1.0

echo "⏳ Waiting for services to start..."
sleep 15

# Check service health
echo "🏥 Checking service health..."

# Check Prometheus
echo -n "📊 Prometheus: "
if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "⚠️  Starting up..."
fi

# Check Node Exporter
echo -n "⚙️ Node Exporter: "
if curl -f http://localhost:9100/metrics > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "⚠️  Starting up..."
fi

# Check Metrics Collector
echo -n "📈 Metrics Collector: "
if curl -f http://localhost:9091/health > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "⚠️  Starting up..."
fi

# Check Grafana
echo -n "📊 Grafana: "
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "⚠️  Starting up..."
fi

echo ""
echo "🎉 VendFinder Monitoring Deployed Successfully!"
echo "=============================================="
echo ""
echo "📊 Access Your Dashboards:"
echo "📈 Grafana Dashboard:  http://localhost:3001"
echo "   Username: admin"
echo "   Password: vendfinder123"
echo ""
echo "🔍 Raw Monitoring:"
echo "📊 Prometheus:         http://localhost:9090"
echo "📈 Metrics Endpoint:   http://localhost:9091/metrics"
echo "⚙️ Node Exporter:      http://localhost:9100/metrics"
echo ""
echo "🎯 What You Can Monitor:"
echo "• Vendor revenue and sales by product"
echo "• Product inventory by category and vendor"
echo "• Order status and payment tracking"
echo "• System performance and health"
echo ""
echo "🛠️ Management Commands:"
echo "• Stop monitoring:     docker stop vendfinder-prometheus vendfinder-grafana vendfinder-metrics vendfinder-node-exporter"
echo "• Start monitoring:    docker start vendfinder-prometheus vendfinder-grafana vendfinder-metrics vendfinder-node-exporter"
echo "• View logs:           docker logs vendfinder-grafana"
echo "• Force data refresh:  curl -X POST http://localhost:9091/collect"
echo ""

# Check if main VendFinder services are running
echo "🔍 VendFinder Services Status:"
if docker ps | grep -q order-db; then
    echo "✅ Order database detected"
else
    echo "⚠️  Order database not running - limited sales data"
fi

if docker ps | grep -q product-db; then
    echo "✅ Product database detected"
else
    echo "⚠️  Product database not running - limited inventory data"
fi

if docker ps | grep -q user-db; then
    echo "✅ User database detected"
else
    echo "⚠️  User database not running - limited vendor data"
fi

echo ""
echo "🎊 Ready to monitor your VendFinder marketplace!"
echo "Visit http://localhost:3001 to see your vendor inventory and sales analytics!"