const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register, prefix: 'vendfinder_ws_' });

const wsConnectionsTotal = new promClient.Gauge({
  name: 'vendfinder_ws_connections_active',
  help: 'Active WebSocket connections',
  registers: [register]
});

const wsEventsTotal = new promClient.Counter({
  name: 'vendfinder_ws_events_total',
  help: 'Total WebSocket events',
  labelNames: ['event'],
  registers: [register]
});

module.exports = {
  register,
  wsConnectionsTotal,
  wsEventsTotal,
};
