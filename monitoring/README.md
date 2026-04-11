# VendFinder Inventory & Sales Monitoring

Complete Prometheus + Grafana monitoring solution for VendFinder marketplace inventory and sales data.

## 🎯 What This Monitors

### 📦 Inventory Metrics
- **Products by vendor** - Count of active/inactive products per vendor
- **Product categories** - Breakdown by sneakers, electronics, streetwear, etc.
- **Inventory levels** - Stock counts by product and size
- **Product status** - Active, sold, expired listings

### 💰 Sales Metrics  
- **Revenue by vendor** - Total earnings per vendor in real-time
- **Sales counts** - Number of items sold per vendor/product
- **Order statuses** - Processing, shipped, delivered breakdowns
- **Payment tracking** - Succeeded, pending, failed payment counts

### 🔍 Vendor Analytics
- **Top selling products** - Most popular items across vendors
- **Vendor performance** - Revenue, sales volume, order fulfillment
- **Category trends** - Which product categories are most active
- **Vendor comparisons** - Side-by-side vendor metrics

### ⚡ System Metrics
- **HTTP requests** - API endpoint performance and usage
- **Database queries** - Query duration and performance
- **Container metrics** - CPU, memory, disk usage
- **System health** - Service uptime and availability

## 🚀 Quick Start

### 1. Setup (One-time)
```bash
# Make setup script executable
chmod +x monitoring/setup-monitoring.sh

# Run the setup
./monitoring/setup-monitoring.sh
```

### 2. Access Dashboards
- **Grafana Dashboard:** http://localhost:3001
  - Username: `admin`
  - Password: `vendfinder123`
- **Prometheus:** http://localhost:9090
- **Metrics Endpoint:** http://localhost:9091/metrics

### 3. View Your Data
The main **"VendFinder Inventory & Sales Dashboard"** will auto-load with:
- Revenue charts by vendor
- Product inventory breakdowns
- Sales performance tables
- Order and payment status pie charts

## 📊 Dashboard Panels

### Revenue & Sales
- **Total Revenue by Vendor** - Real-time earnings
- **Top Selling Products** - Most popular items
- **Vendor Performance Table** - Complete vendor analytics

### Inventory Management
- **Products by Category** - Breakdown by product type
- **Product Inventory Heatmap** - Stock levels visualization
- **Inventory Status** - Active vs inactive products

### Order Tracking
- **Orders by Status** - Processing, shipped, delivered
- **Payments by Status** - Payment success rates
- **Order Fulfillment** - Time to ship metrics

### System Performance
- **HTTP Request Rate** - API usage monitoring
- **Database Performance** - Query duration tracking
- **Container Metrics** - Resource usage

## 🛠️ Management Commands

```bash
# Start monitoring
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d

# Stop monitoring  
docker compose -f docker-compose.monitoring.yml down

# Restart monitoring
docker compose -f docker-compose.monitoring.yml restart

# View logs
docker compose -f docker-compose.monitoring.yml logs -f

# Force metrics collection
curl -X POST http://localhost:9091/collect

# Check metrics collector health
curl http://localhost:9091/health
```

## 📈 Available Metrics

### Vendor Metrics
- `vendfinder_vendor_revenue_dollars` - Revenue by vendor
- `vendfinder_vendor_products_total` - Product counts by vendor/category
- `vendfinder_vendor_sales_total` - Sales counts by vendor/product
- `vendfinder_orders_by_status` - Order status counts
- `vendfinder_payments_by_status` - Payment status counts
- `vendfinder_product_inventory` - Product stock levels

### System Metrics
- `vendfinder_http_requests_total` - HTTP request counts
- `vendfinder_http_request_duration_seconds` - Request latencies
- `vendfinder_db_query_duration_seconds` - Database query times

### Standard Metrics
- `up` - Service availability
- `process_cpu_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_*` - Node.js specific metrics

## 🔧 Configuration

### Metrics Collection Interval
```bash
# Change collection frequency (default: 30 seconds)
export METRICS_COLLECT_INTERVAL=60000  # 60 seconds
```

### Database Connections
```bash
# Override database URLs if needed
export ORDER_DB_URL=postgresql://user:pass@host:port/order_db
export PRODUCT_DB_URL=postgresql://user:pass@host:port/product_db  
export USER_DB_URL=postgresql://user:pass@host:port/user_db
```

### Custom Dashboards
- Import additional dashboards via Grafana UI
- Dashboards auto-save to `grafana-data` volume
- Add custom panels using the metrics above

## 🎯 Use Cases

### For Business Owners
- **Revenue Tracking** - See real-time earnings per vendor
- **Inventory Management** - Monitor stock levels and categories
- **Sales Performance** - Identify top products and vendors
- **Order Fulfillment** - Track shipping and delivery metrics

### For Developers
- **Performance Monitoring** - API response times and database queries
- **System Health** - Container resource usage and uptime
- **Error Tracking** - Failed requests and database errors
- **Capacity Planning** - Traffic patterns and resource usage

### For Vendors
- **Personal Dashboards** - Filter by vendor to see individual performance
- **Product Analytics** - Which items sell best in which categories
- **Order Management** - Track orders from purchase to delivery
- **Revenue Optimization** - Identify high-performing product categories

## 🔒 Security Notes

- Grafana admin password is configurable via environment variable
- Database connections use internal Docker networking
- Metrics contain business data - restrict access appropriately
- Consider adding authentication for production deployments

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check Docker network
docker network ls | grep vendfinder-net

# Check logs
docker compose -f monitoring/docker-compose.monitoring.yml logs

# Restart everything
docker compose -f monitoring/docker-compose.monitoring.yml restart
```

### No Data in Dashboards
```bash
# Check VendFinder services are running
docker ps | grep vendfinder

# Force metrics collection
curl -X POST http://localhost:9091/collect

# Check metrics endpoint
curl http://localhost:9091/metrics
```

### Database Connection Issues
```bash
# Verify database containers are running
docker ps | grep postgres

# Check database connectivity
docker exec vendfinder-inventory-metrics curl -f http://localhost:9091/health
```

## 🔄 Updates

The monitoring system is designed to be **non-breaking**:
- ✅ Doesn't modify existing VendFinder code
- ✅ Uses separate ports to avoid conflicts  
- ✅ Can be started/stopped independently
- ✅ Connects to existing databases read-only

## 📚 More Information

- **Prometheus Docs:** https://prometheus.io/docs/
- **Grafana Docs:** https://grafana.com/docs/
- **prom-client (Node.js):** https://github.com/siimon/prom-client
- **VendFinder Metrics:** http://localhost:9091/metrics (raw data)