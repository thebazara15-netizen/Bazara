const { Sequelize } = require("sequelize");

console.log('📋 Database config loading...');

// Only use DATABASE_URL if it's truly set and not empty
let DATABASE_URL = (process.env.DATABASE_URL || '').trim();
// Treat empty strings as not set
if (!DATABASE_URL) {
  DATABASE_URL = undefined;
}

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_SSL = String(process.env.DB_SSL || '').toLowerCase();
const DB_USE_DATABASE_URL = String(process.env.DB_USE_DATABASE_URL || '').toLowerCase() === 'true';

console.log('   DATABASE_URL:', DATABASE_URL ? '[set]' : '[empty]');
console.log('   DB_NAME:', DB_NAME);
console.log('   DB_USER:', DB_USER);
console.log('   DB_HOST:', DB_HOST);
console.log('   DB_PORT:', DB_PORT);

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
  ? (function(){ try { return new URL(normalizedDatabaseUrl).hostname; } catch { return null; } })()
  : DB_HOST;
const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(databaseHost);
const enableSsl = DB_SSL === 'true' || (
  DB_SSL !== 'false' &&
  (process.env.NODE_ENV === 'production' || (useDatabaseUrl && !isLocalDatabase))
);

const path = require('path');
const fs = require('fs');

// If configuration is missing, fall back to a local sqlite DB so the app can start on platforms
// that do not provide DB credentials during build (like preview deploys). In production you should supply DATABASE_URL or DB_* vars.
const hasSqlConfig = useDatabaseUrl || (DB_NAME && DB_USER && DB_HOST);

function createSqliteSequelize() {
  const dataDir = path.resolve(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const sqliteFile = path.join(dataDir, 'dev.sqlite');
  console.log(`\n📦 DATABASE: SQLite (development fallback)`);
  console.log(`   Location: ${sqliteFile}\n`);
  return new Sequelize({ dialect: 'sqlite', storage: sqliteFile, logging: false });
}

function createPostgresSequelize() {
  const poolConfig = {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  };

  if (useDatabaseUrl) {
    const urlHost = databaseHost || 'unknown';
    console.log(`\n🗄️  DATABASE: PostgreSQL via DATABASE_URL`);
    console.log(`   Host: ${urlHost}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   SSL: ${enableSsl ? 'enabled' : 'disabled'}\n`);
    return new Sequelize(normalizedDatabaseUrl, {
      dialect: "postgres",
      protocol: "postgres",
      logging: false,
      pool: poolConfig,
      dialectOptions: enableSsl ? sslOptions : undefined,
      connectTimeoutMS: 30000
    });
  }

  console.log(`\n🗄️  DATABASE: PostgreSQL (local or custom)`);
  console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`   Database: ${DB_NAME}`);
  console.log(`   SSL: ${enableSsl ? 'enabled' : 'disabled'}\n`);
  return new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "postgres",
    logging: false,
    pool: poolConfig,
    dialectOptions: enableSsl ? sslOptions : undefined,
    connectTimeoutMS: 30000
  });
}

function createSequelize() {
  return hasSqlConfig ? createPostgresSequelize() : createSqliteSequelize();
}

const sequelize = createSequelize();
module.exports = sequelize;
module.exports.createSequelize = createSequelize;
module.exports.createSqliteSequelize = createSqliteSequelize;
