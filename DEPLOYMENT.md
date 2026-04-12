# VendFinder Frontend Deployment Guide

## 🚨 CRITICAL: Stripe Key Configuration

The frontend **REQUIRES** the Stripe publishable key to be passed as a Docker build argument. **Never** deploy without following this process.

### ✅ Correct Deployment Process

**Option 1: Use the automated scripts (RECOMMENDED)**

```bash
# Build and deploy in one command
./deploy.sh
```

**Option 2: Manual deployment**

```bash
# Build with Stripe keys
./build.sh v20260408-custom

# Push to registry
docker push registry.digitalocean.com/vendfinder-registry/frontend:v20260408-custom

# Deploy to Kubernetes
kubectl set image deployment/frontend -n vendfinder frontend=registry.digitalocean.com/vendfinder-registry/frontend:v20260408-custom
```

### ❌ What NOT to do

**NEVER use basic docker build:**

```bash
# ❌ THIS WILL BREAK STRIPE PAYMENTS
docker build -t frontend .
```

## 🔧 How It Works

1. **Build Script (`build.sh`)**: Automatically reads Stripe key from `.env` and passes it as build argument
2. **Deploy Script (`deploy.sh`)**: Complete build + push + deploy + verification process
3. **Dockerfile**: Expects `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` as build argument

## 🛡️ Security Notes

- Live Stripe keys are only in `.env` file (never committed to git)
- Build scripts show only key prefix for verification
- Keys are compiled into frontend bundle at build time (Next.js requirement)

## 🔍 Verification Commands

```bash
# Check running frontend pod
kubectl get pods -n vendfinder -l app=frontend

# Verify Stripe key is configured
kubectl exec <pod-name> -n vendfinder -- printenv | grep STRIPE

# Check deployment status
kubectl rollout status deployment/frontend -n vendfinder
```

## 🚨 Emergency Rollback

```bash
# List recent images
kubectl rollout history deployment/frontend -n vendfinder

# Rollback to previous version
kubectl rollout undo deployment/frontend -n vendfinder
```

---

**⚠️ REMEMBER**: Always use the build scripts to ensure Stripe keys are properly configured!
