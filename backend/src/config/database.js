const path = require('path');
const { Sequelize } = require('sequelize');

const databaseUrl = (process.env.DATABASE_URL || '').trim();
const useDatabaseUrl = String(process.env.DB_USE_DATABASE_URL || '').toLowerCase() === 'true';
const hasLocalPostgresConfig = Boolean(process.env.DB_NAME && process.env.DB_USER && process.env.DB_HOST);
const isProduction = process.env.NODE_ENV === 'production';

function postgresOptions(host) {
  const sslSetting = String(process.env.DB_SSL || '').toLowerCase();
  const rejectUnauthorizedSetting = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || '').toLowerCase();
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
  const enableSsl = sslSetting === 'true' || (sslSetting !== 'false' && !isLocal);
  const rejectUnauthorized = rejectUnauthorizedSetting !== 'false';

  if (isProduction && !isLocal && !enableSsl) {
    throw new Error('TLS is required for remote PostgreSQL in production');
  }

  if (isProduction && enableSsl && !rejectUnauthorized) {
    throw new Error('TLS certificate verification cannot be disabled in production');
  }

  return {
    dialect: 'postgres',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: enableSsl
      ? { ssl: { require: true, rejectUnauthorized } }
      : undefined
  };
}

function createSequelize() {
  if (databaseUrl && (isProduction || useDatabaseUrl)) {
    const normalizedUrl = databaseUrl.replace(/^postgresql:\/\//i, 'postgres://');
    const host = new URL(normalizedUrl).hostname;
    return new Sequelize(normalizedUrl, postgresOptions(host));
  }

  if (hasLocalPostgresConfig) {
    return new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD || '', {
      ...postgresOptions(process.env.DB_HOST),
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432
    });
  }

  return new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../../data/dev.sqlite'),
    logging: false
  });
}

const sequelize = createSequelize();
module.exports = sequelize;
module.exports.createSequelize = createSequelize;
