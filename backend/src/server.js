require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
let server;

function isEnabled(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

async function synchronizeDevelopmentDatabase() {
  const shouldSync = isEnabled(process.env.DB_SYNC);
  const shouldAlter = isEnabled(process.env.DB_SYNC_ALTER);

  if (isProduction) {
    if (shouldSync || shouldAlter) {
      throw new Error('Database synchronization cannot be enabled in production');
    }

    logger.info('database_schema_sync_skipped', { reason: 'production' });
    return;
  }

  if (!shouldSync) {
    logger.info('database_schema_sync_skipped', { reason: 'disabled' });
    return;
  }

  await sequelize.sync({ alter: shouldAlter });
  logger.warn('development_database_schema_synced', { alter: shouldAlter });
}

async function startServer() {
  try {
    logger.info('server_boot_requested', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV,
      pid: process.pid,
      nodeVersion: process.version
    });

    try {
      console.log('🔍 Attempting to connect to database...');
      await sequelize.authenticate();
      console.log('✅ Database authenticated successfully');
      logger.info('database_connected', { dialect: sequelize.getDialect() });
    } catch (error) {
      console.error('❌ Database connection error:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port
      });
      logger.error('database_connection_failed', error);
      throw error;
    }

    await synchronizeDevelopmentDatabase();

    server = app.listen(PORT, () => {
      logger.info('server_running', { port: PORT, pid: process.pid });
      console.log(`\n✨ Server is running on http://localhost:${PORT}`);
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
