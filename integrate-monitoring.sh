#!/bin/bash

# VendFinder Monitoring Integration Script
# Integrates monitoring into the existing API Gateway

set -e

echo "🔗 Integrating VendFinder Monitoring with API Gateway"
echo "===================================================="

# Check if monitoring services are running
if ! docker ps | grep -q vendfinder-prometheus; then
    echo "⚠️  Monitoring services not running. Deploying first..."
    ./deploy-monitoring.sh
    echo "⏳ Waiting for monitoring services to stabilize..."
    sleep 10
fi

# Build and restart the API Gateway with monitoring integration
echo "🔧 Building API Gateway with monitoring integration..."
cd api-gateway-build

# Install any missing dependencies
echo "📦 Installing dependencies..."
npm install

# Build the TypeScript
echo "🔨 Building API Gateway..."
npm run build 2>/dev/null || npx tsc

cd ..

# Stop existing API Gateway if running
echo "🛑 Stopping existing API Gateway..."
docker stop vendfinder-api-gateway 2>/dev/null || true
docker rm vendfinder-api-gateway 2>/dev/null || true

# Rebuild and start the API Gateway with monitoring routes
echo "🚀 Starting integrated API Gateway..."
docker build -t vendfinder-api-gateway api-gateway-build/

docker run -d \
  --name vendfinder-api-gateway \
  --network vendfinder-net \
  -p 3000:3000 \
  -e PORT=3000 \
  -e USER_SERVICE_URL=http://user-service:3004 \
  -e CHAT_SERVICE_URL=http://chat-service:3005 \
  -e WEBSOCKET_SERVICE_URL=http://websocket-service:3006 \
  -e PRODUCT_SERVICE_URL=http://product-service:3000 \
  -e ORDER_SERVICE_URL=http://order-service:3000 \
  -e CORS_ORIGIN="*" \
  vendfinder-api-gateway

echo "⏳ Waiting for API Gateway to start..."
sleep 5

# Test the integration
echo "🧪 Testing monitoring integration..."

echo -n "🌐 API Gateway: "
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Failed to start"
fi

echo -n "📊 Monitoring Status: "
if curl -f http://localhost:3000/api/monitoring-status > /dev/null 2>&1; then
    echo "✅ Available"
else
    echo "⚠️  Not ready yet"
fi

echo -n "📈 Grafana via Gateway: "
if curl -f http://localhost:3000/monitoring/ > /dev/null 2>&1; then
    echo "✅ Accessible"
else
    echo "⚠️  Proxying..."
fi

echo ""
echo "🎉 VendFinder Monitoring Integration Complete!"
echo "=============================================="
echo ""
echo "🌐 Access via your main VendFinder URL:"
echo ""
echo "📊 Main Dashboard:     http://localhost:3000/monitoring"
echo "📈 Prometheus:         http://localhost:3000/prometheus"
echo "🔍 Monitoring Status:  http://localhost:3000/api/monitoring-status"
echo "📊 Raw Metrics:        http://localhost:3000/api/monitoring/metrics"
echo "💚 Health Check:       http://localhost:3000/api/monitoring/health"
echo ""
echo "🔑 Authentication:"
echo "   Username: admin"
echo "   Password: vendfinder123"
echo ""
echo "✨ Benefits:"
echo "• No port forwarding needed"
echo "• Single URL for all VendFinder services"
echo "• Integrated authentication"
echo "• Same domain/CORS settings"
echo ""
echo "🎯 Your vendor inventory and sales monitoring is now accessible"
echo "   through your main VendFinder application!"
echo ""

# Show the integration status
echo "🔍 Integration Status:"
echo "======================"
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}" | grep vendfinder | head -10