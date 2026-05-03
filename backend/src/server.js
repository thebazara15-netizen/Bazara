require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
let server;

async function startServer() {
  try {
    logger.info('server_boot_requested', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV,
      pid: process.pid,
      nodeVersion: process.version
    });

    await sequelize.authenticate();
    logger.info('database_connected', { dialect: sequelize.getDialect() });

    await sequelize.sync({ alter: true });
    logger.info('database_tables_synced');

    server = app.listen(PORT, () => {
      logger.info('server_running', { port: PORT, pid: process.pid });
    });
  } catch (error) {
    logger.error('server_start_failed', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  logger.error('uncaught_exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', reason instanceof Error ? reason : { reason });
});

function shutdown(signal) {
  logger.warn('shutdown_signal_received', { signal, pid: process.pid });

  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    logger.info('http_server_closed', { signal });
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('forced_shutdown_after_timeout', { signal });
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
