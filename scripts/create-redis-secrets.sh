#!/usr/bin/env bash
# Create Redis credential secrets for prod and staging.
# Generates random passwords and stores both the password and full URL.
#
# Usage: ./scripts/create-redis-secrets.sh

set -euo pipefail

echo "=== Creating Redis credential secrets ==="

for NS in vendfinder vendfinder-staging; do
  # Check if secret already exists
  if kubectl get secret redis-credentials -n "${NS}" &>/dev/null; then
    echo "  [SKIP] redis-credentials already exists in ${NS}"
    echo "         To recreate: kubectl delete secret redis-credentials -n ${NS}"
    continue
  fi

  PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
  URL="redis://:${PASSWORD}@redis:6379"

  kubectl create secret generic redis-credentials \
    --namespace "${NS}" \
    --from-literal=password="${PASSWORD}" \
    --from-literal=url="${URL}"

  echo "  [OK] redis-credentials created in ${NS}"
done

echo ""
echo "Done. Secrets created with random passwords."
echo "To view a password: kubectl get secret redis-credentials -n vendfinder -o jsonpath='{.data.password}' | base64 -d"
