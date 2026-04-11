#!/bin/bash

# VendFinder Staging Rollback Script
# Usage: ./scripts/rollback-staging.sh [revision_number]

set -euo pipefail

# Configuration
NAMESPACE="vendfinder"
SERVICES=("staging-frontend" "staging-user-service" "staging-chat-service" "staging-product-service" "staging-order-service" "staging-websocket-service" "staging-support-bot" "staging-api-gateway")
REVISION=${1:-""}
STAGING_URL=${STAGING_URL:-"https://staging.vendfinder.com"}
PROD_URL=${PROD_URL:-"https://vendfinder.com"}
API_HEALTH_ENDPOINT=${API_HEALTH_ENDPOINT:-"/api/health"}
HEALTH_CHECK_RETRIES=${HEALTH_CHECK_RETRIES:-3}
HEALTH_CHECK_DELAY=${HEALTH_CHECK_DELAY:-10}
ROLLBACK_TIMEOUT=${ROLLBACK_TIMEOUT:-"300s"}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-30}

# Enhanced error handling functions
handle_error() {
    local exit_code=$?
    local line_number=$1
    echo "❌ Error occurred on line $line_number with exit code $exit_code"

    # Get context about what was happening
    if [ -n "${CURRENT_SERVICE:-}" ]; then
        echo "🔍 Current service: $CURRENT_SERVICE"
    fi
    if [ -n "${CURRENT_OPERATION:-}" ]; then
        echo "🔍 Current operation: $CURRENT_OPERATION"
    fi

    # Show recent kubectl events if available
    echo "📋 Recent cluster events:"
    kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp | tail -5 2>/dev/null || echo "Could not retrieve cluster events"

    exit $exit_code
}

# Cleanup function for graceful shutdown
cleanup() {
    echo "🧹 Cleaning up..."
    # Remove any temporary files if created
    rm -f /tmp/rollback-*.log 2>/dev/null || true
}

trap 'handle_error $LINENO' ERR
trap cleanup EXIT

echo "🔄 VendFinder Staging Rollback Script"
echo "======================================"

# Enhanced connectivity check
CURRENT_OPERATION="kubectl cluster connectivity check"
echo "🔍 Checking kubectl configuration and cluster connectivity..."

if ! kubectl cluster-info >/dev/null 2>&1; then
    echo "❌ kubectl is not properly configured or cluster is unreachable"
    echo "🔧 Please ensure:"
    echo "   • kubectl is installed and in PATH"
    echo "   • KUBECONFIG is set or ~/.kube/config exists"
    echo "   • You have network connectivity to the cluster"
    exit 1
fi

# Verify namespace access
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo "❌ Cannot access namespace '$NAMESPACE'"
    echo "🔧 Please ensure you have the necessary permissions"
    exit 1
fi

# Check if we can list deployments
if ! kubectl get deployments -n "$NAMESPACE" >/dev/null 2>&1; then
    echo "❌ Cannot list deployments in namespace '$NAMESPACE'"
    echo "🔧 Please check your permissions"
    exit 1
fi

echo "✅ kubectl connectivity and permissions verified"

# If no revision specified, show available revisions
if [ -z "$REVISION" ]; then
    echo "📋 Available deployment revisions for staging-frontend:"
    kubectl rollout history deployment/staging-frontend -n $NAMESPACE
    echo
    echo "Usage: $0 [revision_number]"
    echo "Example: $0 2"
    echo
    echo "💡 To rollback to previous revision, just use: $0 previous"
    exit 0
fi

# Handle "previous" keyword with enhanced validation
if [ "$REVISION" = "previous" ]; then
    CURRENT_OPERATION="getting current deployment revision"
    if ! CURRENT_REVISION=$(kubectl get deployment staging-frontend -n $NAMESPACE -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}' 2>/dev/null); then
        echo "❌ Failed to get current deployment revision"
        exit 1
    fi

    if [ -z "$CURRENT_REVISION" ] || ! [[ "$CURRENT_REVISION" =~ ^[0-9]+$ ]]; then
        echo "❌ Invalid current revision: '$CURRENT_REVISION'"
        exit 1
    fi

    REVISION=$((CURRENT_REVISION - 1))
    echo "🔍 Current revision: $CURRENT_REVISION, rolling back to: $REVISION"
fi

# Enhanced revision validation
if ! [[ "$REVISION" =~ ^[0-9]+$ ]] || [ "$REVISION" -lt 1 ]; then
    echo "❌ Invalid revision number: $REVISION"
    echo "💡 Revision must be a positive integer"
    exit 1
fi

# Verify revision exists in deployment history
CURRENT_OPERATION="validating target revision"
if ! kubectl rollout history deployment/staging-frontend -n $NAMESPACE --revision="$REVISION" >/dev/null 2>&1; then
    echo "❌ Revision $REVISION not found in deployment history"
    echo "📋 Available revisions:"
    kubectl rollout history deployment/staging-frontend -n $NAMESPACE
    exit 1
fi

echo "🚀 Starting rollback to revision $REVISION..."
echo

# Store deployment states before rollback
echo "📸 Capturing current deployment state..."
for service in "${SERVICES[@]}"; do
    if kubectl get deployment $service -n $NAMESPACE > /dev/null 2>&1; then
        CURRENT_REV=$(kubectl get deployment $service -n $NAMESPACE -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')
        CURRENT_IMAGE=$(kubectl get deployment $service -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}')
        echo "📋 $service: revision $CURRENT_REV, image $CURRENT_IMAGE"
    fi
done
echo

# Perform rollback with enhanced error handling and parallel processing
echo "🔄 Performing rollback..."
ROLLBACK_FAILED=false
SUCCESSFUL_ROLLBACKS=0
TOTAL_SERVICES=0

# Create temporary log file for detailed tracking
ROLLBACK_LOG="/tmp/rollback-$(date +%Y%m%d-%H%M%S).log"
touch "$ROLLBACK_LOG"

for service in "${SERVICES[@]}"; do
    CURRENT_SERVICE="$service"
    CURRENT_OPERATION="rollback initiation"

    echo "🔄 Processing rollback for $service..."

    # Check if deployment exists
    if ! kubectl get deployment "$service" -n "$NAMESPACE" >/dev/null 2>&1; then
        echo "⚠️ $service deployment not found, skipping"
        echo "$(date): SKIP $service - deployment not found" >> "$ROLLBACK_LOG"
        continue
    fi

    TOTAL_SERVICES=$((TOTAL_SERVICES + 1))

    # Check if service has the target revision
    if ! kubectl rollout history deployment/"$service" -n "$NAMESPACE" --revision="$REVISION" >/dev/null 2>&1; then
        echo "⚠️ $service does not have revision $REVISION, skipping"
        echo "$(date): SKIP $service - revision $REVISION not found" >> "$ROLLBACK_LOG"
        continue
    fi

    # Attempt rollback with timeout
    echo "⏳ Rolling back $service to revision $REVISION..."
    if timeout 60s kubectl rollout undo deployment/"$service" -n "$NAMESPACE" --to-revision="$REVISION" 2>>"$ROLLBACK_LOG"; then
        echo "✅ $service rollback initiated successfully"
        echo "$(date): SUCCESS $service - rollback initiated" >> "$ROLLBACK_LOG"
        SUCCESSFUL_ROLLBACKS=$((SUCCESSFUL_ROLLBACKS + 1))
    else
        echo "❌ $service rollback failed or timed out"
        echo "$(date): FAILED $service - rollback failed" >> "$ROLLBACK_LOG"
        ROLLBACK_FAILED=true
    fi
done

echo
echo "📊 Rollback initiation summary:"
echo "   • Total services processed: $TOTAL_SERVICES"
echo "   • Successful rollbacks initiated: $SUCCESSFUL_ROLLBACKS"
echo "   • Failed rollbacks: $((TOTAL_SERVICES - SUCCESSFUL_ROLLBACKS))"

if [ $SUCCESSFUL_ROLLBACKS -eq 0 ]; then
    echo "❌ No rollbacks were successfully initiated"
    exit 1
elif [ "$ROLLBACK_FAILED" = "true" ]; then
    echo "⚠️ Some rollbacks failed, but continuing with successful ones"
    echo "📋 Check detailed log: $ROLLBACK_LOG"
fi

echo
echo "⏳ Waiting for rollback deployments to complete..."

# Wait for rollbacks to complete
for service in "${SERVICES[@]}"; do
    if kubectl get deployment $service -n $NAMESPACE > /dev/null 2>&1; then
        echo "Waiting for $service..."
        if ! kubectl rollout status deployment/$service -n $NAMESPACE --timeout=$ROLLBACK_TIMEOUT; then
            echo "⚠️ $service rollback timeout after $ROLLBACK_TIMEOUT"
            ROLLBACK_FAILED=true
        fi
    fi
done

# Check if any rollback timeouts occurred
if [ "$ROLLBACK_FAILED" = "true" ]; then
    echo
    echo "❌ Some rollbacks timed out. Proceeding with health checks anyway..."
fi

echo
echo "🏥 Performing health check after rollback..."

# Enhanced health check with progressive verification
CURRENT_OPERATION="post-rollback health verification"
echo "🏥 Performing comprehensive health check after rollback..."

# Initial stabilization wait
echo "⏳ Allowing services to stabilize (45 seconds)..."
sleep 45

HEALTH_FAILED=false

# Check main application with retries
echo "🌐 Checking main application endpoint..."
for attempt in {1..5}; do
    if timeout "$HEALTH_CHECK_TIMEOUT" curl -f --connect-timeout 10 "${STAGING_URL}/" >/dev/null 2>&1; then
        echo "✅ Main application is healthy (attempt $attempt)"
        break
    elif [ $attempt -eq 5 ]; then
        echo "❌ Main application health check failed after 5 attempts"
        HEALTH_FAILED=true
    else
        echo "⏳ Main application not ready, retrying in 15s (attempt $attempt/5)"
        sleep 15
    fi
done

# Check API health with retries
echo "🔌 Checking API health endpoint..."
for attempt in {1..5}; do
    if timeout "$HEALTH_CHECK_TIMEOUT" curl -f --connect-timeout 10 "${STAGING_URL}${API_HEALTH_ENDPOINT}" >/dev/null 2>&1; then
        echo "✅ API is healthy (attempt $attempt)"
        break
    elif [ $attempt -eq 5 ]; then
        echo "❌ API health check failed after 5 attempts"
        HEALTH_FAILED=true
    else
        echo "⏳ API not ready, retrying in 15s (attempt $attempt/5)"
        sleep 15
    fi
done

# Enhanced pod status check
echo "🏗️ Checking pod status..."
if ! UNHEALTHY_PODS=$(kubectl get pods -n "$NAMESPACE" -l environment=staging --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l); then
    echo "⚠️ Failed to check pod status"
    HEALTH_FAILED=true
else
    if [ "$UNHEALTHY_PODS" -gt 0 ]; then
        echo "❌ $UNHEALTHY_PODS pods are not in Running state"
        echo "📋 Unhealthy pods:"
        kubectl get pods -n "$NAMESPACE" -l environment=staging --field-selector=status.phase!=Running 2>/dev/null || echo "Could not retrieve pod details"
        HEALTH_FAILED=true
    else
        echo "✅ All pods are in Running state"
    fi
fi

# Check for pods with restart issues
echo "🔄 Checking for pods with high restart counts..."
if HIGH_RESTART_PODS=$(kubectl get pods -n "$NAMESPACE" -l environment=staging -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.status.containerStatuses[0].restartCount}{"\n"}{end}' 2>/dev/null | awk '$2 > 10 {print $1}'); then
    if [ -n "$HIGH_RESTART_PODS" ]; then
        echo "⚠️ Pods with high restart counts:"
        echo "$HIGH_RESTART_PODS"
        echo "💡 These pods may need investigation"
    fi
fi

echo
echo "📊 Final health check summary:"
if [ "$HEALTH_FAILED" = "true" ]; then
    echo "❌ Rollback completed but health checks are failing"
    echo "🔍 Manual investigation required"
    echo "🛠️  Troubleshooting steps:"
    echo "   1. Check pod logs: kubectl logs -n $NAMESPACE -l environment=staging --tail=50"
    echo "   2. Check deployment status: kubectl get deployments -n $NAMESPACE"
    echo "   3. Check service connectivity: kubectl get services -n $NAMESPACE"
    echo "   4. Review recent events: kubectl get events -n $NAMESPACE --sort-by=.lastTimestamp"

    # Generate detailed diagnostic report
    echo
    echo "🔍 Generating diagnostic information..."
    {
        echo "=== Rollback Diagnostic Report ==="
        echo "Generated: $(date)"
        echo "Target Revision: $REVISION"
        echo "Namespace: $NAMESPACE"
        echo
        echo "=== Pod Status ==="
        kubectl get pods -n "$NAMESPACE" -l environment=staging -o wide
        echo
        echo "=== Service Status ==="
        kubectl get services -n "$NAMESPACE" -l environment=staging
        echo
        echo "=== Recent Events ==="
        kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp | tail -10
    } > "/tmp/rollback-diagnostic-$(date +%Y%m%d-%H%M%S).txt" 2>/dev/null || true

    exit 1
else
    echo "🎉 Rollback completed successfully!"
    echo "✅ Staging environment is healthy"
    echo "🌐 Application accessible at: ${STAGING_URL}"
fi

# Annotate the rollback with comprehensive metadata
CURRENT_OPERATION="deployment annotation"
kubectl annotate deployment staging-frontend -n "$NAMESPACE" \
    vendfinder.com/deployment-status="rolled-back" \
    vendfinder.com/rollback-to-revision="$REVISION" \
    vendfinder.com/rollback-at="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    vendfinder.com/rollback-by="manual-script" \
    vendfinder.com/rollback-successful="$(if [ "$HEALTH_FAILED" = "true" ]; then echo "false"; else echo "true"; fi)" \
    vendfinder.com/services-rolled-back="$SUCCESSFUL_ROLLBACKS" \
    --overwrite || echo "⚠️ Failed to annotate deployment"

echo
echo "📝 Rollback summary:"
echo "   • Revision: $REVISION"
echo "   • Services successfully rolled back: $SUCCESSFUL_ROLLBACKS"
echo "   • Timestamp: $(date)"
echo "   • Staging URL: ${STAGING_URL}"
echo "   • Health Status: $(if [ "$HEALTH_FAILED" = "true" ]; then echo "❌ Failed"; else echo "✅ Healthy"; fi)"
echo "   • Log file: $ROLLBACK_LOG"