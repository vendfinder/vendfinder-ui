#!/bin/bash
# Create Kubernetes secrets for the support bot service
# Usage: ./scripts/create-bot-secrets.sh <namespace> <anthropic-api-key> <slack-webhook-url>
#
# Example:
#   ./scripts/create-bot-secrets.sh vendfinder sk-ant-api03-xxx https://hooks.slack.com/services/xxx
#   ./scripts/create-bot-secrets.sh vendfinder-staging sk-ant-api03-xxx https://hooks.slack.com/services/xxx

set -euo pipefail

NAMESPACE="${1:?Usage: $0 <namespace> <anthropic-api-key> <slack-webhook-url>}"
ANTHROPIC_API_KEY="${2:?Provide Anthropic API key as second argument}"
SLACK_WEBHOOK_URL="${3:?Provide Slack webhook URL as third argument}"

# Generate a random internal service key if not provided
INTERNAL_SERVICE_KEY="${INTERNAL_SERVICE_KEY:-$(openssl rand -hex 32)}"

echo "Creating support-bot-secrets in namespace: $NAMESPACE"

kubectl create secret generic support-bot-secrets \
  --namespace="$NAMESPACE" \
  --from-literal=anthropic-api-key="$ANTHROPIC_API_KEY" \
  --from-literal=slack-webhook-url="$SLACK_WEBHOOK_URL" \
  --from-literal=internal-service-key="$INTERNAL_SERVICE_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secret created successfully."
echo ""
echo "IMPORTANT: The same internal-service-key must be set on the chat-service."
echo "Internal service key: $INTERNAL_SERVICE_KEY"
echo ""
echo "Update chat-service deployment with:"
echo "  kubectl set env deployment/chat-service -n $NAMESPACE INTERNAL_SERVICE_KEY=$INTERNAL_SERVICE_KEY"
