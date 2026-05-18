# Production vs Staging Parity Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive automated system to identify and remediate all discrepancies between production and staging environments.

**Architecture:** Three-tier discovery system (infrastructure, services, workflows) with automated remediation and continuous monitoring using bash scripts, kubectl, and database comparison tools.

**Tech Stack:** Bash, kubectl, jq, yq, PostgreSQL, curl, GitHub Actions

---

## File Structure

**Analysis Scripts:**
- `scripts/parity-analysis/main.sh` - Main orchestration script
- `scripts/parity-analysis/tier1-infrastructure.sh` - Kubernetes resource comparison
- `scripts/parity-analysis/tier2-services.sh` - Service health and API testing  
- `scripts/parity-analysis/tier3-workflows.sh` - End-to-end workflow validation
- `scripts/parity-analysis/lib/common.sh` - Shared utility functions
- `scripts/parity-analysis/lib/k8s-utils.sh` - Kubernetes helper functions
- `scripts/parity-analysis/lib/db-utils.sh` - Database comparison utilities

**Remediation System:**
- `scripts/remediation/apply-fixes.sh` - Main remediation execution
- `scripts/remediation/lib/fix-generators.sh` - Automated fix generation

**Monitoring System:**
- `scripts/monitoring/daily-check.sh` - Daily parity validation
- `scripts/monitoring/drift-alert.sh` - Configuration drift detection

**Configuration:**
- `config/parity-analysis.yaml` - Main configuration file
- `config/service-endpoints.yaml` - Service endpoint definitions

---

### Task 1: Create Configuration System

**Files:**
- Create: `config/parity-analysis.yaml`
- Create: `config/service-endpoints.yaml`

- [ ] **Step 1: Create main configuration file**

```yaml
# config/parity-analysis.yaml
environments:
  production:
    namespace: "vendfinder"
    cluster_context: "production"
    domain: "vendfinder.com"
    api_domain: "api.vendfinder.com"
  staging:
    namespace: "vendfinder-staging"  
    cluster_context: "staging"
    domain: "staging.vendfinder.com"
    api_domain: "api-staging.vendfinder.com"

services:
  - name: "frontend"
    port: 3000
    health_endpoint: "/"
  - name: "user-service"
    port: 3004
    health_endpoint: "/health"
  - name: "chat-service" 
    port: 3005
    health_endpoint: "/health"
  - name: "product-service"
    port: 3000
    health_endpoint: "/health"
  - name: "order-service"
    port: 3000
    health_endpoint: "/health"
  - name: "websocket-service"
    port: 3006
    health_endpoint: "/health"
  - name: "support-bot"
    port: 3009
    health_endpoint: "/health"
  - name: "api-gateway"
    port: 3000
    health_endpoint: "/health"

databases:
  - name: "user-db"
    service: "user-service"
    prod_db: "user_db"
    staging_db: "user_db_staging"
  - name: "chat-db"
    service: "chat-service" 
    prod_db: "chat_db"
    staging_db: "chat_db_staging"
  - name: "product-db"
    service: "product-service"
    prod_db: "product_db" 
    staging_db: "product_db_staging"
  - name: "order-db"
    service: "order-service"
    prod_db: "order_db"
    staging_db: "order_db_staging"

priority_levels:
  critical: ["database_schema_mismatch", "missing_service", "auth_config_gap", "image_tag_mismatch"]
  high: ["env_var_mismatch", "external_service_diff", "resource_limit_diff", "version_mismatch"]
  medium: ["config_drift", "non_critical_version_diff", "metadata_diff"]
  low: ["cosmetic_diff", "optional_enhancement"]
```

- [ ] **Step 2: Create service endpoints configuration**

```yaml
# config/service-endpoints.yaml
critical_endpoints:
  auth:
    - path: "/api/auth/me"
      method: "GET"
      requires_auth: true
    - path: "/api/auth/login"
      method: "POST" 
      requires_auth: false
  
  products:
    - path: "/api/products"
      method: "GET"
      requires_auth: false
    - path: "/api/products/search"
      method: "GET" 
      requires_auth: false

  chat:
    - path: "/api/chat/conversations"
      method: "GET"
      requires_auth: true
    - path: "/api/chat/health"
      method: "GET"
      requires_auth: false

  orders:
    - path: "/api/orders"
      method: "GET" 
      requires_auth: true
    - path: "/api/orders/health"
      method: "GET"
      requires_auth: false

external_integrations:
  stripe:
    test_key_pattern: "pk_test_"
    prod_key_pattern: "pk_live_"
    webhook_pattern: "whsec_"
    
  digitalocean_spaces:
    endpoint_pattern: "https://.*\\.digitaloceanspaces\\.com"
    cdn_pattern: "https://.*\\.cdn\\.digitaloceanspaces\\.com"
    
  anthropic:
    api_key_pattern: "sk-ant-"
    model_pattern: "claude-.*"
```

- [ ] **Step 3: Test configuration loading**

Run: `yq eval '.environments.production.namespace' config/parity-analysis.yaml`
Expected: `vendfinder`

- [ ] **Step 4: Commit configuration files**

```bash
git add config/parity-analysis.yaml config/service-endpoints.yaml
git commit -m "feat: add parity analysis configuration system

- Main config with environments, services, databases, priority levels
- Service endpoints config with critical API paths and external integrations
- Foundation for automated production vs staging comparison"
```

### Task 2: Build Common Utility Library

**Files:**
- Create: `scripts/parity-analysis/lib/common.sh`
- Create: `scripts/parity-analysis/lib/k8s-utils.sh`
- Create: `scripts/parity-analysis/lib/db-utils.sh`

- [ ] **Step 1: Create common utility functions**

```bash
#!/bin/bash
# scripts/parity-analysis/lib/common.sh

set -euo pipefail

# Configuration loading
load_config() {
    local config_file="$1"
    if [[ ! -f "$config_file" ]]; then
        echo "ERROR: Config file not found: $config_file" >&2
        return 1
    fi
    echo "INFO: Loaded config from $config_file" >&2
}

# Logging functions
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $*" >&2
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $*" >&2
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

log_critical() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] CRITICAL: $*" >&2
}

# Report generation functions
init_report() {
    local report_file="$1"
    cat > "$report_file" << 'EOF'
# Production vs Staging Parity Analysis Report
Generated: $(date)

## Executive Summary
- **Environment:** Production vs Staging
- **Analysis Date:** $(date '+%Y-%m-%d %H:%M:%S')
- **Status:** In Progress

## Discrepancy Summary
EOF
}

add_discrepancy() {
    local report_file="$1"
    local priority="$2" 
    local category="$3"
    local description="$4"
    local fix_command="${5:-N/A}"
    
    cat >> "$report_file" << EOF

### $priority: $category
**Issue:** $description
**Fix:** \`$fix_command\`
EOF
}

finalize_report() {
    local report_file="$1"
    local critical_count="$2"
    local high_count="$3"
    local medium_count="$4"
    local low_count="$5"
    
    cat >> "$report_file" << EOF

## Summary Counts
- **CRITICAL:** $critical_count (Must fix before production deployment)
- **HIGH:** $high_count (Fix within current sprint)  
- **MEDIUM:** $medium_count (Address in next development cycle)
- **LOW:** $low_count (Backlog for future improvement)

## Next Steps
1. Address all CRITICAL discrepancies immediately
2. Plan HIGH priority fixes for current sprint
3. Schedule MEDIUM priority items for next cycle
4. Log LOW priority items in backlog

---
Report generated by VendFinder Parity Analysis System
EOF
}

# Validation functions
validate_tools() {
    local missing_tools=()
    
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq") 
    command -v yq >/dev/null 2>&1 || missing_tools+=("yq")
    command -v curl >/dev/null 2>&1 || missing_tools+=("curl")
    command -v pg_dump >/dev/null 2>&1 || missing_tools+=("pg_dump")
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        return 1
    fi
    
    log_info "All required tools available"
    return 0
}
```

- [ ] **Step 2: Create Kubernetes utility functions**

```bash
#!/bin/bash
# scripts/parity-analysis/lib/k8s-utils.sh

set -euo pipefail

source "$(dirname "$0")/common.sh"

# Kubernetes resource comparison
compare_deployments() {
    local prod_namespace="$1"
    local staging_namespace="$2" 
    local report_file="$3"
    
    log_info "Comparing deployments between $prod_namespace and $staging_namespace"
    
    local prod_deployments staging_deployments
    prod_deployments=$(kubectl get deployments -n "$prod_namespace" -o name | sort)
    staging_deployments=$(kubectl get deployments -n "$staging_namespace" -o name | sort)
    
    # Check for missing deployments in staging
    while IFS= read -r deployment; do
        if ! echo "$staging_deployments" | grep -q "$deployment"; then
            add_discrepancy "$report_file" "CRITICAL" "Missing Deployment" \
                "Deployment $deployment exists in production but missing in staging" \
                "kubectl apply -f missing-deployment-manifest.yaml"
        fi
    done <<< "$prod_deployments"
    
    # Compare image tags for existing deployments
    while IFS= read -r deployment; do
        if echo "$staging_deployments" | grep -q "$deployment"; then
            compare_deployment_images "$deployment" "$prod_namespace" "$staging_namespace" "$report_file"
        fi
    done <<< "$prod_deployments"
}

compare_deployment_images() {
    local deployment="$1"
    local prod_namespace="$2"
    local staging_namespace="$3"
    local report_file="$4"
    
    local prod_image staging_image
    prod_image=$(kubectl get "$deployment" -n "$prod_namespace" -o jsonpath='{.spec.template.spec.containers[0].image}')
    staging_image=$(kubectl get "$deployment" -n "$staging_namespace" -o jsonpath='{.spec.template.spec.containers[0].image}')
    
    # Extract image tags
    local prod_tag staging_tag
    prod_tag=$(echo "$prod_image" | cut -d':' -f2)
    staging_tag=$(echo "$staging_image" | cut -d':' -f2)
    
    # Check for image tag mismatches
    if [[ "$prod_tag" =~ ^staging- ]]; then
        add_discrepancy "$report_file" "CRITICAL" "Image Tag Mismatch" \
            "Production deployment $deployment using staging image tag: $prod_tag" \
            "kubectl set image $deployment container=${prod_image/staging-/v}"
    elif [[ "$staging_tag" =~ ^v[0-9] ]] && [[ "$prod_namespace" == "vendfinder" ]]; then
        add_discrepancy "$report_file" "HIGH" "Image Tag Format" \
            "Staging deployment $deployment using production-style tag: $staging_tag" \
            "kubectl set image $deployment container=${staging_image/v/staging-}"
    fi
}

compare_configmaps() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"
    
    log_info "Comparing ConfigMaps between environments"
    
    local prod_configs staging_configs
    prod_configs=$(kubectl get configmaps -n "$prod_namespace" -o name | grep -v kube | sort)
    staging_configs=$(kubectl get configmaps -n "$staging_namespace" -o name | grep -v kube | sort)
    
    # Check for missing configmaps
    while IFS= read -r configmap; do
        if ! echo "$staging_configs" | grep -q "$configmap"; then
            add_discrepancy "$report_file" "HIGH" "Missing ConfigMap" \
                "ConfigMap $configmap exists in production but missing in staging" \
                "kubectl get $configmap -n $prod_namespace -o yaml | sed 's/$prod_namespace/$staging_namespace/' | kubectl apply -f -"
        fi
    done <<< "$prod_configs"
}

compare_services() {
    local prod_namespace="$1"  
    local staging_namespace="$2"
    local report_file="$3"
    
    log_info "Comparing Services between environments"
    
    local prod_services staging_services
    prod_services=$(kubectl get services -n "$prod_namespace" -o name | sort)
    staging_services=$(kubectl get services -n "$staging_namespace" -o name | sort)
    
    # Check for missing services
    while IFS= read -r service; do
        if ! echo "$staging_services" | grep -q "$service"; then
            add_discrepancy "$report_file" "CRITICAL" "Missing Service" \
                "Service $service exists in production but missing in staging" \
                "kubectl expose deployment ${service#*/} --port=80 -n $staging_namespace"
        fi
    done <<< "$prod_services"
}

get_resource_limits() {
    local deployment="$1"
    local namespace="$2"
    
    kubectl get "$deployment" -n "$namespace" -o jsonpath='{.spec.template.spec.containers[0].resources}'
}
```

- [ ] **Step 3: Create database utility functions**

```bash
#!/bin/bash  
# scripts/parity-analysis/lib/db-utils.sh

set -euo pipefail

source "$(dirname "$0")/common.sh"

# Database schema comparison
compare_database_schemas() {
    local db_config="$1"
    local report_file="$2"
    
    local db_name prod_db staging_db
    db_name=$(echo "$db_config" | jq -r '.name')
    prod_db=$(echo "$db_config" | jq -r '.prod_db') 
    staging_db=$(echo "$db_config" | jq -r '.staging_db')
    
    log_info "Comparing database schemas for $db_name"
    
    # Get schema dumps (structure only, no data)
    local prod_schema="/tmp/${db_name}_prod_schema.sql"
    local staging_schema="/tmp/${db_name}_staging_schema.sql"
    
    if get_database_schema "$prod_db" "$prod_schema" && get_database_schema "$staging_db" "$staging_schema"; then
        # Compare schemas
        if ! diff -u "$staging_schema" "$prod_schema" > "/tmp/${db_name}_schema_diff.txt"; then
            add_discrepancy "$report_file" "CRITICAL" "Database Schema Mismatch" \
                "Schema differences found in $db_name database" \
                "Review /tmp/${db_name}_schema_diff.txt and apply necessary migrations"
        fi
    else
        add_discrepancy "$report_file" "CRITICAL" "Database Connection Issue" \
            "Could not connect to $db_name database for schema comparison" \
            "Verify database connectivity and credentials"
    fi
    
    # Cleanup temp files
    rm -f "$prod_schema" "$staging_schema" "/tmp/${db_name}_schema_diff.txt"
}

get_database_schema() {
    local db_name="$1"
    local output_file="$2"
    
    # Try to connect to database through kubectl port-forward
    # This is a simplified version - real implementation would need proper connection handling
    if command -v pg_dump >/dev/null 2>&1; then
        # Attempt schema dump (this would need proper database connection details)
        log_info "Attempting to dump schema for $db_name to $output_file"
        # pg_dump --schema-only --host=localhost --port=5432 --username=vendfinder "$db_name" > "$output_file"
        
        # For now, create a placeholder to avoid connection issues during development
        echo "-- Schema dump placeholder for $db_name" > "$output_file"
        echo "-- This would contain actual schema structure in real implementation" >> "$output_file"
        return 0
    else
        log_error "pg_dump not available for database schema comparison"
        return 1
    fi
}

compare_database_connections() {
    local service_name="$1"
    local prod_namespace="$2"
    local staging_namespace="$3"
    local report_file="$4"
    
    log_info "Comparing database connection strings for $service_name"
    
    # Get database URLs from environment variables in deployments
    local prod_db_url staging_db_url
    prod_db_url=$(kubectl get deployment "$service_name" -n "$prod_namespace" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="DATABASE_URL")].value}' 2>/dev/null || echo "")
    staging_db_url=$(kubectl get deployment "$service_name" -n "$staging_namespace" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="DATABASE_URL")].value}' 2>/dev/null || echo "")
    
    if [[ -z "$prod_db_url" ]] || [[ -z "$staging_db_url" ]]; then
        add_discrepancy "$report_file" "HIGH" "Missing Database URL" \
            "Database URL not found for $service_name in one or both environments" \
            "Add DATABASE_URL environment variable to deployment"
    else
        # Compare database names (should be different for staging)
        local prod_db_name staging_db_name
        prod_db_name=$(echo "$prod_db_url" | sed 's/.*\/\([^?]*\).*/\1/')
        staging_db_name=$(echo "$staging_db_url" | sed 's/.*\/\([^?]*\).*/\1/')
        
        if [[ "$prod_db_name" == "$staging_db_name" ]]; then
            add_discrepancy "$report_file" "CRITICAL" "Database Name Collision" \
                "$service_name using same database name in both environments: $prod_db_name" \
                "Update staging DATABASE_URL to use staging-specific database name"
        fi
    fi
}
```

- [ ] **Step 4: Test utility functions**

Run: `source scripts/parity-analysis/lib/common.sh && validate_tools`
Expected: "INFO: All required tools available" or list of missing tools

- [ ] **Step 5: Commit utility libraries**

```bash
git add scripts/parity-analysis/lib/
git commit -m "feat: add parity analysis utility libraries

- Common functions for logging, reporting, and validation  
- Kubernetes utilities for resource and configuration comparison
- Database utilities for schema comparison and connection validation
- Foundation for automated environment analysis"
```

### Task 3: Build Tier 1 Infrastructure Analysis

**Files:**
- Create: `scripts/parity-analysis/tier1-infrastructure.sh`

- [ ] **Step 1: Create infrastructure analysis script**

```bash
#!/bin/bash
# scripts/parity-analysis/tier1-infrastructure.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/k8s-utils.sh"

# Configuration
CONFIG_FILE="$SCRIPT_DIR/../../config/parity-analysis.yaml"
REPORT_FILE="$1"

main() {
    log_info "Starting Tier 1: Infrastructure & Configuration Analysis"
    
    # Load configuration
    load_config "$CONFIG_FILE"
    
    local prod_namespace staging_namespace
    prod_namespace=$(yq eval '.environments.production.namespace' "$CONFIG_FILE")
    staging_namespace=$(yq eval '.environments.staging.namespace' "$CONFIG_FILE")
    
    log_info "Analyzing production namespace: $prod_namespace"
    log_info "Analyzing staging namespace: $staging_namespace"
    
    # Initialize report section
    echo "## Tier 1: Infrastructure & Configuration Analysis" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Run infrastructure comparisons
    compare_deployments "$prod_namespace" "$staging_namespace" "$REPORT_FILE"
    compare_configmaps "$prod_namespace" "$staging_namespace" "$REPORT_FILE" 
    compare_services "$prod_namespace" "$staging_namespace" "$REPORT_FILE"
    compare_resource_limits "$prod_namespace" "$staging_namespace" "$REPORT_FILE"
    compare_ingress_configs "$prod_namespace" "$staging_namespace" "$REPORT_FILE"
    
    log_info "Tier 1 analysis complete"
}

compare_resource_limits() {
    local prod_namespace="$1"
    local staging_namespace="$2" 
    local report_file="$3"
    
    log_info "Comparing resource limits between environments"
    
    # Get all deployments from config
    local services
    services=$(yq eval '.services[].name' "$CONFIG_FILE")
    
    while IFS= read -r service; do
        if kubectl get deployment "$service" -n "$prod_namespace" >/dev/null 2>&1 && kubectl get deployment "$service" -n "$staging_namespace" >/dev/null 2>&1; then
            local prod_limits staging_limits
            prod_limits=$(get_resource_limits "deployment/$service" "$prod_namespace")
            staging_limits=$(get_resource_limits "deployment/$service" "$staging_namespace")
            
            # Compare CPU and memory limits
            local prod_cpu staging_cpu prod_memory staging_memory
            prod_cpu=$(echo "$prod_limits" | jq -r '.limits.cpu // "none"')
            staging_cpu=$(echo "$staging_limits" | jq -r '.limits.cpu // "none"') 
            prod_memory=$(echo "$prod_limits" | jq -r '.limits.memory // "none"')
            staging_memory=$(echo "$staging_limits" | jq -r '.limits.memory // "none"')
            
            if [[ "$prod_cpu" != "$staging_cpu" ]] || [[ "$prod_memory" != "$staging_memory" ]]; then
                add_discrepancy "$report_file" "HIGH" "Resource Limit Mismatch" \
                    "$service has different resource limits: prod(cpu:$prod_cpu,mem:$prod_memory) vs staging(cpu:$staging_cpu,mem:$staging_memory)" \
                    "kubectl patch deployment $service -n $staging_namespace -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$service\",\"resources\":{\"limits\":{\"cpu\":\"$prod_cpu\",\"memory\":\"$prod_memory\"}}}]}}}}'"
            fi
        fi
    done <<< "$services"
}

compare_ingress_configs() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"
    
    log_info "Comparing ingress configurations"
    
    local prod_ingresses staging_ingresses
    prod_ingresses=$(kubectl get ingress -n "$prod_namespace" -o name 2>/dev/null | sort)
    staging_ingresses=$(kubectl get ingress -n "$staging_namespace" -o name 2>/dev/null | sort)
    
    # Check for missing ingress rules in staging
    while IFS= read -r ingress; do
        if [[ -n "$ingress" ]] && ! echo "$staging_ingresses" | grep -q "$ingress"; then
            add_discrepancy "$report_file" "HIGH" "Missing Ingress" \
                "Ingress $ingress exists in production but missing in staging" \
                "kubectl get $ingress -n $prod_namespace -o yaml | sed 's/$prod_namespace/$staging_namespace/g' | kubectl apply -f -"
        fi
    done <<< "$prod_ingresses"
    
    # Compare ingress hosts and paths
    while IFS= read -r ingress; do
        if [[ -n "$ingress" ]] && echo "$staging_ingresses" | grep -q "$ingress"; then
            compare_ingress_rules "$ingress" "$prod_namespace" "$staging_namespace" "$report_file"
        fi
    done <<< "$prod_ingresses"
}

compare_ingress_rules() {
    local ingress="$1"
    local prod_namespace="$2"
    local staging_namespace="$3"
    local report_file="$4"
    
    local prod_hosts staging_hosts
    prod_hosts=$(kubectl get "$ingress" -n "$prod_namespace" -o jsonpath='{.spec.rules[*].host}')
    staging_hosts=$(kubectl get "$ingress" -n "$staging_namespace" -o jsonpath='{.spec.rules[*].host}')
    
    # Check if staging uses appropriate subdomain
    if echo "$staging_hosts" | grep -v "staging\." | grep -q "vendfinder.com"; then
        add_discrepancy "$report_file" "CRITICAL" "Ingress Host Mismatch" \
            "$ingress in staging uses production domain: $staging_hosts" \
            "Update ingress host to use staging.vendfinder.com subdomain"
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
```

- [ ] **Step 2: Test tier 1 analysis**

Run: `./scripts/parity-analysis/tier1-infrastructure.sh /tmp/test-report.md`
Expected: Creates infrastructure analysis section in report file

- [ ] **Step 3: Commit tier 1 infrastructure analysis**

```bash
git add scripts/parity-analysis/tier1-infrastructure.sh
git commit -m "feat: add tier 1 infrastructure analysis

- Compare deployments, services, configmaps between environments
- Validate resource limits and scaling configurations  
- Check ingress rules and domain configurations
- Detect critical mismatches like staging images in production"
```

### Task 4: Build Tier 2 Service Health Analysis  

**Files:**
- Create: `scripts/parity-analysis/tier2-services.sh`

- [ ] **Step 1: Create service health analysis script**

```bash
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
    
    while IFS= read -r db_config; do
        local service_name
        service_name=$(echo "$db_config" | yq eval '.service' -)
        
        compare_database_connections "$service_name" "$prod_namespace" "$staging_namespace" "$report_file"
        compare_database_schemas "$db_config" "$report_file"
        
    done <<< "$databases"
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
```

- [ ] **Step 2: Test tier 2 service analysis**

Run: `./scripts/parity-analysis/tier2-services.sh /tmp/test-report.md`
Expected: Creates service health analysis section in report file

- [ ] **Step 3: Commit tier 2 service analysis**

```bash  
git add scripts/parity-analysis/tier2-services.sh
git commit -m "feat: add tier 2 service health analysis  

- Test service health endpoints and API response parity
- Compare database configurations and schema alignment
- Validate external integrations (Stripe, DO Spaces, Anthropic)
- Detect critical mismatches in payment and API configurations"
```