# Staging Deployment & Testing Guide

This document explains how to use the staging deployment workflow, E2E testing infrastructure, and rollback capabilities.

## Overview

The staging deployment workflow (`.github/workflows/staging-deploy.yml`) provides:

- Automated deployment to staging environment
- E2E testing verification
- Automatic rollback on deployment failures
- Manual rollback capabilities

## E2E Testing

### Setup

The E2E testing infrastructure uses Playwright and is configured to run tests against the staging environment.

**Configuration Files:**

- `playwright.config.js` - Main Playwright configuration
- `tests/e2e/staging.test.js` - Staging environment verification tests
- `tests/e2e/global-setup.js` - Test environment setup

**Package Scripts:**

```bash
npm run test:e2e                 # Run E2E tests
npm run install-playwright       # Install Playwright browsers
```

### Running Tests

**Against Local Development:**

```bash
npm run dev                      # Start local server
npm run test:e2e                 # Run tests against localhost:3000
```

**Against Staging:**

```bash
export PLAYWRIGHT_BASE_URL="https://staging.vendfinder.com"
npm run test:e2e
```

### Test Coverage

The staging E2E tests verify:

- Homepage loads successfully
- API health endpoint responds correctly
- Navigation functionality
- User authentication flow accessibility
- Search functionality
- Responsive layout on mobile
- Footer contains essential links
- No critical JavaScript errors
- Basic performance metrics

## Automatic Deployment & Rollback

### Deployment Trigger

The staging deployment workflow triggers on:

- Direct pushes to `main` branch
- Successful completion of the CI Pipeline workflow

### Deployment Process

1. **Version Generation** - Creates staging-specific version tags
2. **Image Tag Updates** - Updates Kubernetes image tags
3. **Deployment** - Applies manifests to staging cluster
4. **Rollout Wait** - Waits for all deployments to complete
5. **Smoke Tests** - Basic health checks with retries
6. **E2E Tests** - Full Playwright test suite
7. **Health Check** - Comprehensive post-deployment verification
8. **Success/Failure Handling** - Notifications and cleanup

### Automatic Rollback

If any step fails (smoke tests, E2E tests, or health checks), the workflow automatically:

1. Identifies the previous successful deployment revision
2. Rolls back all staging services to that revision
3. Waits for rollback completion
4. Verifies rollback health
5. Annotates deployment with rollback information

## Manual Rollback

### Using the Rollback Script

The `scripts/rollback-staging.sh` script provides manual rollback capabilities:

**View Available Revisions:**

```bash
npm run rollback:staging
# or
./scripts/rollback-staging.sh
```

**Rollback to Previous Revision:**

```bash
npm run rollback:staging previous
# or
./scripts/rollback-staging.sh previous
```

**Rollback to Specific Revision:**

```bash
npm run rollback:staging 3
# or
./scripts/rollback-staging.sh 3
```

### Rollback Process

The script performs:

1. **State Capture** - Records current deployment states
2. **Rollback Execution** - Rolls back all staging services
3. **Status Monitoring** - Waits for rollback completion
4. **Health Verification** - Comprehensive health checks
5. **Annotation Updates** - Records rollback metadata

## Monitoring & Debugging

### Deployment Annotations

All deployments are annotated with metadata:

- `vendfinder.com/deployed-version` - Deployment version
- `vendfinder.com/deployed-at` - Deployment timestamp
- `vendfinder.com/deployed-by` - Deployment source
- `vendfinder.com/commit-sha` - Git commit SHA
- `vendfinder.com/deployment-status` - Current status
- `vendfinder.com/rollback-*` - Rollback information

### Health Check Endpoints

**Main Application:**

```
https://staging.vendfinder.com/
```

**API Health:**

```
https://staging.vendfinder.com/api/health
```

### Debugging Failed Deployments

**Check Pod Status:**

```bash
kubectl get pods -n vendfinder -l environment=staging
```

**View Pod Logs:**

```bash
kubectl logs -n vendfinder -l app=vendfinder,environment=staging --tail=100
```

**Check Deployment History:**

```bash
kubectl rollout history deployment/staging-frontend -n vendfinder
```

**View Deployment Annotations:**

```bash
kubectl get deployment staging-frontend -n vendfinder -o yaml | grep annotations -A 10
```

## Environment Variables

The following environment variables are used:

**GitHub Actions:**

- `KUBECONFIG` - Kubernetes cluster configuration (base64 encoded)
- `SLACK_WEBHOOK_URL` - Optional Slack notifications
- `PLAYWRIGHT_BASE_URL` - E2E test target URL

**Local Testing:**

- `PLAYWRIGHT_BASE_URL` - Override test target URL

## Troubleshooting

### Common Issues

**E2E Tests Failing:**

1. Check staging environment health manually
2. Review test output for specific failures
3. Ensure all required services are running
4. Check for network connectivity issues

**Rollback Not Working:**

1. Verify kubectl configuration
2. Check if previous revisions exist
3. Ensure proper permissions for deployment management
4. Review pod and deployment status

**Health Checks Failing:**

1. Check service endpoints manually
2. Verify DNS resolution
3. Check for certificate issues
4. Review load balancer configuration

### Support

For deployment issues:

1. Check GitHub Actions workflow logs
2. Review Kubernetes cluster status
3. Check service health endpoints
4. Contact DevOps team if infrastructure issues persist
