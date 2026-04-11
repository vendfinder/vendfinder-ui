#!/usr/bin/env bash
# Migrate to a larger DOKS node pool (s-4vcpu-8gb) with autoscaling.
#
# DigitalOcean does not support in-place node size changes. This script:
#   1. Creates a NEW node pool with the larger size
#   2. Labels the new nodes with their roles
#   3. Cordons + drains old nodes so pods migrate
#   4. Deletes the old node pool
#
# WARNING: This causes pod rescheduling. Run during a maintenance window.
#
# Prerequisites:
#   - doctl CLI authenticated
#   - kubectl configured for the cluster
#
# Usage: ./scripts/resize-node-pool.sh

set -euo pipefail

# --- Configuration ---
CLUSTER_NAME="vendfinder-cluster"
OLD_POOL_NAME="worker-pool"
NEW_POOL_NAME="worker-pool-upgraded"
NEW_SIZE="s-4vcpu-8gb"
NODE_COUNT=4
MIN_NODES=3
MAX_NODES=6

# --- Resolve IDs ---
echo "Looking up cluster..."
CLUSTER_ID=$(doctl kubernetes cluster get "${CLUSTER_NAME}" --format ID --no-header)
echo "  Cluster: ${CLUSTER_NAME} (${CLUSTER_ID})"

OLD_POOL_ID=$(doctl kubernetes cluster node-pool list "${CLUSTER_ID}" --format ID,Name --no-header | grep "${OLD_POOL_NAME}" | awk '{print $1}')
echo "  Old pool: ${OLD_POOL_NAME} (${OLD_POOL_ID})"

echo ""
echo "=== Plan ==="
echo "  Create new pool: ${NEW_POOL_NAME}"
echo "  Size:            ${NEW_SIZE} (4 vCPU / 8 GB RAM)"
echo "  Nodes:           ${NODE_COUNT} initial, autoscale ${MIN_NODES}-${MAX_NODES}"
echo "  Then drain and remove old pool: ${OLD_POOL_NAME}"
echo ""
echo "WARNING: Pods will be rescheduled during this process."
echo ""
read -rp "Continue? (y/N): " confirm
if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# --- Step 1: Create new pool ---
echo ""
echo "=== Step 1: Creating new node pool ==="
doctl kubernetes cluster node-pool create "${CLUSTER_ID}" \
  --name "${NEW_POOL_NAME}" \
  --size "${NEW_SIZE}" \
  --count "${NODE_COUNT}" \
  --min-nodes "${MIN_NODES}" \
  --max-nodes "${MAX_NODES}" \
  --auto-scale

echo "Waiting for new nodes to become Ready..."
while true; do
  READY_COUNT=$(kubectl get nodes -l "doks.digitalocean.com/node-pool=${NEW_POOL_NAME}" --no-headers 2>/dev/null | grep -c " Ready" || true)
  echo "  ${READY_COUNT}/${NODE_COUNT} nodes Ready"
  if [[ "${READY_COUNT}" -ge "${NODE_COUNT}" ]]; then
    break
  fi
  sleep 15
done
echo "All new nodes are Ready."

# --- Step 2: Label new nodes ---
echo ""
echo "=== Step 2: Labeling new nodes ==="
NEW_NODES=$(kubectl get nodes -l "doks.digitalocean.com/node-pool=${NEW_POOL_NAME}" --no-headers -o custom-columns=NAME:.metadata.name)
NODE_ARRAY=($NEW_NODES)

if [[ ${#NODE_ARRAY[@]} -ge 4 ]]; then
  kubectl label node "${NODE_ARRAY[0]}" role=prod-data --overwrite
  echo "  ${NODE_ARRAY[0]} → role=prod-data"
  kubectl label node "${NODE_ARRAY[1]}" role=prod-app --overwrite
  echo "  ${NODE_ARRAY[1]} → role=prod-app"
  kubectl label node "${NODE_ARRAY[2]}" role=gateway --overwrite
  echo "  ${NODE_ARRAY[2]} → role=gateway"
  kubectl label node "${NODE_ARRAY[3]}" role=prod-heavy --overwrite
  echo "  ${NODE_ARRAY[3]} → role=prod-heavy"
else
  echo "WARNING: Expected 4 nodes but got ${#NODE_ARRAY[@]}. Label manually."
  echo "Nodes: ${NEW_NODES}"
fi

# --- Step 3: Cordon and drain old nodes ---
echo ""
echo "=== Step 3: Cordoning and draining old nodes ==="
OLD_NODES=$(kubectl get nodes -l "doks.digitalocean.com/node-pool=${OLD_POOL_NAME}" --no-headers -o custom-columns=NAME:.metadata.name 2>/dev/null || true)
for node in $OLD_NODES; do
  echo "  Cordoning ${node}..."
  kubectl cordon "${node}"
  echo "  Draining ${node}..."
  kubectl drain "${node}" --ignore-daemonsets --delete-emptydir-data --force --timeout=120s || true
done

echo ""
echo "Waiting 30s for pods to reschedule..."
sleep 30

# --- Step 4: Delete old pool ---
echo ""
echo "=== Step 4: Deleting old node pool ==="
read -rp "Delete old pool '${OLD_POOL_NAME}'? (y/N): " confirm_delete
if [[ "${confirm_delete}" == "y" || "${confirm_delete}" == "Y" ]]; then
  doctl kubernetes cluster node-pool delete "${CLUSTER_ID}" "${OLD_POOL_ID}" --force
  echo "Old pool deleted."
else
  echo "Skipped. Delete manually:"
  echo "  doctl kubernetes cluster node-pool delete ${CLUSTER_ID} ${OLD_POOL_ID}"
fi

echo ""
echo "=== Done ==="
echo "Verify with:"
echo "  kubectl get nodes -o wide"
echo "  kubectl get pods -A -o wide"
