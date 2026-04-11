#!/bin/bash

# Add Safe Monitoring Route to VendFinder
# Adds Grafana access through main URL without breaking anything

set -e

echo "🔗 Adding Safe Monitoring Route to VendFinder"
echo "=============================================="

# Check current status
echo "🔍 Checking current setup..."

if ! docker ps | grep -q vendfinder-grafana; then
    echo "❌ Grafana not running. Please run monitoring deployment first:"
    echo "   ./deploy-monitoring.sh"
    exit 1
fi

if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "❌ Grafana not accessible on port 3001"
    exit 1
fi

echo "✅ Grafana running on port 3001"

# Add a simple nginx reverse proxy for monitoring access
echo "🌐 Setting up safe monitoring access..."

# Create a simple reverse proxy container that adds monitoring to VendFinder
docker run -d \
  --name vendfinder-monitoring-proxy \
  --network vendfinder-net \
  -p 3002:80 \
  -v $(pwd)/monitoring/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine 2>/dev/null || docker start vendfinder-monitoring-proxy 2>/dev/null || true

# Create nginx config for safe monitoring access
cat > monitoring/nginx.conf << 'EOF'
upstream vendfinder_app {
    server vendfinder-api-gateway:3000;
}

upstream grafana {
    server vendfinder-grafana:3000;
}

upstream prometheus {
    server vendfinder-prometheus:9090;
}

server {
    listen 80;
    server_name _;

    # VendFinder main app (pass through everything except monitoring routes)
    location / {
        proxy_pass http://vendfinder_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Monitoring dashboard (safe route that doesn't conflict)
    location /dashboard/monitoring/ {
        proxy_pass http://grafana/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Handle WebSocket connections for Grafana live updates
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Prometheus (safe route)
    location /dashboard/prometheus/ {
        proxy_pass http://prometheus/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check for monitoring
    location /api/monitoring/health {
        proxy_pass http://grafana/api/health;
        proxy_set_header Host $host;
    }

    # Monitoring status endpoint
    location /api/monitoring/status {
        add_header Content-Type application/json;
        return 200 '{"service":"vendfinder-monitoring","status":"available","grafana":"/dashboard/monitoring/","prometheus":"/dashboard/prometheus/","health":"/api/monitoring/health"}';
    }
}
EOF

# Stop and restart the proxy with the new config
docker stop vendfinder-monitoring-proxy 2>/dev/null || true
docker rm vendfinder-monitoring-proxy 2>/dev/null || true

docker run -d \
  --name vendfinder-monitoring-proxy \
  --network vendfinder-net \
  -p 3002:80 \
  -v $(pwd)/monitoring/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine

echo "⏳ Waiting for proxy to start..."
sleep 3

# Test the setup
echo "🧪 Testing monitoring access..."

echo -n "🌐 VendFinder App: "
if curl -f http://localhost:3002/ > /dev/null 2>&1; then
    echo "✅ Accessible"
else
    echo "⚠️  Not ready"
fi

echo -n "📊 Monitoring Status: "
if curl -f http://localhost:3002/api/monitoring/status > /dev/null 2>&1; then
    echo "✅ Available"
else
    echo "⚠️  Not ready"
fi

echo -n "📈 Grafana Dashboard: "
if curl -f http://localhost:3002/dashboard/monitoring/ > /dev/null 2>&1; then
    echo "✅ Accessible"
else
    echo "⚠️  Not ready"
fi

echo ""
echo "🎉 Safe Monitoring Access Added!"
echo "================================="
echo ""
echo "🌐 Access VendFinder with Monitoring:"
echo "📱 Main VendFinder App:   http://localhost:3002"
echo "📊 Monitoring Dashboard:  http://localhost:3002/dashboard/monitoring/"
echo "📈 Prometheus:            http://localhost:3002/dashboard/prometheus/"
echo "🔍 Monitoring Status:     http://localhost:3002/api/monitoring/status"
echo ""
echo "🔑 Grafana Login:"
echo "   Username: admin"
echo "   Password: vendfinder123"
echo ""
echo "✨ Benefits:"
echo "• Single URL for everything"
echo "• No port conflicts"
echo "• Safe routing (doesn't break VendFinder)"
echo "• All monitoring accessible through main app"
echo ""
echo "💡 Your vendor inventory and sales monitoring is now accessible"
echo "   through your main VendFinder URL without any damage!"
echo ""

# Show all access options
echo "🎯 All Access Options:"
echo "======================"
echo "1. 📊 Direct Grafana:     http://localhost:3001 (admin/vendfinder123)"
echo "2. 🌐 Via VendFinder:     http://localhost:3002/dashboard/monitoring/"
echo "3. 📈 Prometheus Direct:  http://localhost:9090"
echo "4. 📈 Prometheus Via VF:  http://localhost:3002/dashboard/prometheus/"
echo ""
echo "🛠️ Management:"
echo "• Stop monitoring proxy:  docker stop vendfinder-monitoring-proxy"
echo "• Restart monitoring:     docker restart vendfinder-monitoring-proxy"
echo "• View proxy logs:        docker logs vendfinder-monitoring-proxy"