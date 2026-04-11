#!/bin/bash

# Deploy VendFinder Monitoring to Kubernetes
# Deploys Prometheus + Grafana + Inventory Metrics to vendfinder namespace

set -e

echo "🚀 Deploying VendFinder Monitoring to Kubernetes"
echo "================================================="

# Check kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if we can connect to the cluster
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "❌ Cannot connect to Kubernetes cluster"
    echo "💡 Please ensure your kubectl context is set correctly"
    exit 1
fi

echo "✅ Connected to Kubernetes cluster"

# Create or ensure namespace exists
echo "🏗️  Creating vendfinder namespace..."
kubectl apply -f namespace.yaml

# Wait a moment for namespace to be ready
sleep 2

# Apply monitoring components
echo "📊 Deploying Prometheus..."
kubectl apply -f prometheus.yaml

echo "📈 Deploying Grafana..."
kubectl apply -f grafana.yaml

echo "🔍 Deploying Inventory Metrics Collector..."
kubectl apply -f inventory-metrics.yaml

echo "🌐 Setting up Ingress..."
kubectl apply -f ingress.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."

echo -n "📊 Prometheus: "
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n vendfinder
echo "✅ Ready"

echo -n "📈 Grafana: "
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n vendfinder
echo "✅ Ready"

echo -n "🔍 Inventory Metrics: "
kubectl wait --for=condition=available --timeout=300s deployment/inventory-metrics -n vendfinder
echo "✅ Ready"

# Get service information
echo ""
echo "🎉 VendFinder Monitoring Deployed Successfully!"
echo "=============================================="
echo ""

# Show service status
echo "📋 Service Status:"
kubectl get pods -n vendfinder -l component=monitoring

echo ""
echo "🌐 Access Information:"
echo "======================"

# Get ingress info
INGRESS_IP=$(kubectl get ingress vendfinder-monitoring -n vendfinder -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
INGRESS_HOSTNAME=$(kubectl get ingress vendfinder-monitoring -n vendfinder -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "vendfinder.local")

if [ "$INGRESS_IP" = "pending" ] || [ -z "$INGRESS_IP" ]; then
    echo "⚠️  Ingress IP is pending. You may need to set up port forwarding:"
    echo ""
    echo "🔗 Port Forward Commands:"
    echo "kubectl port-forward svc/grafana 3001:3000 -n vendfinder"
    echo "kubectl port-forward svc/prometheus 9090:9090 -n vendfinder"
    echo "kubectl port-forward svc/inventory-metrics 9091:9091 -n vendfinder"
    echo ""
    echo "📊 Then access:"
    echo "• Grafana:     http://localhost:3001"
    echo "• Prometheus:  http://localhost:9090"
    echo "• Metrics:     http://localhost:9091/metrics"
else
    echo "🌍 External Access (via Ingress):"
    echo "• Monitoring:  http://$INGRESS_HOSTNAME/admin/monitoring/"
    echo "• Prometheus:  http://$INGRESS_HOSTNAME/admin/prometheus/"
    echo "• Metrics:     http://$INGRESS_HOSTNAME/admin/metrics/"
fi

echo ""
echo "🔑 Grafana Login Credentials:"
echo "   Username: admin"
echo "   Password: vendfinder123"
echo ""

echo "📊 What You Can Monitor:"
echo "• Vendor revenue and sales by product"
echo "• Product inventory by category and vendor"
echo "• Order status tracking"
echo "• Payment success rates"
echo "• System performance metrics"
echo ""

echo "🛠️  Management Commands:"
echo "========================"
echo "# View all monitoring pods"
echo "kubectl get pods -n vendfinder -l component=monitoring"
echo ""
echo "# View service logs"
echo "kubectl logs -f deployment/grafana -n vendfinder"
echo "kubectl logs -f deployment/prometheus -n vendfinder"
echo "kubectl logs -f deployment/inventory-metrics -n vendfinder"
echo ""
echo "# Scale up/down"
echo "kubectl scale deployment/grafana --replicas=2 -n vendfinder"
echo ""
echo "# Delete monitoring (if needed)"
echo "kubectl delete -f ."
echo ""
echo "🎯 Your VendFinder inventory and sales monitoring is now running in Kubernetes!"

# Show current context for clarity
echo ""
echo "📍 Current Context:"
echo "Namespace: vendfinder"
echo "Cluster: $(kubectl config current-context)"