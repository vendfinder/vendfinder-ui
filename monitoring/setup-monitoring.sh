#!/bin/bash

# VendFinder Monitoring Setup Script
# Sets up Prometheus + Grafana monitoring for inventory and sales

set -e

echo "🚀 Setting up VendFinder Inventory & Sales Monitoring"
echo "====================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create monitoring network (connects to existing VendFinder network)
echo "🔗 Setting up monitoring network..."
if ! docker network ls | grep -q vendfinder-net; then
    echo "⚠️  VendFinder network not found. Creating it..."
    docker network create vendfinder-net
fi

# Start the monitoring stack
echo "📊 Starting monitoring services..."
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d

echo "⏳ Waiting for services to become ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check Prometheus
if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "✅ Prometheus is healthy"
else
    echo "⚠️  Prometheus may not be ready yet"
fi

# Check Grafana
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Grafana is healthy"
else
    echo "⚠️  Grafana may not be ready yet"
fi

# Check Metrics Collector
if curl -f http://localhost:9091/health > /dev/null 2>&1; then
    echo "✅ Inventory Metrics Collector is healthy"
else
    echo "⚠️  Metrics Collector may not be ready yet"
fi

echo ""
echo "🎉 Monitoring Setup Complete!"
echo "=============================="
echo ""
echo "📊 Prometheus:  http://localhost:9090"
echo "📈 Grafana:     http://localhost:3001"
echo "   Username:    admin"
echo "   Password:    vendfinder123"
echo ""
echo "🔍 Metrics Collector: http://localhost:9091"
echo "📊 Node Exporter:     http://localhost:9100"
echo "🐳 cAdvisor:          http://localhost:8080"
echo ""
echo "💡 The VendFinder Inventory & Sales dashboard should auto-load in Grafana!"
echo ""
echo "🛠️  To stop monitoring:"
echo "   cd monitoring && docker compose -f docker-compose.monitoring.yml down"
echo ""
echo "🔄 To restart monitoring:"
echo "   cd monitoring && docker compose -f docker-compose.monitoring.yml restart"
echo ""

# Check if main VendFinder services are running
echo "🔍 Checking VendFinder services..."
if docker ps | grep -q vendfinder; then
    echo "✅ VendFinder services detected"
else
    echo "⚠️  VendFinder main services don't appear to be running."
    echo "   Start them with: docker compose up -d"
    echo "   The monitoring will still work but with limited data."
fi

echo ""
echo "📚 Available metrics include:"
echo "   • Vendor inventory by category and status"
echo "   • Sales counts by vendor and product"
echo "   • Revenue totals by vendor"
echo "   • Order status breakdowns"
echo "   • Payment status tracking"
echo "   • Product inventory levels"
echo "   • HTTP request metrics"
echo "   • Database query performance"
echo ""
echo "🎯 Ready to monitor your VendFinder marketplace!"