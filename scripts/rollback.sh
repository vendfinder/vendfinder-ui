#!/bin/bash
set -euo pipefail

# VendFinder Automated Rollback System
# Supports quick rollback to previous versions in staging/production

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE="vendfinder"
BACKUP_DIR="/tmp/vendfinder-backups"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ROLLBACK: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

usage() {
    cat << EOF
VendFinder Rollback System

USAGE:
    $0 <environment> [options]

ARGUMENTS:
    environment     Target environment: staging, production

OPTIONS:
    -v, --version   Rollback to specific version (e.g., v1.2.3)
    -p, --previous  Rollback to previous deployment (default)
    -l, --list      List available versions for rollback
    -f, --force     Skip confirmation prompts
    -q, --quick     Quick rollback (skip health checks)
    --emergency     Emergency rollback (fastest, minimal checks)
    -h, --help      Show this help message

EXAMPLES:
    $0 staging                          # Rollback staging to previous version
    $0 production -v v1.2.1             # Rollback production to specific version
    $0 staging --list                   # List available rollback versions
    $0 production --emergency           # Emergency rollback (fastest)

ROLLBACK TYPES:
    previous    Rollback to previous deployment (default)
    version     Rollback to specific version
    emergency   Fastest rollback with minimal checks

ENVIRONMENT VARIABLES:
    KUBECONFIG      Path to kubectl configuration file
    SLACK_WEBHOOK   Slack webhook URL for notifications
EOF
}

check_prerequisites() {
    log "Checking prerequisites..."

    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v curl >/dev/null 2>&1 || error "curl is required but not installed"

    # Check kubectl connectivity
    if ! kubectl auth can-i get pods -n "$NAMESPACE" >/dev/null 2>&1; then
        error "Cannot connect to Kubernetes cluster or insufficient permissions. Check KUBECONFIG."
    fi

    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        error "Namespace '$NAMESPACE' does not exist"
    fi

    log "Prerequisites check passed"
}

get_deployment_list() {
    local env=$1
    local prefix=""

    if [ "$env" = "staging" ]; then
        prefix="staging-"
    fi

    # Aligned with production deployment workflow service names
    echo "${prefix}frontend" "${prefix}user-service" "${prefix}chat-service" "${prefix}product-service" "${prefix}order-service" "${prefix}websocket-service" "${prefix}support-bot" "${prefix}api-gateway"
}

get_current_versions() {
    local env=$1

    log "Getting current deployment versions for $env..."

    local deployments
    read -ra deployments <<< "$(get_deployment_list "$env")"

    printf "%-20s %-50s %-20s %s\n" "DEPLOYMENT" "IMAGE" "VERSION" "DEPLOYED AT"
    printf "%-20s %-50s %-20s %s\n" "----------" "-----" "-------" "-----------"

    for deployment in "${deployments[@]}"; do
        if kubectl get deployment "$deployment" -n "$NAMESPACE" >/dev/null 2>&1; then
            local current_image
            current_image=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "unknown")
            local deployed_version
            deployed_version=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.metadata.annotations.vendfinder\.com/deployed-version}' 2>/dev/null || echo "unknown")
            local deployed_at
            deployed_at=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.metadata.annotations.vendfinder\.com/deployed-at}' 2>/dev/null || echo "unknown")

            printf "%-20s %-50s %-20s %s\n" "$deployment" "$current_image" "$deployed_version" "$deployed_at"
        else
            warn "Deployment $deployment not found"
        fi
    done
}

list_rollback_versions() {
    local env=$1

    log "Available rollback versions for $env:"
    echo

    get_current_versions "$env"

    echo
    log "Rollback history (from annotations):"

    local deployments
    read -ra deployments <<< "$(get_deployment_list "$env")"

    for deployment in "${deployments[@]}"; do
        if kubectl get deployment "$deployment" -n "$NAMESPACE" >/dev/null 2>&1; then
            echo
            info "Deployment: $deployment"

            # Show rollback-related annotations
            local annotations
            annotations=$(kubectl get deployment "$deployment" -n "$NAMESPACE" \
                -o jsonpath='{range .metadata.annotations}{@.key}={@.value}{"\n"}{end}' 2>/dev/null | \
                grep "vendfinder.com/" | head -10 || echo "")

            if [ -n "$annotations" ]; then
                echo "$annotations" | sed 's/^/  /'
            else
                echo "  No rollback history available"
            fi
        fi
    done
}

create_rollback_backup() {
    local env=$1
    local backup_subdir="rollback-$(date +%Y%m%d-%H%M%S)"
    local full_backup_dir="$BACKUP_DIR/$backup_subdir"

    log "Creating rollback backup..."

    mkdir -p "$full_backup_dir"

    # Backup current state
    kubectl get deployments -n "$NAMESPACE" -o yaml > "$full_backup_dir/deployments-before-rollback.yaml" 2>/dev/null || true
    kubectl get configmaps -n "$NAMESPACE" -o yaml > "$full_backup_dir/configmaps-before-rollback.yaml" 2>/dev/null || true

    # Save current versions
    get_current_versions "$env" > "$full_backup_dir/current-versions.txt" 2>/dev/null || true

    log "Rollback backup saved to: $full_backup_dir"
    echo "$full_backup_dir" > /tmp/rollback-backup-path
}

rollback_to_previous() {
    local env=$1

    log "Rolling back $env to previous deployment..."

    local deployments
    read -ra deployments <<< "$(get_deployment_list "$env")"

    local failed_deployments=()

    for deployment in "${deployments[@]}"; do
        if kubectl get deployment "$deployment" -n "$NAMESPACE" >/dev/null 2>&1; then
            info "Rolling back $deployment to previous revision..."

            if kubectl rollout undo deployment/"$deployment" -n "$NAMESPACE" 2>/dev/null; then
                log "✅ $deployment rollback initiated"
            else
                warn "❌ $deployment rollback failed"
                failed_deployments+=("$deployment")
            fi
        else
            warn "Deployment $deployment not found, skipping"
        fi
    done

    if [ ${#failed_deployments[@]} -gt 0 ]; then
        error "Some deployments failed to rollback: ${failed_deployments[*]}"
    fi

    log "Rollback commands executed for all deployments"
}

rollback_to_version() {
    local env=$1
    local target_version=$2
    local registry="registry.digitalocean.com/vendfinder-registry"

    log "Rolling back $env to version $target_version..."

    # Check if environments directory exists
    if [ ! -d "environments/$env" ]; then
        error "Environment directory not found: environments/$env"
    fi

    # Update kustomize configuration (aligned with production workflow)
    cd "environments/$env"

    if ! kustomize edit set image \
        "$registry/frontend:$target_version" \
        "$registry/user-service:$target_version" \
        "$registry/chat-service:$target_version" \
        "$registry/product-service:$target_version" \
        "$registry/order-service:$target_version" \
        "$registry/websocket-service:$target_version" \
        "$registry/support-bot:$target_version" \
        "$registry/api-gateway:$target_version"; then
        cd - >/dev/null
        error "Failed to update kustomize configuration for rollback"
    fi

    cd - >/dev/null

    # Apply the rollback
    if ! kubectl kustomize "environments/$env" > "/tmp/$env-rollback.yaml"; then
        error "Failed to generate rollback manifests"
    fi

    if ! kubectl apply -f "/tmp/$env-rollback.yaml"; then
        error "Failed to apply rollback manifests"
    fi

    log "Rollback to $target_version applied"
}

wait_for_rollback() {
    local env=$1
    local timeout=${2:-600}

    if [ "${QUICK_ROLLBACK:-}" = "true" ]; then
        log "Quick rollback mode - skipping rollout wait"
        return 0
    fi

    log "Waiting for rollback to complete (timeout: ${timeout}s)..."

    local deployments
    read -ra deployments <<< "$(get_deployment_list "$env")"

    local failed_rollouts=()

    for deployment in "${deployments[@]}"; do
        if kubectl get deployment "$deployment" -n "$NAMESPACE" >/dev/null 2>&1; then
            info "Waiting for $deployment rollout..."

            if kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout="${timeout}s" 2>/dev/null; then
                log "✅ $deployment rollback completed"
            else
                warn "❌ $deployment rollback timed out or failed"
                failed_rollouts+=("$deployment")
            fi
        fi
    done

    if [ ${#failed_rollouts[@]} -gt 0 ]; then
        error "Some deployments failed to complete rollback: ${failed_rollouts[*]}"
    fi

    log "All deployments rolled back successfully"
}

verify_rollback() {
    local env=$1

    if [ "${EMERGENCY_ROLLBACK:-}" = "true" ]; then
        log "Emergency rollback mode - skipping verification"
        return 0
    fi

    log "Verifying rollback..."

    # Determine URL
    local base_url
    case $env in
        staging)
            base_url="https://staging.vendfinder.com"
            ;;
        production)
            base_url="https://vendfinder.com"
            ;;
    esac

    # Wait for services to stabilize
    sleep 30

    # Basic health checks with retry logic
    local health_check_attempts=3
    local health_check_delay=10

    info "Testing main site..."
    local main_site_ok=false
    for ((attempt=1; attempt<=health_check_attempts; attempt++)); do
        if curl -f --max-time 30 "$base_url/" >/dev/null 2>&1; then
            log "✅ Main site is responding"
            main_site_ok=true
            break
        else
            if [ $attempt -lt $health_check_attempts ]; then
                warn "Main site check failed (attempt $attempt/$health_check_attempts), retrying in ${health_check_delay}s..."
                sleep $health_check_delay
            fi
        fi
    done

    if [ "$main_site_ok" != "true" ]; then
        warn "⚠️ Main site health check failed after $health_check_attempts attempts"
    fi

    info "Testing API health..."
    local api_ok=false
    for ((attempt=1; attempt<=health_check_attempts; attempt++)); do
        if curl -f --max-time 30 "$base_url/api/health" >/dev/null 2>&1; then
            log "✅ API is responding"
            api_ok=true
            break
        else
            if [ $attempt -lt $health_check_attempts ]; then
                warn "API health check failed (attempt $attempt/$health_check_attempts), retrying in ${health_check_delay}s..."
                sleep $health_check_delay
            fi
        fi
    done

    if [ "$api_ok" != "true" ]; then
        warn "⚠️ API health check failed after $health_check_attempts attempts"
    fi

    log "Rollback verification completed"
}

update_rollback_annotations() {
    local env=$1
    local rollback_type=$2
    local target_version=${3:-"previous"}

    log "Updating rollback annotations..."

    local deployments
    read -ra deployments <<< "$(get_deployment_list "$env")"

    for deployment in "${deployments[@]}"; do
        if kubectl get deployment "$deployment" -n "$NAMESPACE" >/dev/null 2>&1; then
            kubectl annotate deployment "$deployment" -n "$NAMESPACE" \
                "vendfinder.com/last-rollback-type=$rollback_type" \
                "vendfinder.com/last-rollback-to=$target_version" \
                "vendfinder.com/last-rollback-at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                "vendfinder.com/rollback-by=$(whoami)" \
                --overwrite >/dev/null 2>&1 || warn "Failed to annotate $deployment"
        fi
    done

    log "Rollback annotations updated"
}

send_rollback_notification() {
    local env=$1
    local status=$2
    local rollback_type=$3
    local target_version=${4:-"previous"}

    if [ -z "${SLACK_WEBHOOK:-}" ]; then
        info "No Slack webhook configured, skipping notification"
        return 0
    fi

    local emoji
    local color
    local message

    case $status in
        success)
            emoji="⚡"
            color="warning"
            message="VendFinder $env rollback completed successfully"
            ;;
        failure)
            emoji="🚨"
            color="danger"
            message="VendFinder $env rollback FAILED"
            ;;
    esac

    local payload
    payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "text": "$emoji $message",
            "fields": [
                {
                    "title": "Environment",
                    "value": "$env",
                    "short": true
                },
                {
                    "title": "Rollback Type",
                    "value": "$rollback_type",
                    "short": true
                },
                {
                    "title": "Target Version",
                    "value": "$target_version",
                    "short": true
                },
                {
                    "title": "Executed by",
                    "value": "$(whoami)",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date -u)",
                    "short": true
                }
            ]
        }
    ]
}
EOF
)

    if curl -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK" >/dev/null 2>&1; then
        info "Rollback notification sent to Slack"
    else
        warn "Failed to send Slack notification"
    fi
}

validate_environment() {
    local env=$1

    if [[ "$env" != "staging" && "$env" != "production" ]]; then
        error "Invalid environment: $env. Valid options: staging, production"
    fi
}

validate_version() {
    local version=$1

    # Enhanced semver validation to match production workflow
    if [[ ! $version =~ ^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$ ]]; then
        error "Invalid version format: $version. Expected semver format: v1.2.3, v1.2.3-alpha.1, v1.2.3+build.1"
    fi
}

main() {
    local environment=""
    local rollback_type="previous"
    local target_version=""
    local list_mode=false
    local force=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            staging|production)
                environment=$1
                shift
                ;;
            -v|--version)
                rollback_type="version"
                target_version=$2
                shift 2
                ;;
            -p|--previous)
                rollback_type="previous"
                shift
                ;;
            -l|--list)
                list_mode=true
                shift
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -q|--quick)
                QUICK_ROLLBACK=true
                shift
                ;;
            --emergency)
                EMERGENCY_ROLLBACK=true
                QUICK_ROLLBACK=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1. Use -h for help."
                ;;
        esac
    done

    if [ -z "$environment" ]; then
        error "Environment is required. Use -h for help."
    fi

    validate_environment "$environment"

    if [ "$list_mode" = true ]; then
        check_prerequisites
        list_rollback_versions "$environment"
        exit 0
    fi

    # Validate version format if provided
    if [ "$rollback_type" = "version" ]; then
        if [ -z "$target_version" ]; then
            error "Target version is required for version rollback"
        fi
        validate_version "$target_version"
    fi

    # Confirmation for production rollbacks
    if [ "$environment" = "production" ] && [ "$force" = false ] && [ "${EMERGENCY_ROLLBACK:-}" != "true" ]; then
        echo
        warn "You are about to rollback PRODUCTION!"
        warn "Environment: $environment"
        warn "Rollback type: $rollback_type"
        warn "Target: ${target_version:-previous deployment}"
        echo
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            info "Rollback cancelled by user"
            exit 0
        fi
    fi

    log "Starting rollback for $environment"
    info "Rollback type: $rollback_type"
    info "Target: ${target_version:-previous deployment}"
    info "Timestamp: $(date)"

    check_prerequisites
    create_rollback_backup "$environment"

    case $rollback_type in
        previous)
            rollback_to_previous "$environment"
            ;;
        version)
            rollback_to_version "$environment" "$target_version"
            ;;
        *)
            error "Invalid rollback type: $rollback_type"
            ;;
    esac

    wait_for_rollback "$environment"
    verify_rollback "$environment"
    update_rollback_annotations "$environment" "$rollback_type" "$target_version"

    log "🎯 Rollback completed successfully!"
    info "Environment: $environment"
    info "Rollback type: $rollback_type"
    info "Target: ${target_version:-previous deployment}"

    send_rollback_notification "$environment" "success" "$rollback_type" "$target_version"
}

# Trap errors and send failure notification
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        send_rollback_notification "${environment:-unknown}" "failure" "${rollback_type:-unknown}" "${target_version:-unknown}"
    fi
    exit $exit_code
}

trap cleanup ERR EXIT

main "$@"