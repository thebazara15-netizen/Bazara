const { Sequelize } = require("sequelize");

console.log('📋 Database config loading...');

const DATABASE_URL = (process.env.DATABASE_URL || '').trim() || undefined;
const DB_SSL = String(process.env.DB_SSL || '').toLowerCase();

console.log('   DATABASE_URL:', DATABASE_URL ? '[set]' : '[empty]');

if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL. Please set DATABASE_URL to your Neon or PostgreSQL connection string.');
}

const sslOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

const normalizedDatabaseUrl = DATABASE_URL.replace(/^postgresql:\/\//i, 'postgres://');
const databaseHost = (function() {
  try { return new URL(normalizedDatabaseUrl).hostname; } catch { return null; }
})();
const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(databaseHost);
const enableSsl = DB_SSL === 'true' || (DB_SSL !== 'false' && !isLocalDatabase);

function createSequelize() {
  const poolConfig = {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  };

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

const sequelize = createSequelize();
module.exports = sequelize;
module.exports.createSequelize = createSequelize;
