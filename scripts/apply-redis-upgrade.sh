#!/usr/bin/env bash
# Migrate Redis from unauthenticated Deployment to authenticated StatefulSet
# with persistent storage, config file, and password protection.
#
# This script:
#   1. Creates Redis secrets (if not already present)
#   2. Applies Redis ConfigMaps
#   3. Deletes the old Redis Deployments (required — can't convert Deployment → StatefulSet)
#   4. Creates the new Redis StatefulSets
#   5. Waits for Redis to be ready
#   6. Restarts dependent services to pick up the new REDIS_URL with password
#
# WARNING: Redis will be briefly unavailable during the migration.
#          Run during a maintenance window.
#
# Usage: ./scripts/apply-redis-upgrade.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"

echo "========================================="
echo "  Redis Upgrade: Auth + Persistence"
echo "========================================="
echo ""
echo "This will:"
echo "  1. Create Redis secrets with random passwords"
echo "  2. Apply Redis config (maxmemory, AOF, eviction policy)"
echo "  3. Delete old Redis Deployments"
echo "  4. Create new Redis StatefulSets with persistent storage"
echo "  5. Restart services that depend on Redis"
echo ""
echo "WARNING: Redis will be briefly unavailable."
echo ""
read -rp "Continue? (y/N): " confirm
if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# --- Step 1: Create secrets ---
echo ""
echo "=== Step 1: Creating Redis secrets ==="
bash "${SCRIPT_DIR}/create-redis-secrets.sh"

# --- Step 2: Apply ConfigMaps ---
echo ""
echo "=== Step 2: Applying Redis ConfigMaps ==="
kubectl apply -f "${PROJECT_ROOT}/k8s/prod/redis-config.yaml"
kubectl apply -f "${PROJECT_ROOT}/k8s/staging/redis-config.yaml"
echo "  [OK] ConfigMaps applied"

# --- Step 3: Delete old Redis Deployments ---
echo ""
echo "=== Step 3: Deleting old Redis Deployments ==="
for NS in vendfinder vendfinder-staging; do
  if kubectl get deployment redis -n "${NS}" &>/dev/null; then
    kubectl delete deployment redis -n "${NS}" --wait=true
    echo "  [OK] Deleted Deployment redis in ${NS}"
  else
    echo "  [SKIP] No Deployment redis in ${NS}"
  fi
done

# --- Step 4: Apply new Redis StatefulSets ---
echo ""
echo "=== Step 4: Creating Redis StatefulSets ==="
kubectl apply -f "${PROJECT_ROOT}/k8s/prod/redis.yaml"
kubectl apply -f "${PROJECT_ROOT}/k8s/staging/redis.yaml"
echo "  [OK] StatefulSets created"

# --- Step 5: Wait for Redis pods to be ready ---
echo ""
echo "=== Step 5: Waiting for Redis pods ==="
for NS in vendfinder vendfinder-staging; do
  echo "  Waiting for redis-0 in ${NS}..."
  kubectl wait --for=condition=ready pod/redis-0 -n "${NS}" --timeout=120s || {
    echo "  [WARN] redis-0 in ${NS} not ready after 120s"
    echo "  Check: kubectl describe pod redis-0 -n ${NS}"
  }
done

# --- Step 6: Restart dependent services ---
echo ""
echo "=== Step 6: Restarting dependent services ==="

# Production services
PROD_SERVICES="chat-service websocket-service support-bot product-service order-service"
for SVC in ${PROD_SERVICES}; do
  if kubectl get deployment "${SVC}" -n vendfinder &>/dev/null; then
    kubectl rollout restart deployment "${SVC}" -n vendfinder
    echo "  [OK] Restarted ${SVC} in vendfinder"
  fi
done

# Staging services
STAGING_SERVICES="chat-service websocket-service support-bot"
for SVC in ${STAGING_SERVICES}; do
  if kubectl get deployment "${SVC}" -n vendfinder-staging &>/dev/null; then
    kubectl rollout restart deployment "${SVC}" -n vendfinder-staging
    echo "  [OK] Restarted ${SVC} in vendfinder-staging"
  fi
done

# --- Step 7: Verify ---
echo ""
echo "=== Step 7: Verification ==="
echo ""
echo "Redis pods:"
kubectl get pods -l app=redis -A -o wide
echo ""
echo "Redis PVCs:"
kubectl get pvc -l app=redis -A 2>/dev/null || kubectl get pvc -A | grep redis || echo "  (PVCs will be named data-redis-0)"
echo ""

echo "========================================="
echo "  Redis upgrade complete!"
echo "========================================="
echo ""
echo "Verify Redis auth works:"
echo "  kubectl exec -it redis-0 -n vendfinder -- redis-cli -a \$(kubectl get secret redis-credentials -n vendfinder -o jsonpath='{.data.password}' | base64 -d) ping"
echo ""
echo "Verify persistence:"
echo "  kubectl exec -it redis-0 -n vendfinder -- redis-cli -a \$(kubectl get secret redis-credentials -n vendfinder -o jsonpath='{.data.password}' | base64 -d) SET test:persist 'hello'"
echo "  kubectl delete pod redis-0 -n vendfinder"
echo "  kubectl wait --for=condition=ready pod/redis-0 -n vendfinder --timeout=60s"
echo "  kubectl exec -it redis-0 -n vendfinder -- redis-cli -a \$(kubectl get secret redis-credentials -n vendfinder -o jsonpath='{.data.password}' | base64 -d) GET test:persist"
