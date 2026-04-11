#!/bin/bash

# VendFinder Domain & Certificate Setup Helper
# Interactive script to configure your domain and certificate method

set -e

echo "🌐 VendFinder Monitoring Domain & Certificate Setup"
echo "==================================================="
echo ""

# Detect current configuration
CURRENT_DOMAIN=$(grep -o "vendfinder\\.com" ingress-https.yaml 2>/dev/null | head -1 || echo "vendfinder.com")
CURRENT_EMAIL=$(grep -o "admin@[^\"]*" tls-cert-manager.yaml 2>/dev/null | head -1 || echo "admin@vendfinder.com")

echo "Current configuration:"
echo "Domain: $CURRENT_DOMAIN"
echo "Email: $CURRENT_EMAIL"
echo ""

# Get domain from user
read -p "Enter your VendFinder domain (e.g., myvendfinder.com): " DOMAIN
if [[ -z "$DOMAIN" ]]; then
    echo "❌ Domain is required"
    exit 1
fi

# Get email from user
read -p "Enter admin email for certificates: " EMAIL
if [[ -z "$EMAIL" ]]; then
    echo "❌ Email is required for certificate management"
    exit 1
fi

echo ""
echo "Certificate Management Options:"
echo "1. cert-manager (Automated Let's Encrypt) - Recommended"
echo "2. manual (Upload your own certificates)"
echo "3. existing (Use existing Kubernetes TLS secret)"
echo ""

read -p "Choose certificate method (1-3): " CERT_CHOICE

case $CERT_CHOICE in
    1)
        CERT_METHOD="cert-manager"
        echo "✅ Will use cert-manager for automated certificates"
        ;;
    2)
        CERT_METHOD="manual"
        echo "✅ Will use manual certificate upload"
        echo "💡 Make sure to have your certificate files ready:"
        echo "   - $DOMAIN.crt (certificate file)"
        echo "   - $DOMAIN.key (private key file)"
        ;;
    3)
        CERT_METHOD="existing"
        echo "✅ Will use existing TLS secret"
        echo "💡 Make sure your TLS secret exists in the vendfinder namespace"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📋 Configuration Summary:"
echo "========================="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Certificate Method: $CERT_METHOD"
echo ""

read -p "Continue with this configuration? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

echo ""
echo "🔧 Updating configuration files..."

# Update ingress configuration
sed -i.bak "s/vendfinder\.com/$DOMAIN/g" ingress-https.yaml
sed -i.bak "s/www\.vendfinder\.com/www.$DOMAIN/g" ingress-https.yaml
sed -i.bak "s/monitoring\.vendfinder\.com/monitoring.$DOMAIN/g" ingress-https.yaml

# Update cert-manager configuration
sed -i.bak "s/admin@vendfinder\.com/$EMAIL/g" tls-cert-manager.yaml
sed -i.bak "s/vendfinder\.com/$DOMAIN/g" tls-cert-manager.yaml
sed -i.bak "s/www\.vendfinder\.com/www.$DOMAIN/g" tls-cert-manager.yaml
sed -i.bak "s/\*\.vendfinder\.com/*.$DOMAIN/g" tls-cert-manager.yaml

# Update Grafana configuration
sed -i.bak "s/vendfinder\.com/$DOMAIN/g" grafana-https.yaml

echo "✅ Configuration files updated"

# Create deployment script with the right settings
cat > deploy-with-domain.sh << EOF
#!/bin/bash
export VENDFINDER_DOMAIN="$DOMAIN"
export ADMIN_EMAIL="$EMAIL"
export CERT_METHOD="$CERT_METHOD"
./deploy-https.sh
EOF

chmod +x deploy-with-domain.sh

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"

if [[ "$CERT_METHOD" == "cert-manager" ]]; then
    echo "1. Install cert-manager if not already installed:"
    echo "   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml"
    echo ""
    echo "2. Deploy monitoring with HTTPS:"
    echo "   ./deploy-with-domain.sh"
elif [[ "$CERT_METHOD" == "manual" ]]; then
    echo "1. Place your certificate files in this directory:"
    echo "   - $DOMAIN.crt"
    echo "   - $DOMAIN.key"
    echo ""
    echo "   OR rename your existing files to:"
    echo "   mv your-cert.crt vendfinder.crt"
    echo "   mv your-key.key vendfinder.key"
    echo ""
    echo "2. Deploy monitoring with HTTPS:"
    echo "   ./deploy-with-domain.sh"
elif [[ "$CERT_METHOD" == "existing" ]]; then
    echo "1. Ensure your TLS secret exists:"
    echo "   kubectl get secret vendfinder-tls-secret -n vendfinder"
    echo ""
    echo "2. Deploy monitoring with HTTPS:"
    echo "   ./deploy-with-domain.sh"
fi

echo ""
echo "After deployment, access your monitoring at:"
echo "https://$DOMAIN/admin/monitoring/"
echo ""
echo "🔧 Configuration files updated:"
echo "• ingress-https.yaml"
echo "• tls-cert-manager.yaml"
echo "• grafana-https.yaml"
echo "• deploy-with-domain.sh (created)"

# Cleanup
rm -f *.bak