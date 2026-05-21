const { Sequelize } = require("sequelize");

const DATABASE_URL = process.env.DATABASE_URL;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_SSL = String(process.env.DB_SSL || '').toLowerCase();
const DB_USE_DATABASE_URL = String(process.env.DB_USE_DATABASE_URL || '').toLowerCase() === 'true';

const sslOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

const normalizedDatabaseUrl = DATABASE_URL
  ? DATABASE_URL.replace(/^postgresql:\/\//i, 'postgres://')
  : undefined;
const useDatabaseUrl = Boolean(normalizedDatabaseUrl) && (
  process.env.NODE_ENV !== 'development' ||
  DB_USE_DATABASE_URL ||
  !DB_HOST
);

const databaseHost = useDatabaseUrl
  ? new URL(normalizedDatabaseUrl).hostname
  : DB_HOST;
const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(databaseHost);
const enableSsl = DB_SSL === 'true' || (
  DB_SSL !== 'false' &&
  (process.env.NODE_ENV === 'production' || (useDatabaseUrl && !isLocalDatabase))
);

if (!useDatabaseUrl && (!DB_NAME || !DB_USER || !DB_HOST)) {
  throw new Error('Database configuration missing. Set DATABASE_URL or DB_NAME, DB_USER, and DB_HOST.');
}

const sequelize = useDatabaseUrl
  ? new Sequelize(normalizedDatabaseUrl, {
      dialect: "postgres",
      protocol: "postgres",
      logging: false,
      dialectOptions: enableSsl ? sslOptions : undefined
    })
  : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: "postgres",
      logging: false,
      dialectOptions: enableSsl ? sslOptions : undefined
    });

module.exports = sequelize;
