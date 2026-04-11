#!/usr/bin/env bash
# Apply gateway patches using kubectl patch (strategic merge).
# Use this instead of kubectl apply -f k8s/gateway/ since some
# resources were created by other tools and need patching, not apply.
#
# Usage: ./scripts/apply-gateway-patches.sh

set -euo pipefail

echo "=== Patching Envoy Gateway deployment ==="
kubectl patch deployment envoy-gateway \
  -n envoy-gateway-system \
  --type strategic \
  -p "$(cat k8s/gateway/envoy-gateway-patch.yaml | python3 -c "
import sys, json, yaml
doc = yaml.safe_load(sys.stdin)
print(json.dumps(doc['spec']))
" 2>/dev/null || cat <<'PATCH'
{"template":{"spec":{"affinity":{"nodeAffinity":{"requiredDuringSchedulingIgnoredDuringExecution":{"nodeSelectorTerms":[{"matchExpressions":[{"key":"role","operator":"In","values":["gateway"]}]}]}}},"containers":[{"name":"envoy-gateway","resources":{"limits":{"memory":"512Mi"}}}]}}}
PATCH
)"
echo "  Done"

echo ""
echo "=== Patching ingress-nginx-controller deployment ==="
kubectl patch deployment ingress-nginx-controller \
  -n ingress-nginx \
  --type strategic \
  -p '{"spec":{"template":{"spec":{"affinity":{"nodeAffinity":{"requiredDuringSchedulingIgnoredDuringExecution":{"nodeSelectorTerms":[{"matchExpressions":[{"key":"role","operator":"In","values":["gateway"]}]}]}}}}}}}'
echo "  Done"

echo ""
echo "=== Applying EnvoyProxy config ==="
kubectl apply -f k8s/gateway/envoy-proxy-patch.yaml
echo "  Done"

echo ""
echo "All gateway patches applied."
