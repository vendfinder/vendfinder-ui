#!/usr/bin/env bash
# Label DOKS nodes by role for workload placement via nodeAffinity.
# Run this BEFORE applying updated manifests.
#
# Roles:
#   prod-data  — databases + monitoring (Prometheus, prod DBs)
#   prod-app   — stateless application services
#   gateway    — ingress, envoy, staging workloads
#   prod-heavy — Elasticsearch, analytics, search
#
# Usage: ./scripts/label-nodes.sh

set -euo pipefail

echo "Labeling nodes with roles..."

kubectl label node worker-pool-5vfn6 role=prod-data --overwrite
echo "  worker-pool-5vfn6 → role=prod-data"

kubectl label node worker-pool-5vfnl role=prod-app --overwrite
echo "  worker-pool-5vfnl → role=prod-app"

kubectl label node worker-pool-kck5n role=gateway --overwrite
echo "  worker-pool-kck5n → role=gateway"

kubectl label node worker-pool-kyylw role=prod-heavy --overwrite
echo "  worker-pool-kyylw → role=prod-heavy"

echo ""
echo "Done. Verify with: kubectl get nodes --show-labels"
