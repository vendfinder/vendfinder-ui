#!/bin/bash
# scripts/parity-analysis/tier2-services.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/db-utils.sh"

# Configuration
CONFIG_FILE="$SCRIPT_DIR/../../config/parity-analysis.yaml"
ENDPOINTS_FILE="$SCRIPT_DIR/../../config/service-endpoints.yaml"
REPORT_FILE="$1"

main() {
    log_info "Starting Tier 2: Service Health & API Parity Analysis"

    # Load configuration
    load_config "$CONFIG_FILE"
    load_config "$ENDPOINTS_FILE"

    local prod_domain staging_domain
    prod_domain=$(yq eval '.environments.production.api_domain' "$CONFIG_FILE")
    staging_domain=$(yq eval '.environments.staging.api_domain' "$CONFIG_FILE")

    # Initialize report section
    echo "## Tier 2: Service Health & API Parity Analysis" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # Run service health comparisons
    test_service_health "$prod_domain" "$staging_domain" "$REPORT_FILE"
    test_api_endpoints "$prod_domain" "$staging_domain" "$REPORT_FILE"
    compare_database_configurations "$REPORT_FILE"
    validate_external_integrations "$REPORT_FILE"

    log_info "Tier 2 analysis complete"
}

test_service_health() {
    local prod_domain="$1"
    local staging_domain="$2"
    local report_file="$3"

    log_info "Testing service health endpoints"

    local services
    services=$(yq eval '.services[]' "$CONFIG_FILE")

    while IFS= read -r service_config; do
        local service_name port health_endpoint
        service_name=$(echo "$service_config" | yq eval '.name' -)
        port=$(echo "$service_config" | yq eval '.port' -)
        health_endpoint=$(echo "$service_config" | yq eval '.health_endpoint' -)

        # Test production health
        local prod_url="https://$prod_domain$health_endpoint"
        local staging_url="https://$staging_domain$health_endpoint"

        test_endpoint_health "$service_name" "$prod_url" "production" "$report_file"
        test_endpoint_health "$service_name" "$staging_url" "staging" "$report_file"

    done <<< "$services"
}

test_endpoint_health() {
    local service_name="$1"
    local url="$2"
    local environment="$3"
    local report_file="$4"

    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --connect-timeout 10 --max-time 30 || echo "000")

    if [[ "$http_code" != "200" ]]; then
        local priority="HIGH"
        if [[ "$environment" == "production" ]]; then
            priority="CRITICAL"
        fi

        add_discrepancy "$report_file" "$priority" "Service Health Check Failed" \
            "$service_name health check failed in $environment (HTTP $http_code): $url" \
            "Check service logs: kubectl logs -n vendfinder${environment:+-$environment} deployment/$service_name"
    fi
}

test_api_endpoints() {
    local prod_domain="$1"
    local staging_domain="$2"
    local report_file="$3"

    log_info "Testing critical API endpoints"

    # Get critical endpoints from config
    local endpoint_categories
    endpoint_categories=$(yq eval '.critical_endpoints | keys | .[]' "$ENDPOINTS_FILE")

    while IFS= read -r category; do
        local endpoints
        endpoints=$(yq eval ".critical_endpoints.$category[]" "$ENDPOINTS_FILE")

        while IFS= read -r endpoint_config; do
            local path method requires_auth
            path=$(echo "$endpoint_config" | yq eval '.path' -)
            method=$(echo "$endpoint_config" | yq eval '.method' -)
            requires_auth=$(echo "$endpoint_config" | yq eval '.requires_auth' -)

            # Test endpoint in both environments
            local prod_url="https://$prod_domain$path"
            local staging_url="https://$staging_domain$path"

            compare_endpoint_responses "$category" "$path" "$method" "$prod_url" "$staging_url" "$requires_auth" "$report_file"

        done <<< "$endpoints"
    done <<< "$endpoint_categories"
}

compare_endpoint_responses() {
    local category="$1"
    local path="$2"
    local method="$3"
    local prod_url="$4"
    local staging_url="$5"
    local requires_auth="$6"
    local report_file="$7"

    # Test without auth first (should work for public endpoints)
    local prod_code staging_code
    prod_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$prod_url" --connect-timeout 10 --max-time 30 || echo "000")
    staging_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$staging_url" --connect-timeout 10 --max-time 30 || echo "000")

    # Compare response codes
    if [[ "$prod_code" != "$staging_code" ]]; then
        local priority="HIGH"
        if [[ "$category" == "auth" ]]; then
            priority="CRITICAL"
        fi

        add_discrepancy "$report_file" "$priority" "API Response Mismatch" \
            "$category endpoint $path responds differently: prod($prod_code) vs staging($staging_code)" \
            "Investigate endpoint behavior differences and align staging with production"
    fi

    # Test response times
    local prod_time staging_time
    prod_time=$(curl -s -o /dev/null -w "%{time_total}" -X "$method" "$prod_url" --connect-timeout 10 --max-time 30 || echo "999")
    staging_time=$(curl -s -o /dev/null -w "%{time_total}" -X "$method" "$staging_url" --connect-timeout 10 --max-time 30 || echo "999")

    # Alert if staging is significantly slower (>2x production time)
    if (( $(echo "$staging_time > ($prod_time * 2)" | bc -l) )); then
        add_discrepancy "$report_file" "MEDIUM" "Performance Difference" \
            "$category endpoint $path significantly slower in staging: ${staging_time}s vs ${prod_time}s" \
            "Investigate staging performance bottlenecks"
    fi
}

compare_database_configurations() {
    local report_file="$1"

    log_info "Comparing database configurations"

    local prod_namespace staging_namespace
    prod_namespace=$(yq eval '.environments.production.namespace' "$CONFIG_FILE")
    staging_namespace=$(yq eval '.environments.staging.namespace' "$CONFIG_FILE")

    # Compare database configurations for each service
    local databases
    databases=$(yq eval '.databases[]' "$CONFIG_FILE")

    # Get database count and iterate by index
    local db_count
    db_count=$(yq eval '.databases | length' "$CONFIG_FILE")

    for ((i=0; i<db_count; i++)); do
        local service_name db_name prod_db staging_db
        service_name=$(yq eval ".databases[$i].service" "$CONFIG_FILE")
        db_name=$(yq eval ".databases[$i].name" "$CONFIG_FILE")
        prod_db=$(yq eval ".databases[$i].prod_db" "$CONFIG_FILE")
        staging_db=$(yq eval ".databases[$i].staging_db" "$CONFIG_FILE")

        compare_database_connections "$service_name" "$prod_namespace" "$staging_namespace" "$report_file"

        # Create a simple config object for schema comparison
        local db_config_json
        db_config_json=$(jq -n --arg name "$db_name" --arg prod_db "$prod_db" --arg staging_db "$staging_db" \
            '{name: $name, prod_db: $prod_db, staging_db: $staging_db}')
        compare_database_schemas "$db_config_json" "$report_file"
    done
}

validate_external_integrations() {
    local report_file="$1"

    log_info "Validating external service integrations"

    local prod_namespace staging_namespace
    prod_namespace=$(yq eval '.environments.production.namespace' "$CONFIG_FILE")
    staging_namespace=$(yq eval '.environments.staging.namespace' "$CONFIG_FILE")

    # Check Stripe configuration
    validate_stripe_config "$prod_namespace" "$staging_namespace" "$report_file"

    # Check DigitalOcean Spaces configuration
    validate_do_spaces_config "$prod_namespace" "$staging_namespace" "$report_file"

    # Check Anthropic API configuration
    validate_anthropic_config "$prod_namespace" "$staging_namespace" "$report_file"
}

validate_stripe_config() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"

    # Get Stripe keys from order service environment
    local prod_stripe_key staging_stripe_key
    prod_stripe_key=$(kubectl get deployment order-service -n "$prod_namespace" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="STRIPE_SECRET_KEY")].value}' 2>/dev/null || echo "")
    staging_stripe_key=$(kubectl get deployment order-service -n "$staging_namespace" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="STRIPE_SECRET_KEY")].value}' 2>/dev/null || echo "")

    # Validate Stripe key patterns
    local test_pattern prod_pattern
    test_pattern=$(yq eval '.external_integrations.stripe.test_key_pattern' "$ENDPOINTS_FILE")
    prod_pattern=$(yq eval '.external_integrations.stripe.prod_key_pattern' "$ENDPOINTS_FILE")

    # Production should use live keys, staging should use test keys
    if [[ "$prod_stripe_key" =~ $test_pattern ]]; then
        add_discrepancy "$report_file" "CRITICAL" "Stripe Config Error" \
            "Production using Stripe test key: $prod_stripe_key" \
            "Update production STRIPE_SECRET_KEY to use live key pattern"
    fi

    if [[ "$staging_stripe_key" =~ $prod_pattern ]]; then
        add_discrepancy "$report_file" "CRITICAL" "Stripe Config Error" \
            "Staging using Stripe live key: $staging_stripe_key" \
            "Update staging STRIPE_SECRET_KEY to use test key pattern"
    fi
}

validate_do_spaces_config() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"

    # Check DigitalOcean Spaces endpoint configuration
    local services_with_spaces=("user-service" "api-gateway")

    for service in "${services_with_spaces[@]}"; do
        local prod_endpoint staging_endpoint
        prod_endpoint=$(kubectl get deployment "$service" -n "$prod_namespace" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="DO_SPACES_ENDPOINT")].value}' 2>/dev/null || echo "")
        staging_endpoint=$(kubectl get deployment "$service" -n "$staging_namespace" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="DO_SPACES_ENDPOINT")].value}' 2>/dev/null || echo "")

        if [[ "$prod_endpoint" == "$staging_endpoint" ]] && [[ -n "$prod_endpoint" ]]; then
            add_discrepancy "$report_file" "HIGH" "DO Spaces Config" \
                "$service using same DO Spaces endpoint in both environments: $prod_endpoint" \
                "Use separate buckets/endpoints for staging and production"
        fi
    done
}

validate_anthropic_config() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"

    # Check Anthropic API key in support-bot
    local prod_api_key staging_api_key
    prod_api_key=$(kubectl get deployment support-bot -n "$prod_namespace" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="ANTHROPIC_API_KEY")].value}' 2>/dev/null || echo "")
    staging_api_key=$(kubectl get deployment support-bot -n "$staging_namespace" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="ANTHROPIC_API_KEY")].value}' 2>/dev/null || echo "")

    local api_key_pattern
    api_key_pattern=$(yq eval '.external_integrations.anthropic.api_key_pattern' "$ENDPOINTS_FILE")

    # Both should have valid API keys but may share the same key for cost reasons
    if [[ -z "$prod_api_key" ]]; then
        add_discrepancy "$report_file" "HIGH" "Missing Anthropic API Key" \
            "Production support-bot missing ANTHROPIC_API_KEY" \
            "Add ANTHROPIC_API_KEY environment variable to support-bot deployment"
    fi

    if [[ -z "$staging_api_key" ]]; then
        add_discrepancy "$report_file" "HIGH" "Missing Anthropic API Key" \
            "Staging support-bot missing ANTHROPIC_API_KEY" \
            "Add ANTHROPIC_API_KEY environment variable to support-bot deployment"
    fi
}

# Run main function if script executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -ne 1 ]]; then
        echo "Usage: $0 <report_file>" >&2
        exit 1
    fi
    main "$@"
fi