const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const remoteUrl = process.env.REMOTE_DATABASE_URL || process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL;
let localUrl = process.env.LOCAL_DATABASE_URL;

if (!localUrl) {
  const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;
  if (DB_NAME && DB_USER && DB_HOST && DB_PORT) {
    const encodedPassword = DB_PASSWORD ? encodeURIComponent(DB_PASSWORD) : '';
    localUrl = `postgres://${DB_USER}:${encodedPassword}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }
}

function quoteIdent(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

function normalizeTables(rows) {
  return rows
    .map((row) => row.table_name)
    .filter((table) => table !== 'sequelize_meta' && table !== 'SequelizeMeta');
}

async function copyTable(remoteClient, localClient, table) {
  console.log(`Copying table ${table}...`);
  const remoteResult = await remoteClient.query(`SELECT * FROM ${quoteIdent(table)}`);
  const rows = remoteResult.rows;

  if (rows.length === 0) {
    console.log(`  Skipping ${table}: no rows`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const columnList = columns.map(quoteIdent).join(', ');
  const chunkSize = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = [];
    const placeholders = chunk.map((row, rowIndex) => {
      const rowPlaceholders = columns.map((_, colIndex) => {
        values.push(row[columns[colIndex]]);
        return `$${rowIndex * columns.length + colIndex + 1}`;
      });
      return `(${rowPlaceholders.join(', ')})`;
    });

    const insertSql = `INSERT INTO ${quoteIdent(table)} (${columnList}) VALUES ${placeholders.join(', ')}`;
    await localClient.query(insertSql, values);
    inserted += chunk.length;
  }

  console.log(`  Inserted ${inserted} rows into ${table}`);
}

async function main() {
  if (!remoteUrl) {
    throw new Error('REMOTE_DATABASE_URL or DATABASE_URL must be set in .env.local or environment variables.');
  }

  if (!localUrl) {
    throw new Error('LOCAL_DATABASE_URL must be set or DB_NAME/DB_USER/DB_HOST/DB_PORT must be configured in .env.local.');
  }

  const postgresUrlPattern = /^(postgres|postgresql):\/\//i;
  if (!postgresUrlPattern.test(remoteUrl) || !postgresUrlPattern.test(localUrl)) {
    throw new Error('Both remote and local databases must be PostgreSQL URLs.');
  }

  const remoteHost = new URL(remoteUrl).hostname;
  const remoteClientOptions = {
    connectionString: remoteUrl,
    connectionTimeoutMillis: 15000,
  };

  if (/\.render\.com/i.test(remoteUrl)) {
    remoteClientOptions.ssl = {
      rejectUnauthorized: false,
      servername: remoteHost,
      minVersion: 'TLSv1.2',
    };
  }

  const remoteClient = new Client(remoteClientOptions);
  const localClient = new Client({ connectionString: localUrl });

  await remoteClient.connect();
  await localClient.connect();

  try {
    console.log('Fetching remote table list...');
    const tableResult = await remoteClient.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    const tables = normalizeTables(tableResult.rows);

    if (tables.length === 0) {
      console.log('No tables found in the remote database.');
      return;
    }

    console.log(`Found ${tables.length} tables.`);
    console.log('Truncating local tables...');

    if (tables.length > 0) {
      await localClient.query('BEGIN');
      await localClient.query(`SET session_replication_role = replica`);
      await localClient.query(`TRUNCATE TABLE ${tables.map(quoteIdent).join(', ')} RESTART IDENTITY CASCADE`);
      await localClient.query(`SET session_replication_role = DEFAULT`);
      await localClient.query('COMMIT');
    }

    for (const table of tables) {
      await copyTable(remoteClient, localClient, table);
    }

    console.log('Data copy complete.');
  } catch (error) {
    console.error('Data copy failed:', error.message);
    if (error.message.includes('Connection terminated unexpectedly')) {
      console.error('\nThis usually means the remote PostgreSQL server accepted the TLS connection, but then closed the session before authentication.');
      console.error('Please verify:');
      console.error('- REMOTE_DATABASE_URL is exactly the External Database URL from Render');
      console.error('- the database name, username, and password are correct');
      console.error('- external DB access is allowed for your Render database');
      console.error('- your IP/network is not blocked by Render');
    }
    process.exitCode = 1;
  } finally {
    await remoteClient.end();
    await localClient.end();
  }
}

main();
