#!/bin/bash
set -e

echo "🚀 VendFinder Frontend Deployment Script"
echo "========================================"

# Generate timestamp for unique tags
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="v$TIMESTAMP"

echo "📦 Step 1: Building frontend image..."
./build.sh $IMAGE_TAG

echo ""
echo "📤 Step 2: Pushing to registry..."
docker push registry.digitalocean.com/vendfinder-registry/frontend:$IMAGE_TAG

echo ""
echo "🔄 Step 3: Updating Kubernetes deployment..."
kubectl set image deployment/frontend -n vendfinder frontend=registry.digitalocean.com/vendfinder-registry/frontend:$IMAGE_TAG

echo ""
echo "⏳ Step 4: Waiting for rollout to complete..."
kubectl rollout status deployment/frontend -n vendfinder --timeout=120s

echo ""
echo "✅ Deployment Complete!"
echo "🏷️  Image Tag: $IMAGE_TAG"
echo "🔍 Check status: kubectl get pods -n vendfinder -l app=frontend"
echo ""

# Verify Stripe key in new pod
echo "🔍 Verifying Stripe configuration in new pod..."
NEW_POD=$(kubectl get pods -n vendfinder -l app=frontend --sort-by=.metadata.creationTimestamp | tail -1 | awk '{print $1}')
if kubectl exec $NEW_POD -n vendfinder -- printenv | grep -q NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; then
    echo "✅ Stripe key verified in pod: $NEW_POD"
else
    echo "❌ WARNING: Stripe key not found in pod"
    exit 1
fi

echo ""
echo "🎉 VendFinder frontend successfully deployed and verified!"