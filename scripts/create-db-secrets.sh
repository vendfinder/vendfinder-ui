#!/usr/bin/env bash
# Create database credential secrets for prod and staging.
# Generates random passwords if not already set.
#
# Usage: ./scripts/create-db-secrets.sh
#
# NOTE: This script will NOT overwrite existing secrets.
# To regenerate, delete the secret first: kubectl delete secret <name> -n <ns>

set -euo pipefail

generate_password() {
  openssl rand -base64 24 | tr -d '/+=' | head -c 32
}

create_secret_if_missing() {
  local ns="$1"
  local name="$2"
  local password="$3"

  if kubectl get secret "$name" -n "$ns" &>/dev/null; then
    echo "  SKIP: $ns/$name already exists"
  else
    kubectl create secret generic "$name" \
      --namespace="$ns" \
      --from-literal=password="$password"
    echo "  CREATED: $ns/$name"
  fi
}

echo "=== Production secrets (vendfinder) ==="
PROD_DBS=(chat-db order-db product-db vendor-db analytics-db)
for db in "${PROD_DBS[@]}"; do
  create_secret_if_missing "vendfinder" "${db}-credentials" "$(generate_password)"
done

echo ""
echo "=== Staging secrets (vendfinder-staging) ==="
STAGING_DBS=(chat-db order-db product-db vendor-db review-db user-db)
for db in "${STAGING_DBS[@]}"; do
  create_secret_if_missing "vendfinder-staging" "${db}-credentials" "$(generate_password)"
done

echo ""
echo "Done. List secrets with:"
echo "  kubectl get secrets -n vendfinder"
echo "  kubectl get secrets -n vendfinder-staging"
