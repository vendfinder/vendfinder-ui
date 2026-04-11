# VendFinder Frontend Backup & Recovery Guide

## 🛡️ CRITICAL BACKUP INFORMATION

**Current Working Image (VERIFIED STRIPE INTEGRATION):**
```
registry.digitalocean.com/vendfinder-registry/frontend:stable-backup-stripe-working-20260408
```

**✅ This image contains:**
- Live Stripe keys properly configured
- Working credit card payment form
- Verified production deployment (April 8, 2026)

## 🚨 EMERGENCY ROLLBACK

**If the frontend breaks or Stripe stops working, immediately run:**

```bash
# Emergency rollback to working version
kubectl set image deployment/frontend -n vendfinder frontend=registry.digitalocean.com/vendfinder-registry/frontend:stable-backup-stripe-working-20260408

# Wait for rollback to complete
kubectl rollout status deployment/frontend -n vendfinder --timeout=120s

# Verify rollback
kubectl get pods -n vendfinder -l app=frontend
```

## 📋 Backup Creation Process (for future reference)

**When creating new backups:**

```bash
# Get current working image
CURRENT_IMAGE=$(kubectl get deployment frontend -n vendfinder -o jsonpath='{.spec.template.spec.containers[0].image}')
echo "Current image: $CURRENT_IMAGE"

# Create backup with timestamp
DATE=$(date +%Y%m%d)
BACKUP_TAG="stable-backup-working-$DATE"

# Tag and push backup
docker tag $CURRENT_IMAGE registry.digitalocean.com/vendfinder-registry/frontend:$BACKUP_TAG
docker push registry.digitalocean.com/vendfinder-registry/frontend:$BACKUP_TAG

# Update this documentation with new backup tag
```

## 🔍 Verification Commands

**After any rollback or deployment:**

```bash
# Check pod status
kubectl get pods -n vendfinder -l app=frontend

# Verify Stripe key is present
POD_NAME=$(kubectl get pods -n vendfinder -l app=frontend -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -n vendfinder -- printenv | grep STRIPE

# Check frontend logs for errors
kubectl logs $POD_NAME -n vendfinder
```

## 📝 Deployment Best Practices

**ALWAYS use the deployment scripts:**
```bash
cd /Users/anthonyhudnall/vendfinder-ui
./deploy.sh
```

**NEVER deploy manually without Stripe keys:**
```bash
# ❌ THIS WILL BREAK PAYMENTS
docker build -t frontend .
kubectl set image deployment/frontend frontend=...
```

## 🗂️ Backup History

| Date | Image Tag | Status | Notes |
|------|-----------|---------|-------|
| 2026-04-08 | `stable-backup-stripe-working-20260408` | ✅ VERIFIED | Working Stripe integration, live keys |

---

**⚠️ CRITICAL**: Always test Stripe functionality after any deployment. If payments don't work, immediately rollback to the verified backup image above.