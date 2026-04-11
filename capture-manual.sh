#!/bin/bash

# VendFinder Manual Dashboard Capture Script
# Usage: ./capture-manual.sh [vendor-name]

set -e

echo "🖥️  VendFinder Manual Dashboard Capture Tool"
echo "============================================="

# Check if playwright is installed
if ! command -v npx &> /dev/null || ! npx playwright --version &> /dev/null; then
    echo "📦 Installing Playwright..."
    npm run install-playwright
fi

# Get vendor name parameter or use default
VENDOR_NAME="${1:-sally}"

echo "👤 Vendor Name: $VENDOR_NAME"
echo "🕐 Starting manual capture..."
echo ""
echo "📋 Instructions:"
echo "   1. Browser will open to VendFinder"
echo "   2. Manually log in to the vendor account"
echo "   3. Navigate to Dashboard > Selling"
echo "   4. Press Enter when ready to capture"
echo ""

# Run the manual capture script
node manual-dashboard-capture.js "$VENDOR_NAME"

echo ""
echo "✅ Manual capture completed!"
echo "📁 Screenshots saved to: ./vendor-screenshots/"
echo ""

# Open screenshots folder (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔍 Opening screenshots folder..."
    open ./vendor-screenshots/
fi