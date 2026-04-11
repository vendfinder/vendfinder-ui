# VendFinder HTTPS Monitoring Setup

Complete guide for deploying VendFinder monitoring with proper domain certificates and HTTPS access.

## 🎯 What This Provides

✅ **HTTPS access to monitoring** via your VendFinder domain  
✅ **No port forwarding required** - access through your domain  
✅ **Proper TLS certificates** - automated or manual  
✅ **Production-ready security** - SSL redirect, security headers  
✅ **Multiple access methods** - main domain + optional subdomain  

## 🚀 Quick Setup (3 Steps)

### Step 1: Configure Your Domain
```bash
cd k8s/monitoring
./setup-domain.sh
```
This interactive script will:
- Set your VendFinder domain
- Choose certificate method (cert-manager/manual/existing)
- Update all configuration files
- Create deployment script

### Step 2: Prepare Certificates (Choose One)

#### Option A: Automated with cert-manager (Recommended)
```bash
# Install cert-manager if not already installed
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
```

#### Option B: Manual certificates
```bash
# Place your certificate files in the monitoring directory:
# - vendfinder.crt (your certificate)
# - vendfinder.key (your private key)

# OR create the secret directly:
kubectl create secret tls vendfinder-tls-secret \
  --cert=path/to/your-cert.crt \
  --key=path/to/your-key.key \
  --namespace=vendfinder
```

#### Option C: Existing certificate
If you already have a TLS secret in the vendfinder namespace, just proceed to step 3.

### Step 3: Deploy with HTTPS
```bash
./deploy-with-domain.sh
```

## 🌐 Access Your Monitoring

After deployment, access via:

### Main Domain Access
- **📊 Monitoring Dashboard:** `https://yourdomain.com/admin/monitoring/`
- **📈 Prometheus:** `https://yourdomain.com/admin/prometheus/`
- **🔍 Raw Metrics:** `https://yourdomain.com/admin/metrics/`

### Optional Subdomain Access
- **📊 Dedicated Monitoring:** `https://monitoring.yourdomain.com/`

### Login Credentials
- **Username:** `admin`
- **Password:** `vendfinder123`

## 📁 Files Created/Updated

### HTTPS Configuration
- `ingress-https.yaml` - HTTPS ingress with TLS termination
- `grafana-https.yaml` - Grafana configured for sub-path access
- `tls-cert-manager.yaml` - Automated certificate management
- `tls-manual-cert.yaml` - Manual certificate template

### Deployment Scripts
- `setup-domain.sh` - Interactive domain configuration
- `deploy-https.sh` - HTTPS deployment script
- `deploy-with-domain.sh` - Generated deployment script with your settings

## 🔧 Advanced Configuration

### Custom DNS Providers
Update `tls-cert-manager.yaml` to use your DNS provider for DNS-01 challenges:

```yaml
# Example for Cloudflare
solvers:
- dns01:
    cloudflare:
      email: your-email@domain.com
      apiTokenSecretRef:
        name: cloudflare-api-token
        key: api-token
```

Supported providers: Cloudflare, Route53, Google Cloud DNS, Azure DNS, and more.

### Wildcard Certificates
For wildcard certificates (*.yourdomain.com), use DNS-01 challenge:

```yaml
dnsNames:
- yourdomain.com
- '*.yourdomain.com'  # Wildcard for all subdomains
```

### Security Headers
The ingress includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 🛠️ Management Commands

### Check Certificate Status
```bash
# cert-manager certificates
kubectl get certificate -n vendfinder
kubectl describe certificate vendfinder-tls -n vendfinder

# TLS secrets
kubectl get secret vendfinder-tls-secret -n vendfinder
```

### View Ingress Status
```bash
kubectl get ingress -n vendfinder
kubectl describe ingress vendfinder-monitoring-https -n vendfinder
```

### Test HTTPS Access
```bash
# Test monitoring dashboard
curl -I https://yourdomain.com/admin/monitoring/

# Test certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Update Configuration
```bash
# Update domain or certificates
./setup-domain.sh

# Redeploy with new configuration
./deploy-with-domain.sh
```

## 🔒 Security Best Practices

### Strong Passwords
Change the default Grafana password:
```bash
kubectl patch secret grafana-admin -n vendfinder -p '{"data":{"password":"'$(echo -n "your-strong-password" | base64)'"}}'
kubectl rollout restart deployment/grafana -n vendfinder
```

### Network Policies
Network policies are included to restrict traffic to the vendfinder namespace.

### RBAC Integration
The monitoring components work with Kubernetes RBAC. Create appropriate roles for team access:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: vendfinder
  name: monitoring-viewer
rules:
- apiGroups: [""]
  resources: ["services", "pods", "configmaps"]
  verbs: ["get", "list", "watch"]
```

## 🚨 Troubleshooting

### Certificate Issues
```bash
# Check certificate status
kubectl describe certificate vendfinder-tls -n vendfinder

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Manual certificate verification
kubectl get secret vendfinder-tls-secret -n vendfinder -o yaml
```

### Ingress Not Working
```bash
# Check ingress controller
kubectl get svc -n ingress-nginx

# Check ingress logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Verify ingress configuration
kubectl describe ingress vendfinder-monitoring-https -n vendfinder
```

### Grafana Access Issues
```bash
# Check Grafana logs
kubectl logs -f deployment/grafana -n vendfinder

# Test Grafana service directly
kubectl port-forward svc/grafana 3000:3000 -n vendfinder

# Check Grafana configuration
kubectl get configmap grafana-config -n vendfinder -o yaml
```

### DNS Issues
```bash
# Verify DNS resolution
nslookup yourdomain.com

# Check ingress IP
kubectl get ingress vendfinder-monitoring-https -n vendfinder

# Test without DNS (using IP)
curl -H "Host: yourdomain.com" https://INGRESS_IP/admin/monitoring/
```

## 📊 Monitoring Features

### Vendor Analytics
- Revenue tracking by vendor and product
- Product inventory by category
- Sales performance metrics
- Order status monitoring
- Payment success rates

### System Monitoring
- Kubernetes cluster metrics
- Application performance
- Database connectivity
- API response times

### Custom Dashboards
- Pre-configured VendFinder dashboard
- Ability to create custom panels
- Alert rule configuration
- Data source management

## 🔄 Updates and Maintenance

### Certificate Renewal
cert-manager automatically renews certificates. For manual certificates:
```bash
# Update certificate secret
kubectl create secret tls vendfinder-tls-secret \
  --cert=new-cert.crt \
  --key=new-key.key \
  --namespace=vendfinder \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Grafana Updates
```bash
# Update Grafana version
kubectl patch deployment grafana -n vendfinder -p '{"spec":{"template":{"spec":{"containers":[{"name":"grafana","image":"grafana/grafana:10.2.0"}]}}}}'
```

### Configuration Updates
```bash
# Update Grafana configuration
kubectl apply -f grafana-https.yaml

# Update ingress rules
kubectl apply -f ingress-https.yaml
```

## 📈 Scaling

### High Availability
```bash
# Scale Grafana for HA
kubectl scale deployment/grafana --replicas=2 -n vendfinder

# Use external database for Grafana
# Update grafana-https.yaml with external DB configuration
```

### Performance Tuning
- Increase resource limits for high load
- Use external storage for Prometheus
- Configure Grafana caching
- Set up Prometheus federation for multiple clusters

---

**Your VendFinder monitoring is now accessible via HTTPS at your domain!** 🔐🚀