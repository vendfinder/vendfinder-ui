# VendFinder Kubernetes Monitoring

Complete Prometheus + Grafana monitoring system for VendFinder marketplace deployed to Kubernetes under the `vendfinder` namespace.

## 🎯 What This Deploys

### 📊 Monitoring Stack
- **Prometheus** - Metrics collection and storage
- **Grafana** - Dashboard visualization and analytics  
- **Inventory Metrics Collector** - VendFinder-specific metrics
- **Ingress Controller** - External access via VendFinder URLs

### 📈 Monitored Data
- **Vendor Analytics** - Revenue, sales, inventory by vendor
- **Product Intelligence** - Stock levels, categories, performance
- **Order Pipeline** - Processing, shipping, delivery tracking
- **Payment Monitoring** - Success rates, failure analysis
- **System Health** - API performance, database queries

## 🚀 Deployment

### Prerequisites
- Kubernetes cluster with kubectl access
- NGINX Ingress Controller (optional, for external access)
- Persistent Volume support for data storage

### Quick Deploy
```bash
# Navigate to monitoring directory
cd k8s/monitoring

# Make deploy script executable
chmod +x deploy-monitoring.sh

# Deploy to vendfinder namespace
./deploy-monitoring.sh
```

### Manual Deployment
```bash
# Apply in order
kubectl apply -f namespace.yaml
kubectl apply -f prometheus.yaml
kubectl apply -f grafana.yaml
kubectl apply -f inventory-metrics.yaml
kubectl apply -f ingress.yaml
kubectl apply -f service-monitor.yaml
```

## 🌐 Access Methods

### Option 1: Port Forwarding (Recommended for Development)
```bash
# Grafana Dashboard
kubectl port-forward svc/grafana 3001:3000 -n vendfinder
# Access: http://localhost:3001

# Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n vendfinder  
# Access: http://localhost:9090

# Inventory Metrics
kubectl port-forward svc/inventory-metrics 9091:9091 -n vendfinder
# Access: http://localhost:9091/metrics
```

### Option 2: Ingress (Production)
Configure your domain and access via:
- **Monitoring Dashboard:** `https://your-domain.com/admin/monitoring/`
- **Prometheus:** `https://your-domain.com/admin/prometheus/`
- **Raw Metrics:** `https://your-domain.com/admin/metrics/`

### Login Credentials
- **Username:** `admin`
- **Password:** `vendfinder123`

## 📊 Monitoring Dashboards

### Main VendFinder Dashboard
Pre-configured dashboard showing:
- Total revenue by vendor
- Product inventory breakdown  
- Top selling products
- Order status distribution
- Payment success rates
- Vendor performance table

### Custom Metrics Available
- `vendfinder_vendor_revenue_dollars` - Revenue by vendor
- `vendfinder_vendor_products_total` - Product counts
- `vendfinder_vendor_sales_total` - Sales by product
- `vendfinder_orders_by_status` - Order pipeline
- `vendfinder_payments_by_status` - Payment tracking

## 🔧 Configuration

### Resource Requirements
```yaml
# Prometheus
requests: { memory: "512Mi", cpu: "200m" }
limits: { memory: "1Gi", cpu: "500m" }

# Grafana  
requests: { memory: "256Mi", cpu: "100m" }
limits: { memory: "512Mi", cpu: "300m" }

# Metrics Collector
requests: { memory: "128Mi", cpu: "50m" }
limits: { memory: "256Mi", cpu: "200m" }
```

### Persistent Storage
- **Prometheus:** 10Gi for metrics data
- **Grafana:** 5Gi for dashboards and config

### Database Connections
Update the following in `inventory-metrics.yaml`:
```yaml
ORDER_DB_URL: postgresql://user:pass@order-db.vendfinder.svc.cluster.local:5432/order_db
PRODUCT_DB_URL: postgresql://user:pass@product-db.vendfinder.svc.cluster.local:5432/product_db
USER_DB_URL: postgresql://user:pass@user-db.vendfinder.svc.cluster.local:5432/user_db
```

## 🛠️ Management Commands

### View Status
```bash
# All monitoring pods
kubectl get pods -n vendfinder -l component=monitoring

# Services
kubectl get svc -n vendfinder

# Ingress
kubectl get ingress -n vendfinder

# Persistent volumes
kubectl get pvc -n vendfinder
```

### Logs
```bash
# Grafana logs
kubectl logs -f deployment/grafana -n vendfinder

# Prometheus logs  
kubectl logs -f deployment/prometheus -n vendfinder

# Metrics collector logs
kubectl logs -f deployment/inventory-metrics -n vendfinder
```

### Scaling
```bash
# Scale Grafana for high availability
kubectl scale deployment/grafana --replicas=2 -n vendfinder

# Scale Prometheus (usually keep at 1)
kubectl scale deployment/prometheus --replicas=1 -n vendfinder
```

### Updates
```bash
# Update configuration
kubectl apply -f grafana.yaml

# Rolling restart
kubectl rollout restart deployment/grafana -n vendfinder
kubectl rollout restart deployment/prometheus -n vendfinder
kubectl rollout restart deployment/inventory-metrics -n vendfinder
```

## 🔒 Security

### Network Policies
- Monitoring pods can only communicate within vendfinder namespace
- Database access restricted to required PostgreSQL ports
- External access controlled via Ingress rules

### Secrets Management
- Grafana admin credentials stored in Kubernetes Secret
- Database passwords should use Secret references (update as needed)
- Consider using external secret management (Vault, etc.)

## 📈 Customization

### Adding New Metrics
1. Update `inventory-metrics-collector.js` in the ConfigMap
2. Add new Prometheus metrics definitions
3. Create corresponding Grafana dashboard panels
4. Apply updated configuration: `kubectl apply -f inventory-metrics.yaml`

### Custom Dashboards
1. Import dashboards via Grafana UI
2. Export dashboard JSON
3. Add to `grafana-dashboard` ConfigMap
4. Apply: `kubectl apply -f grafana.yaml`

### Data Sources
Add additional data sources by updating the `grafana-datasource` ConfigMap.

## 🔄 Backup & Recovery

### Prometheus Data
```bash
# Backup Prometheus data
kubectl exec deployment/prometheus -n vendfinder -- tar czf /tmp/prometheus-backup.tar.gz /prometheus
kubectl cp vendfinder/deployment/prometheus:/tmp/prometheus-backup.tar.gz ./prometheus-backup.tar.gz
```

### Grafana Configuration
```bash
# Backup Grafana data
kubectl exec deployment/grafana -n vendfinder -- tar czf /tmp/grafana-backup.tar.gz /var/lib/grafana
kubectl cp vendfinder/deployment/grafana:/tmp/grafana-backup.tar.gz ./grafana-backup.tar.gz
```

## ❌ Cleanup

### Remove Monitoring
```bash
# Delete all monitoring resources
kubectl delete -f . -n vendfinder

# Or delete specific components
kubectl delete deployment prometheus grafana inventory-metrics -n vendfinder
kubectl delete svc prometheus grafana inventory-metrics -n vendfinder
kubectl delete pvc prometheus-storage grafana-storage -n vendfinder
```

### Keep Namespace
```bash
# Delete only monitoring components, keep vendfinder namespace
kubectl delete -f prometheus.yaml grafana.yaml inventory-metrics.yaml ingress.yaml service-monitor.yaml
```

## 🎯 Use Cases

### For Sally's Dashboard Issue
Monitor her corrected vendor data:
- $298 Gucci bag revenue (not Wolf Grey sneakers)
- Order status: Processing → Shipped → Delivered
- Payment confirmation: Succeeded
- Inventory accuracy verification

### Business Intelligence  
- Compare vendor performance and revenue
- Track product category trends
- Monitor payment success rates
- Identify inventory bottlenecks
- Analyze order fulfillment efficiency

### System Operations
- API endpoint performance monitoring
- Database query optimization
- Resource usage and capacity planning
- Service health and uptime tracking

## 📞 Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n vendfinder
kubectl logs <pod-name> -n vendfinder
```

**Persistent Volume issues:**
```bash
kubectl get pvc -n vendfinder
kubectl describe pvc <pvc-name> -n vendfinder
```

**Ingress not working:**
```bash
kubectl get ingress -n vendfinder
kubectl describe ingress vendfinder-monitoring -n vendfinder
```

**Database connectivity:**
```bash
kubectl exec -it deployment/inventory-metrics -n vendfinder -- sh
# Test database connections from within the pod
```

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Kubernetes Monitoring Best Practices](https://kubernetes.io/docs/concepts/cluster-administration/monitoring/)
- [VendFinder Metrics Reference](./metrics-reference.md)

---

**Your VendFinder inventory and sales monitoring is now running in Kubernetes under the vendfinder namespace!** 🚀