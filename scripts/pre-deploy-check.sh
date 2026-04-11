#!/usr/bin/env bash
# Pre-deployment validation for VendFinder cluster optimization.
# Checks that all prerequisites are met before applying manifests.
#
# Usage: ./scripts/pre-deploy-check.sh

set -euo pipefail

ERRORS=0
WARNINGS=0

pass()  { echo "  [PASS] $1"; }
warn()  { echo "  [WARN] $1"; WARNINGS=$((WARNINGS + 1)); }
fail()  { echo "  [FAIL] $1"; ERRORS=$((ERRORS + 1)); }

echo "=== 1. Cluster connectivity ==="
if kubectl cluster-info &>/dev/null; then
  pass "kubectl connected to cluster"
else
  fail "Cannot connect to cluster"
  echo "Fix this before continuing."
  exit 1
fi

echo ""
echo "=== 2. Node labels ==="
for node_role in "worker-pool-5vfn6:prod-data" "worker-pool-5vfnl:prod-app" "worker-pool-kck5n:gateway" "worker-pool-kyylw:prod-heavy"; do
  node="${node_role%%:*}"
  role="${node_role##*:}"
  actual=$(kubectl get node "$node" -o jsonpath='{.metadata.labels.role}' 2>/dev/null || echo "")
  if [[ "$actual" == "$role" ]]; then
    pass "$node has role=$role"
  else
    fail "$node missing role=$role (current: '${actual:-<none>}'). Run: ./scripts/label-nodes.sh"
  fi
done

echo ""
echo "=== 3. Namespaces ==="
for ns in vendfinder vendfinder-staging; do
  if kubectl get namespace "$ns" &>/dev/null; then
    pass "Namespace $ns exists"
  else
    fail "Namespace $ns does not exist"
  fi
done

echo ""
echo "=== 4. Image pull secrets ==="
for ns in vendfinder vendfinder-staging; do
  if kubectl get secret vendfinder-registry -n "$ns" &>/dev/null; then
    pass "vendfinder-registry secret in $ns"
  else
    fail "vendfinder-registry secret missing in $ns"
  fi
done

echo ""
echo "=== 5. Database credential secrets ==="
for secret in chat-db-credentials order-db-credentials product-db-credentials vendor-db-credentials analytics-db-credentials; do
  if kubectl get secret "$secret" -n vendfinder &>/dev/null; then
    pass "vendfinder/$secret"
  else
    fail "vendfinder/$secret missing. Run: ./scripts/create-db-secrets.sh"
  fi
done
for secret in chat-db-credentials order-db-credentials product-db-credentials vendor-db-credentials review-db-credentials user-db-credentials; do
  if kubectl get secret "$secret" -n vendfinder-staging &>/dev/null; then
    pass "vendfinder-staging/$secret"
  else
    fail "vendfinder-staging/$secret missing. Run: ./scripts/create-db-secrets.sh"
  fi
done

echo ""
echo "=== 6. PersistentVolumeClaims ==="
for pvc in chat-db-data order-db-data product-db-data vendor-db-data analytics-db-data; do
  if kubectl get pvc "$pvc" -n vendfinder &>/dev/null; then
    pass "vendfinder/$pvc"
  else
    warn "vendfinder/$pvc not found. Apply: kubectl apply -f k8s/prod/pvcs.yaml"
  fi
done
for pvc in chat-db-data order-db-data product-db-data vendor-db-data review-db-data user-db-data; do
  if kubectl get pvc "$pvc" -n vendfinder-staging &>/dev/null; then
    pass "vendfinder-staging/$pvc"
  else
    warn "vendfinder-staging/$pvc not found. Apply: kubectl apply -f k8s/staging/pvcs.yaml"
  fi
done

echo ""
echo "=== 7. Dry-run validation ==="
dry_run_ok=true
for dir in k8s/gateway k8s/prod k8s/staging; do
  if kubectl apply --dry-run=server -f "$dir/" &>/dev/null 2>&1; then
    pass "Dry-run passed for $dir/"
  else
    fail "Dry-run failed for $dir/. Run: kubectl apply --dry-run=server -f $dir/ to see errors"
    dry_run_ok=false
  fi
done

echo ""
echo "=== 8. Helm releases check ==="
if command -v helm &>/dev/null; then
  helm_releases=$(helm list -A --short 2>/dev/null || echo "")
  if [[ -n "$helm_releases" ]]; then
    warn "Helm releases found — applying raw manifests may conflict:"
    echo "$helm_releases" | while read -r release; do
      echo "       - $release"
    done
  else
    pass "No Helm releases found"
  fi
else
  warn "helm CLI not installed — cannot check for Helm-managed resources"
fi

echo ""
echo "==============================="
echo "Results: $ERRORS error(s), $WARNINGS warning(s)"
if [[ $ERRORS -gt 0 ]]; then
  echo "FIX errors above before deploying."
  exit 1
else
  echo "Ready to deploy!"
  exit 0
fi
