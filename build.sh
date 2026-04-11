#!/bin/bash
set -e

echo "🔧 Building VendFinder Frontend with Stripe Keys..."

# Get Stripe key from environment or .env file
if [ -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    if [ -f .env ]; then
        export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$(grep NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY .env | cut -d '=' -f2)
        echo "📄 Loaded Stripe key from .env file"
    else
        echo "❌ ERROR: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in environment or .env file"
        exit 1
    fi
fi

# Validate Stripe key exists and is not empty
if [ -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    echo "❌ ERROR: Stripe publishable key is empty"
    exit 1
fi

# Show key prefix for verification (security safe)
echo "🔑 Using Stripe key: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:0:15}..."

# Build with proper arguments
IMAGE_TAG=${1:-"latest"}
docker build \
    --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" \
    -t registry.digitalocean.com/vendfinder-registry/frontend:$IMAGE_TAG \
    .

echo "✅ Frontend built successfully with tag: $IMAGE_TAG"
echo "📦 Ready to push: docker push registry.digitalocean.com/vendfinder-registry/frontend:$IMAGE_TAG"