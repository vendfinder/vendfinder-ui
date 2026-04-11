#!/bin/bash

# VendFinder Vendor Dashboard Capture Script
# Usage: ./capture-vendor.sh [vendor-email] [password] [vendor-name]

set -e

echo "🖥️  VendFinder Vendor Dashboard Capture Tool"
echo "==========================================="

# Check if playwright is installed
if ! command -v npx &> /dev/null || ! npx playwright --version &> /dev/null; then
    echo "📦 Installing Playwright..."
    npm run install-playwright
fi

# Default values for testing
DEFAULT_EMAIL="sally@vendfinder.com"
DEFAULT_PASSWORD="sally-password"
DEFAULT_NAME="sally"

# Get parameters or use defaults
VENDOR_EMAIL="${1:-$DEFAULT_EMAIL}"
VENDOR_PASSWORD="${2:-$DEFAULT_PASSWORD}"
VENDOR_NAME="${3:-$DEFAULT_NAME}"

echo "📧 Vendor Email: $VENDOR_EMAIL"
echo "👤 Vendor Name: $VENDOR_NAME"
echo "🕐 Starting capture..."

# Run the capture script
node vendor-dashboard-capture.js "$VENDOR_EMAIL" "$VENDOR_PASSWORD" "$VENDOR_NAME"

echo ""
echo "✅ Capture completed!"
echo "📁 Screenshots saved to: ./vendor-screenshots/"
echo ""
echo "💡 To capture another vendor:"
echo "   ./capture-vendor.sh vendor@email.com password vendor-name"

# Open screenshots folder (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔍 Opening screenshots folder..."
    open ./vendor-screenshots/
fi