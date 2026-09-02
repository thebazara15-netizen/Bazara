'use strict';

const fs = require('fs');
const path = require('path');
const { DataTypes, Sequelize } = require('sequelize');

const databasePath = path.resolve(__dirname, '../data/dev.sqlite');
const migrationsPath = path.resolve(__dirname, '../migrations');
const direction = process.argv[2] || 'up';

if (!['up', 'down'].includes(direction)) {
  console.error('Usage: node scripts/run-local-migrations.js [up|down]');
  process.exit(1);
}

const sequelize = new Sequelize({ dialect: 'sqlite', storage: databasePath, logging: false });
if (sequelize.getDialect() !== 'sqlite' || path.resolve(sequelize.options.storage || '') !== databasePath) {
  console.error('Refusing to run: database is not backend/data/dev.sqlite.');
  process.exit(1);
}

async function ensureMetadata(queryInterface) {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes('SequelizeMeta')) {
    await queryInterface.createTable('SequelizeMeta', {
      name: { type: DataTypes.STRING, allowNull: false, primaryKey: true, unique: true }
    });
  }
}

async function run() {
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.authenticate();
  await ensureMetadata(queryInterface);

  const files = fs.readdirSync(migrationsPath).filter((file) => /^\d+.*\.js$/.test(file)).sort();
  const appliedRows = await sequelize.query('SELECT name FROM SequelizeMeta ORDER BY name', {
    type: Sequelize.QueryTypes.SELECT
  });
  const applied = new Set(appliedRows.map((row) => row.name));

  if (direction === 'up') {
    for (const file of files.filter((name) => !applied.has(name))) {
      const migration = require(path.join(migrationsPath, file));
      await sequelize.transaction(async (transaction) => {
        await migration.up(queryInterface, Sequelize, transaction);
        await queryInterface.bulkInsert('SequelizeMeta', [{ name: file }], { transaction });
      });
      console.log(`Applied ${file}`);
    }
    return;
  }

  const file = files.filter((name) => applied.has(name)).at(-1);
  if (!file) {
    console.log('No applied migration to roll back.');
    return;
  }
  const migration = require(path.join(migrationsPath, file));
  await sequelize.transaction(async (transaction) => {
    await migration.down(queryInterface, Sequelize, transaction);
    await queryInterface.bulkDelete('SequelizeMeta', { name: file }, { transaction });
  });
  console.log(`Rolled back ${file}`);
}

run().catch(() => {
  console.error('Local migration failed.');
  process.exitCode = 1;
}).finally(() => sequelize.close());
