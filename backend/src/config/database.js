const { Sequelize } = require("sequelize");

console.log("Database config loading...");

const rawDatabaseUrl = (process.env.DATABASE_URL || "").trim();
const dbSsl = String(process.env.DB_SSL || "").toLowerCase();
const rejectUnauthorizedSetting = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "").toLowerCase();

if (!rawDatabaseUrl) {
  throw new Error("Missing DATABASE_URL. Set it to your Neon PostgreSQL connection string.");
}

function buildDatabaseUrl(value) {
  const normalizedValue = value.replace(/^postgresql:\/\//i, "postgres://");
  const parsedUrl = new URL(normalizedValue);

  if (parsedUrl.hostname.endsWith(".neon.tech")) {
    parsedUrl.searchParams.set("sslmode", "verify-full");
    if (!parsedUrl.searchParams.has("channel_binding")) {
      parsedUrl.searchParams.set("channel_binding", "require");
    }
  }

  return parsedUrl;
}

const databaseUrl = buildDatabaseUrl(rawDatabaseUrl);
const databaseHost = databaseUrl.hostname;
const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(databaseHost);
const isNeonDatabase = databaseHost.endsWith(".neon.tech");
const enableSsl = dbSsl === "true" || (dbSsl !== "false" && !isLocalDatabase);
const rejectUnauthorized = rejectUnauthorizedSetting === "false" ? false : true;

function createSequelize() {
  const poolConfig = {
    max: Number(process.env.DB_POOL_MAX || 5),
    min: Number(process.env.DB_POOL_MIN || 0),
    acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
    idle: Number(process.env.DB_POOL_IDLE || 10000),
  };

  console.log("");
  console.log("DATABASE: PostgreSQL via DATABASE_URL");
  console.log(`   Provider: ${isNeonDatabase ? "Neon" : "PostgreSQL"}`);
  console.log(`   Host: ${databaseHost}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   SSL: ${enableSsl ? "enabled" : "disabled"}`);
  console.log("");

  return new Sequelize(databaseUrl.toString(), {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
    pool: poolConfig,
    dialectOptions: enableSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized,
            servername: databaseHost,
          },
        }
      : undefined,
    connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS || 30000),
  });
}

const sequelize = createSequelize();
module.exports = sequelize;
module.exports.createSequelize = createSequelize;
