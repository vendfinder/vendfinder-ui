#!/bin/bash

# Deploy VendFinder Monitoring with HTTPS/TLS Support
# Supports both cert-manager automated certificates and manual certificates

set -e

# Configuration - UPDATE THESE FOR YOUR DOMAIN
VENDFINDER_DOMAIN="${VENDFINDER_DOMAIN:-vendfinder.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@vendfinder.com}"
CERT_METHOD="${CERT_METHOD:-cert-manager}"  # Options: cert-manager, manual, existing

echo "🔐 Deploying VendFinder Monitoring with HTTPS"
echo "=============================================="
echo "Domain: $VENDFINDER_DOMAIN"
echo "Certificate Method: $CERT_METHOD"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

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

echo "✅ Connected to Kubernetes cluster: $(kubectl config current-context)"

# Function to update domain in files
update_domain_configs() {
    echo "🔧 Updating domain configurations..."

    # Update ingress domain
    sed -i.bak "s/vendfinder\.com/$VENDFINDER_DOMAIN/g" ingress-https.yaml
    sed -i.bak "s/admin@vendfinder\.com/$ADMIN_EMAIL/g" tls-cert-manager.yaml

    # Update Grafana domain configuration
    sed -i.bak "s/vendfinder\.com/$VENDFINDER_DOMAIN/g" grafana-https.yaml

    echo "✅ Domain configurations updated"
}

# Function to deploy with cert-manager
deploy_with_cert_manager() {
    echo "🤖 Deploying with cert-manager automated certificates..."

    # Check if cert-manager is installed
    if ! kubectl get crd certificates.cert-manager.io > /dev/null 2>&1; then
        echo "❌ cert-manager is not installed in the cluster"
        echo "💡 Install cert-manager first:"
        echo "   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml"
        exit 1
    fi

    # Apply certificate configuration
    kubectl apply -f tls-cert-manager.yaml
    echo "✅ Certificate issuer and certificate resources created"

    # Wait for certificate to be ready
    echo "⏳ Waiting for TLS certificate to be issued (this may take a few minutes)..."
    kubectl wait --for=condition=Ready certificate/vendfinder-tls -n vendfinder --timeout=300s || {
        echo "⚠️  Certificate issuance taking longer than expected. Continuing with deployment..."
        echo "💡 Check certificate status with: kubectl describe certificate vendfinder-tls -n vendfinder"
    }
}

# Function to deploy with manual certificates
deploy_with_manual_cert() {
    echo "📋 Deploying with manual certificate setup..."

    # Check if certificate files exist
    if [[ ! -f "vendfinder.crt" || ! -f "vendfinder.key" ]]; then
        echo "⚠️  Certificate files not found in current directory"
        echo "💡 Please provide your certificate files:"
        echo "   - vendfinder.crt (certificate file)"
        echo "   - vendfinder.key (private key file)"
        echo ""
        echo "Or create the secret manually:"
        echo "kubectl create secret tls vendfinder-tls-secret \\"
        echo "  --cert=path/to/vendfinder.crt \\"
        echo "  --key=path/to/vendfinder.key \\"
        echo "  --namespace=vendfinder"
        exit 1
    fi

    # Create TLS secret from certificate files
    kubectl create secret tls vendfinder-tls-secret \
        --cert=vendfinder.crt \
        --key=vendfinder.key \
        --namespace=vendfinder \
        --dry-run=client -o yaml | kubectl apply -f -

    echo "✅ TLS secret created from certificate files"
}

# Function to check existing certificate
check_existing_cert() {
    echo "🔍 Checking for existing TLS certificate..."

    if kubectl get secret vendfinder-tls-secret -n vendfinder > /dev/null 2>&1; then
        echo "✅ Found existing TLS certificate secret"
        return 0
    else
        echo "❌ No existing TLS certificate found"
        echo "💡 Please set CERT_METHOD to 'cert-manager' or 'manual' and provide certificates"
        exit 1
    fi
}

# Create or ensure namespace exists
echo "🏗️  Creating vendfinder namespace..."
kubectl apply -f namespace.yaml

# Wait a moment for namespace to be ready
sleep 2

# Update domain configurations
update_domain_configs

# Handle certificate setup based on method
case $CERT_METHOD in
    cert-manager)
        deploy_with_cert_manager
        ;;
    manual)
        deploy_with_manual_cert
        ;;
    existing)
        check_existing_cert
        ;;
    *)
        echo "❌ Invalid CERT_METHOD: $CERT_METHOD"
        echo "💡 Valid options: cert-manager, manual, existing"
        exit 1
        ;;
esac

# Deploy monitoring components
echo "📊 Deploying Prometheus..."
kubectl apply -f prometheus.yaml

echo "📈 Deploying Grafana with HTTPS configuration..."
kubectl apply -f grafana-https.yaml

echo "🔍 Deploying Inventory Metrics Collector..."
kubectl apply -f inventory-metrics.yaml

echo "🌐 Setting up HTTPS Ingress..."
kubectl apply -f ingress-https.yaml

echo "📊 Setting up Service Monitors..."
kubectl apply -f service-monitor.yaml

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

# Get ingress information
echo ""
echo "🎉 VendFinder Monitoring with HTTPS Deployed Successfully!"
echo "========================================================"
echo ""

# Show service status
echo "📋 Service Status:"
kubectl get pods -n vendfinder -l component=monitoring

echo ""
echo "🌐 HTTPS Access Information:"
echo "============================"

# Get ingress info
INGRESS_IP=$(kubectl get ingress vendfinder-monitoring-https -n vendfinder -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
if [[ -z "$INGRESS_IP" ]]; then
    INGRESS_IP=$(kubectl get ingress vendfinder-monitoring-https -n vendfinder -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending")
fi

if [[ "$INGRESS_IP" == "pending" || -z "$INGRESS_IP" ]]; then
    echo "⚠️  Ingress IP is pending. Checking ingress controller..."
    kubectl get svc -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx 2>/dev/null || echo "💡 Make sure NGINX ingress controller is installed"
else
    echo "🌍 Ingress IP/Hostname: $INGRESS_IP"
    echo ""
    echo "🎯 Add this to your DNS or /etc/hosts:"
    echo "$INGRESS_IP $VENDFINDER_DOMAIN"
    echo "$INGRESS_IP www.$VENDFINDER_DOMAIN"
    echo "$INGRESS_IP monitoring.$VENDFINDER_DOMAIN"
fi

echo ""
echo "📊 Access URLs:"
echo "https://$VENDFINDER_DOMAIN/admin/monitoring/     - Main Monitoring Dashboard"
echo "https://$VENDFINDER_DOMAIN/admin/prometheus/     - Prometheus Interface"
echo "https://$VENDFINDER_DOMAIN/admin/metrics/        - Raw Metrics API"
echo "https://monitoring.$VENDFINDER_DOMAIN/           - Dedicated Monitoring Domain"

echo ""
echo "🔑 Grafana Login Credentials:"
echo "   Username: admin"
echo "   Password: vendfinder123"

echo ""
echo "🔐 TLS Certificate Status:"
if [[ "$CERT_METHOD" == "cert-manager" ]]; then
    echo "Certificate Method: Automated (cert-manager)"
    echo "Check status: kubectl describe certificate vendfinder-tls -n vendfinder"
elif [[ "$CERT_METHOD" == "manual" ]]; then
    echo "Certificate Method: Manual"
    echo "Check secret: kubectl get secret vendfinder-tls-secret -n vendfinder"
else
    echo "Certificate Method: Existing"
fi

echo ""
echo "📊 What You Can Monitor:"
echo "• Vendor revenue and sales by product"
echo "• Product inventory by category and vendor"
echo "• Order status tracking (processing, shipped, delivered)"
echo "• Payment success rates and failure analysis"
echo "• System performance and health metrics"

echo ""
echo "🛠️  Management Commands:"
echo "========================"
echo "# View certificate status"
echo "kubectl describe certificate vendfinder-tls -n vendfinder"
echo ""
echo "# View ingress status"
echo "kubectl describe ingress vendfinder-monitoring-https -n vendfinder"
echo ""
echo "# View service logs"
echo "kubectl logs -f deployment/grafana -n vendfinder"
echo ""
echo "# Test HTTPS access"
echo "curl -I https://$VENDFINDER_DOMAIN/admin/monitoring/"
echo ""
echo "🎯 Your VendFinder monitoring is now accessible via HTTPS!"

# Cleanup backup files
rm -f *.bak 2>/dev/null || true

echo ""
echo "📍 Deployment Summary:"
echo "Namespace: vendfinder"
echo "Domain: $VENDFINDER_DOMAIN"
echo "Cluster: $(kubectl config current-context)"
echo "Certificate Method: $CERT_METHOD"