#!/bin/bash
# scripts/parity-analysis/lib/db-utils.sh

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

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