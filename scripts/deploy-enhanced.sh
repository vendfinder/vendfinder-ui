#!/bin/bash
set -euo pipefail

# Enhanced VendFinder Deployment Script
# Supports both staging and production deployments with proper versioning

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="registry.digitalocean.com/vendfinder-registry"
NAMESPACE="vendfinder"
ENVIRONMENTS=("staging" "production")

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
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
Usage: $0 <environment> [options]

ARGUMENTS:
    environment     Target environment: staging, production

OPTIONS:
    -v, --version   Specific version to deploy (e.g., v1.2.3)
    -s, --skip-tests    Skip smoke tests after deployment
    -f, --force     Force deployment without confirmation
    -b, --backup    Create backup before deployment (production only)
    -h, --help      Show this help message

EXAMPLES:
    $0 staging                          # Deploy latest to staging
    $0 production -v v1.2.3             # Deploy specific version to production
    $0 staging --skip-tests             # Deploy to staging without smoke tests
    $0 production --force --backup      # Force production deployment with backup

ENVIRONMENT VARIABLES:
    KUBECONFIG      Path to kubectl configuration file
    DO_TOKEN        DigitalOcean access token for registry
    SLACK_WEBHOOK   Slack webhook URL for notifications
    STRIPE_TEST_PUBLISHABLE_KEY     Stripe test key for staging
    STRIPE_LIVE_PUBLISHABLE_KEY     Stripe live key for production
    PAYPAL_TEST_CLIENT_ID           PayPal test client ID for staging
    PAYPAL_LIVE_CLIENT_ID           PayPal live client ID for production
EOF
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check required tools
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v kustomize >/dev/null 2>&1 || error "kustomize is required but not installed"
    command -v curl >/dev/null 2>&1 || error "curl is required but not installed"
    command -v docker >/dev/null 2>&1 || error "docker is required but not installed"

    # Check kubectl connectivity
    if ! kubectl auth can-i get pods -n "$NAMESPACE" >/dev/null 2>&1; then
        error "Cannot connect to Kubernetes cluster or insufficient permissions. Check KUBECONFIG."
    fi

    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        warn "Namespace '$NAMESPACE' does not exist. Creating..."
        kubectl create namespace "$NAMESPACE" || error "Failed to create namespace"
    fi

    # Check docker daemon
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon is not running or accessible"
    fi

    log "Prerequisites check completed"
}

validate_environment() {
    local env=$1

    if [[ ! " ${ENVIRONMENTS[*]} " =~ " ${env} " ]]; then
        error "Invalid environment: $env. Valid options: ${ENVIRONMENTS[*]}"
    fi

    if [ "$env" = "production" ] && [ -z "${VERSION:-}" ]; then
        error "Production deployments require explicit version (-v flag)"
    fi
}

generate_version() {
    local env=$1

    if [ -n "${VERSION:-}" ]; then
        echo "$VERSION"
        return
    fi

    case $env in
        staging)
            echo "staging-$(git rev-parse --short HEAD)-$(date +%Y%m%d%H%M%S)"
            ;;
        production)
            # For production, version should always be explicitly provided
            error "Production deployment requires explicit version"
            ;;
        *)
            error "Unknown environment: $env"
            ;;
    esac
}

backup_current_state() {
    local env=$1
    local backup_dir="/tmp/vendfinder-backup-$(date +%Y%m%d-%H%M%S)"

    log "Creating backup of current $env state..."

    mkdir -p "$backup_dir"

    # Backup current deployments
    kubectl get deployments -n "$NAMESPACE" -o yaml > "$backup_dir/deployments.yaml" 2>/dev/null || true

    # Backup current configmaps
    kubectl get configmaps -n "$NAMESPACE" -o yaml > "$backup_dir/configmaps.yaml" 2>/dev/null || true

    # Backup current services
    kubectl get services -n "$NAMESPACE" -o yaml > "$backup_dir/services.yaml" 2>/dev/null || true

    # Save current image tags for easy rollback
    kubectl get deployments -n "$NAMESPACE" \
        -o jsonpath='{range .items[*]}{.metadata.name}:{.spec.template.spec.containers[0].image}{"\n"}{end}' \
        > "$backup_dir/current-images.txt" 2>/dev/null || true

    log "Backup saved to: $backup_dir"
    echo "$backup_dir" > /tmp/latest-backup-path
}

build_and_push_images() {
    local version=$1
    local env=$2

    if [ "$env" = "staging" ] || [ -z "${SKIP_BUILD:-}" ]; then
        log "Building and pushing images for version: $version"

        # Build frontend with proper build args
        log "Building frontend..."

        # Set default values for environment variables if not set
        local stripe_key=""
        local paypal_client_id=""

        if [ "$env" = "production" ]; then
            stripe_key="${STRIPE_LIVE_PUBLISHABLE_KEY:-}"
            paypal_client_id="${PAYPAL_LIVE_CLIENT_ID:-}"
        else
            stripe_key="${STRIPE_TEST_PUBLISHABLE_KEY:-}"
            paypal_client_id="${PAYPAL_TEST_CLIENT_ID:-}"
        fi

        # Build frontend with environment-specific configuration
        if [ -n "$stripe_key" ] && [ -n "$paypal_client_id" ]; then
            docker build \
                --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$stripe_key" \
                --build-arg NEXT_PUBLIC_PAYPAL_CLIENT_ID="$paypal_client_id" \
                -t "$REGISTRY/frontend:$version" . || error "Frontend build failed"
        else
            warn "Payment provider keys not set, building with defaults"
            docker build -t "$REGISTRY/frontend:$version" . || error "Frontend build failed"
        fi

        docker push "$REGISTRY/frontend:$version" || error "Frontend push failed"

        log "Frontend image built and pushed successfully"

        # Note: Other services would be built here if they existed in the repository
        # For now, we assume they are built and pushed by their respective CI/CD pipelines

    else
        log "Skipping image build (SKIP_BUILD is set)"
    fi
}

update_kustomize_config() {
    local env=$1
    local version=$2

    log "Updating kustomize configuration for $env with version $version..."

    if [ ! -d "environments/$env" ]; then
        error "Environment directory not found: environments/$env"
    fi

    cd "environments/$env"

    # Update image tags (aligned with production deployment workflow)
    kustomize edit set image \
        "registry.digitalocean.com/vendfinder-registry/frontend:$version" \
        "registry.digitalocean.com/vendfinder-registry/user-service:$version" \
        "registry.digitalocean.com/vendfinder-registry/chat-service:$version" \
        "registry.digitalocean.com/vendfinder-registry/product-service:$version" \
        "registry.digitalocean.com/vendfinder-registry/order-service:$version" \
        "registry.digitalocean.com/vendfinder-registry/websocket-service:$version" \
        "registry.digitalocean.com/vendfinder-registry/support-bot:$version" \
        "registry.digitalocean.com/vendfinder-registry/api-gateway:$version" \
        || error "Failed to update kustomize configuration"

    cd - >/dev/null

    log "Kustomize configuration updated"
}

deploy_to_kubernetes() {
    local env=$1
    local version=$2

    log "Deploying to $env environment..."

    # Generate manifests
    kubectl kustomize "environments/$env" > "/tmp/$env-deployment.yaml" || error "Failed to generate manifests"

    # Apply deployment
    kubectl apply -f "/tmp/$env-deployment.yaml" || error "Failed to apply deployment"

    # Deployments list (aligned with production deployment workflow)
    local deployments=("frontend" "user-service" "chat-service" "product-service" "order-service" "websocket-service" "support-bot" "api-gateway")

    # Wait for rollout
    for deployment in "${deployments[@]}"; do
        local deployment_name="$deployment"
        if [ "$env" = "staging" ]; then
            deployment_name="staging-$deployment"
        fi

        log "Waiting for $deployment_name rollout..."

        # Check if deployment exists before waiting
        if kubectl get deployment "$deployment_name" -n "$NAMESPACE" >/dev/null 2>&1; then
            if ! kubectl rollout status "deployment/$deployment_name" -n "$NAMESPACE" --timeout=600s; then
                error "Deployment $deployment_name failed to roll out"
            fi
        else
            warn "Deployment $deployment_name not found, skipping rollout check"
        fi
    done

    # Annotate deployments with version info
    for deployment in "${deployments[@]}"; do
        local deployment_name="$deployment"
        if [ "$env" = "staging" ]; then
            deployment_name="staging-$deployment"
        fi

        # Only annotate if deployment exists
        if kubectl get deployment "$deployment_name" -n "$NAMESPACE" >/dev/null 2>&1; then
            kubectl annotate "deployment/$deployment_name" -n "$NAMESPACE" \
                "vendfinder.com/deployed-version=$version" \
                "vendfinder.com/deployed-at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                "vendfinder.com/deployed-by=$(whoami)" \
                "vendfinder.com/environment=$env" \
                --overwrite >/dev/null || warn "Failed to annotate $deployment_name"
        fi
    done

    log "Deployment to $env completed successfully"
}

run_smoke_tests() {
    local env=$1

    if [ "${SKIP_TESTS:-}" = "true" ]; then
        warn "Skipping smoke tests as requested"
        return 0
    fi

    log "Running smoke tests for $env..."

    # Determine URL based on environment
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

    # Basic health checks
    info "Testing main site..."
    if ! curl -f --max-time 30 "$base_url/" >/dev/null 2>&1; then
        error "Main site health check failed"
    fi

    info "Testing API health endpoint..."
    if ! curl -f --max-time 30 "$base_url/api/health" >/dev/null 2>&1; then
        warn "API health check failed - service may still be starting"
        sleep 30
        if ! curl -f --max-time 30 "$base_url/api/health" >/dev/null 2>&1; then
            error "API health check failed after retry"
        fi
    fi

    # Run E2E tests if available
    if [ -f "package.json" ] && grep -q "test:e2e" package.json; then
        info "Running E2E smoke tests..."
        export PLAYWRIGHT_BASE_URL="$base_url"
        export TEST_ENV="$env"

        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            npm ci || warn "Failed to install dependencies for tests"
        fi

        # Run only smoke tests for speed
        if ! npm run test:e2e -- --grep="@smoke" --reporter=line 2>/dev/null; then
            warn "Some E2E tests failed - review manually"
        fi
    else
        info "No E2E tests configured, skipping"
    fi

    log "Smoke tests completed for $env"
}

send_notification() {
    local env=$1
    local version=$2
    local status=$3

    if [ -z "${SLACK_WEBHOOK:-}" ]; then
        info "No Slack webhook configured, skipping notification"
        return 0
    fi

    local emoji
    local color
    local message

    case $status in
        success)
            emoji="✅"
            color="good"
            message="VendFinder deployment to $env successful!"
            ;;
        failure)
            emoji="❌"
            color="danger"
            message="VendFinder deployment to $env FAILED!"
            ;;
        *)
            emoji="ℹ️"
            color="warning"
            message="VendFinder deployment to $env - $status"
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
                    "title": "Version",
                    "value": "$version",
                    "short": true
                },
                {
                    "title": "Deployed by",
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
        info "Notification sent to Slack"
    else
        warn "Failed to send Slack notification"
    fi
}

main() {
    local environment=""
    local force=false
    local backup=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            staging|production)
                environment=$1
                shift
                ;;
            -v|--version)
                VERSION=$2
                shift 2
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -b|--backup)
                backup=true
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

    # Validate arguments
    if [ -z "$environment" ]; then
        error "Environment is required. Use -h for help."
    fi

    validate_environment "$environment"

    # Generate version if not provided
    local deployment_version
    deployment_version=$(generate_version "$environment")

    log "Starting VendFinder deployment to $environment"
    info "Version: $deployment_version"
    info "Timestamp: $(date)"

    # Confirmation for production
    if [ "$environment" = "production" ] && [ "$force" = false ]; then
        echo
        warn "You are about to deploy to PRODUCTION!"
        warn "Version: $deployment_version"
        warn "This will affect live users."
        echo
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            info "Deployment cancelled by user"
            exit 0
        fi
    fi

    # Execute deployment steps
    check_prerequisites

    if [ "$backup" = true ] || [ "$environment" = "production" ]; then
        backup_current_state "$environment"
    fi

    build_and_push_images "$deployment_version" "$environment"
    update_kustomize_config "$environment" "$deployment_version"
    deploy_to_kubernetes "$environment" "$deployment_version"
    run_smoke_tests "$environment"

    log "🎉 Deployment to $environment completed successfully!"
    info "Version deployed: $deployment_version"

    local env_url
    if [ "$environment" = "production" ]; then
        env_url="https://vendfinder.com"
    else
        env_url="https://$environment.vendfinder.com"
    fi
    info "Environment URL: $env_url"

    send_notification "$environment" "$deployment_version" "success"
}

# Trap errors and send failure notification
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        send_notification "${environment:-unknown}" "${deployment_version:-unknown}" "failure"
    fi
    exit $exit_code
}

trap cleanup ERR EXIT

# Run main function
main "$@"