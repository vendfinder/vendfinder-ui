const logger = {
  log(level, message, context = {}) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: 'websocket-service',
      msg: message,
      ...context
    }));
  },
  info(message, context = {}) { this.log('info', message, context); },
  warn(message, context = {}) { this.log('warn', message, context); },
  error(message, context = {}) { this.log('error', message, context); },
};

module.exports = logger;
