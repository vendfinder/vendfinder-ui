# VendFinder DOKS Cluster Optimization Summary

**Cluster:** DigitalOcean Kubernetes (DOKS) v1.34.1, nyc3
**Nodes:** 4x s-2vcpu-4gb (upgrade plan: s-4vcpu-8gb with autoscaling 3-6)
**Date:** 2026-03-07

---

## 1. Files Changed / Created

### Existing file modified

| File                        | Change                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `k8s/staging/frontend.yaml` | Added `preferredDuringSchedulingIgnoredDuringExecution` nodeAffinity for `role=gateway` |

### New manifest files created

#### Production (`k8s/prod/`)

| File                     | Workload                | Resources (req/limit)          | Node Affinity                          |
| ------------------------ | ----------------------- | ------------------------------ | -------------------------------------- |
| `order-service.yaml`     | Deployment (2 replicas) | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app` + podAntiAffinity |
| `user-service.yaml`      | Deployment (1 replica)  | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app`                   |
| `vendor-service.yaml`    | Deployment (1 replica)  | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app`                   |
| `product-service.yaml`   | Deployment (1 replica)  | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app`                   |
| `search-service.yaml`    | Deployment (1 replica)  | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app`                   |
| `websocket-service.yaml` | Deployment (1 replica)  | 100m/500m CPU, 128Mi/256Mi mem | required: `prod-app`                   |
| `chat-service.yaml`      | Deployment (1 replica)  | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app`                   |
| `review-service.yaml`    | Deployment (1 replica)  | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app`                   |
| `analytics-service.yaml` | Deployment (1 replica)  | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app`                   |
| `admin-service.yaml`     | Deployment (1 replica)  | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app`                   |
| `api-gateway.yaml`       | Deployment (1 replica)  | 150m/500m CPU, 256Mi/512Mi mem | required: `prod-app`                   |
| `frontend.yaml`          | Deployment (1 replica)  | 100m/500m CPU, 128Mi/512Mi mem | required: `prod-app`                   |
| `grafana.yaml`           | Deployment (1 replica)  | 100m/500m CPU, 128Mi/256Mi mem | required: `prod-app`                   |
| `redis.yaml`             | Deployment (1 replica)  | 100m/250m CPU, 128Mi/256Mi mem | required: `prod-app`                   |
| `chat-db.yaml`           | Deployment (1 replica)  | 100m/500m CPU, 256Mi/512Mi mem | required: `prod-data`                  |
| `order-db.yaml`          | Deployment (1 replica)  | 100m/500m CPU, 256Mi/512Mi mem | required: `prod-data`                  |
| `product-db.yaml`        | Deployment (1 replica)  | 100m/500m CPU, 256Mi/512Mi mem | required: `prod-data`                  |
| `vendor-db.yaml`         | Deployment (1 replica)  | 100m/500m CPU, 256Mi/512Mi mem | required: `prod-data`                  |
| `prometheus.yaml`        | Deployment (1 replica)  | 250m/1000m CPU, 512Mi/2Gi mem  | required: `prod-data`                  |
| `elasticsearch.yaml`     | Deployment (1 replica)  | 500m/1000m CPU, 1Gi/2Gi mem    | required: `prod-heavy`                 |
| `analytics-db.yaml`      | Deployment (1 replica)  | 100m/500m CPU, 256Mi/1Gi mem   | required: `prod-heavy`                 |

#### Staging (`k8s/staging/`)

| File                       | Workload               | Resources (req/limit)                     | Node Affinity                |
| -------------------------- | ---------------------- | ----------------------------------------- | ---------------------------- |
| `frontend.yaml` (modified) | Deployment (1 replica) | 100m/500m CPU, 128Mi/512Mi mem (existing) | preferred: `gateway` (added) |
| `admin-service.yaml`       | Deployment (1 replica) | 50m/200m CPU, 64Mi/128Mi mem              | preferred: `gateway`         |
| `websocket-service.yaml`   | Deployment (1 replica) | 50m/200m CPU, 64Mi/128Mi mem              | preferred: `gateway`         |
| `chat-db.yaml`             | Deployment (1 replica) | 50m/200m CPU, 128Mi/256Mi mem             | preferred: `gateway`         |
| `order-db.yaml`            | Deployment (1 replica) | 50m/200m CPU, 128Mi/256Mi mem             | preferred: `gateway`         |
| `product-db.yaml`          | Deployment (1 replica) | 50m/200m CPU, 128Mi/256Mi mem             | preferred: `gateway`         |
| `vendor-db.yaml`           | Deployment (1 replica) | 50m/200m CPU, 128Mi/256Mi mem             | preferred: `gateway`         |
| `review-db.yaml`           | Deployment (1 replica) | 50m/200m CPU, 128Mi/256Mi mem             | preferred: `gateway`         |
| `user-db.yaml`             | Deployment (1 replica) | 50m/200m CPU, 128Mi/256Mi mem             | preferred: `gateway`         |

#### Gateway patches (`k8s/gateway/`)

| File                       | Target                               | Change                                                     |
| -------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `envoy-gateway-patch.yaml` | envoy-gateway (envoy-gateway-system) | Added 512Mi memory limit + required nodeAffinity `gateway` |
| `envoy-proxy-patch.yaml`   | EnvoyProxy CRD config                | Added 512Mi memory limit + required nodeAffinity `gateway` |
| `ingress-nginx-patch.yaml` | ingress-nginx-controller             | Added required nodeAffinity `gateway`                      |

### Scripts created

| File                          | Purpose                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `scripts/label-nodes.sh`      | Labels nodes with role={prod-data,prod-app,gateway,prod-heavy}               |
| `scripts/resize-node-pool.sh` | Resizes worker pool to s-4vcpu-8gb with autoscaling (min 3, max 6) via doctl |

---

## 2. Node Role Assignments

| Node              | Role Label   | Workloads                                                                                                                                                                                                                               |
| ----------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| worker-pool-5vfn6 | `prod-data`  | Prometheus, chat-db, order-db, product-db, vendor-db                                                                                                                                                                                    |
| worker-pool-5vfnl | `prod-app`   | All stateless prod services (order-service x2, user-service, vendor-service, product-service, search-service, websocket-service, chat-service, review-service, analytics-service, admin-service, api-gateway, frontend, grafana, redis) |
| worker-pool-kck5n | `gateway`    | Envoy gateway, ingress-nginx, all staging workloads                                                                                                                                                                                     |
| worker-pool-kyylw | `prod-heavy` | Elasticsearch, analytics-db                                                                                                                                                                                                             |

---

## 3. Resource Requests/Limits Added

### Previously missing — now set

- **All 6 staging DBs** (chat-db, order-db, product-db, vendor-db, review-db, user-db): 50m/200m CPU, 128Mi/256Mi mem
- **Staging services** (admin-service, websocket-service): 50m/200m CPU, 64Mi/128Mi mem
- **Envoy gateway pods**: Added 512Mi memory limit (had no limit before)

### Existing — preserved unchanged

- Elasticsearch: 500m/1000m CPU, 1Gi/2Gi mem
- Prometheus: 250m/1000m CPU, 512Mi/2Gi mem
- Staging frontend: 100m/500m CPU, 128Mi/512Mi mem

---

## 4. Affinity Rules Added

### Node Affinity

- **requiredDuringSchedulingIgnoredDuringExecution**: All prod workloads are pinned to their designated node role
- **preferredDuringSchedulingIgnoredDuringExecution** (weight 80): All staging workloads prefer `gateway` node but can reschedule elsewhere

### Pod Anti-Affinity

- **order-service** (2 replicas): `preferredDuringSchedulingIgnoredDuringExecution` (weight 100), topologyKey `kubernetes.io/hostname` — spreads replicas across nodes

---

## 5. Deployment Order

1. **Label nodes first**: `./scripts/label-nodes.sh`
2. **Apply gateway patches**: `kubectl apply -f k8s/gateway/`
3. **Apply prod manifests**: `kubectl apply -f k8s/prod/`
4. **Apply staging manifests**: `kubectl apply -f k8s/staging/`
5. **Monitor**: `kubectl get pods -A -o wide` — verify pods land on correct nodes
6. **Optional — resize nodes**: `./scripts/resize-node-pool.sh` (triggers rolling replacement)

---

## 6. Risk Notes

- Node resizing (`scripts/resize-node-pool.sh`) triggers rolling node replacement — all pods will be drained and rescheduled
- `requiredDuringScheduling` on prod workloads means pods will stay Pending if their target node is unavailable; resize to s-4vcpu-8gb first if capacity is a concern
- Staging uses `preferred` affinity so pods can land elsewhere under pressure
- Existing Cilium and cert-manager configurations are untouched
