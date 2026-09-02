'use strict';

const TABLE = 'Orders';
const USERS = 'Users';
const INDEX = 'orders_buyer_id_idx';

const queryOptions = (transaction, type) => ({ transaction, type });

async function ownershipRows(queryInterface, Sequelize, transaction) {
  const quote = queryInterface.queryGenerator.quoteIdentifier.bind(queryInterface.queryGenerator);
  const table = queryInterface.queryGenerator.quoteTable(TABLE);
  return queryInterface.sequelize.query(
    `SELECT ${quote('id')}, ${quote('userId')}, ${quote('buyerId')} FROM ${table}`,
    queryOptions(transaction, Sequelize.QueryTypes.SELECT)
  );
}

async function assertNoConflicts(queryInterface, Sequelize, transaction) {
  const rows = await ownershipRows(queryInterface, Sequelize, transaction);
  const conflicts = rows
    .filter((row) => row.userId != null && row.buyerId != null && Number(row.userId) !== Number(row.buyerId))
    .map((row) => row.id);

  if (conflicts.length) {
    throw new Error(`Order ownership conflict for order IDs: ${conflicts.join(', ')}`);
  }
}

async function assertValidReferences(queryInterface, Sequelize, transaction, column) {
  const quote = queryInterface.queryGenerator.quoteIdentifier.bind(queryInterface.queryGenerator);
  const orders = queryInterface.queryGenerator.quoteTable(TABLE);
  const users = queryInterface.queryGenerator.quoteTable(USERS);
  const rows = await queryInterface.sequelize.query(
    `SELECT o.${quote('id')} FROM ${orders} o LEFT JOIN ${users} u ON u.${quote('id')} = o.${quote(column)} WHERE o.${quote(column)} IS NOT NULL AND u.${quote('id')} IS NULL`,
    queryOptions(transaction, Sequelize.QueryTypes.SELECT)
  );

  if (rows.length) {
    throw new Error(`Orders with orphaned ${column}: ${rows.map((row) => row.id).join(', ')}`);
  }
}

async function assertCompleteBuyerOwnership(queryInterface, Sequelize, transaction) {
  const quote = queryInterface.queryGenerator.quoteIdentifier.bind(queryInterface.queryGenerator);
  const table = queryInterface.queryGenerator.quoteTable(TABLE);
  const rows = await queryInterface.sequelize.query(
    `SELECT ${quote('id')} FROM ${table} WHERE ${quote('buyerId')} IS NULL`,
    queryOptions(transaction, Sequelize.QueryTypes.SELECT)
  );

  if (rows.length) {
    throw new Error(`Orders without buyer ownership: ${rows.map((row) => row.id).join(', ')}`);
  }
}

const retainedIndexes = (indexes) => indexes.filter((index) =>
  index.name && !index.name.startsWith('sqlite_autoindex_') && !index.primary
);

async function restoreIndexes(queryInterface, indexes, transaction) {
  const existing = new Set((await queryInterface.showIndex(TABLE)).map((index) => index.name));
  for (const index of retainedIndexes(indexes)) {
    if (existing.has(index.name)) continue;
    await queryInterface.addIndex(TABLE, index.fields.map((field) => field.attribute), {
      name: index.name,
      unique: Boolean(index.unique),
      transaction
    });
  }
}

async function sqliteForeignKey(queryInterface, Sequelize, transaction) {
  if (queryInterface.sequelize.getDialect() !== 'sqlite') return null;
  const rows = await queryInterface.sequelize.query(
    'PRAGMA foreign_key_list(Orders)',
    queryOptions(transaction, Sequelize.QueryTypes.SELECT)
  );
  return rows.find((row) => row.from === 'buyerId') || null;
}

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    let columns = await queryInterface.describeTable(TABLE);
    if (!columns.userId && !columns.buyerId) {
      throw new Error('Orders has neither userId nor buyerId; ownership cannot be inferred safely.');
    }

    if (columns.userId) await assertValidReferences(queryInterface, Sequelize, transaction, 'userId');
    if (columns.userId && columns.buyerId) await assertNoConflicts(queryInterface, Sequelize, transaction);

    if (!columns.buyerId) {
      await queryInterface.addColumn(TABLE, 'buyerId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: USERS, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }, { transaction });
    }

    columns = await queryInterface.describeTable(TABLE);
    if (columns.userId) {
      const quote = queryInterface.queryGenerator.quoteIdentifier.bind(queryInterface.queryGenerator);
      const table = queryInterface.queryGenerator.quoteTable(TABLE);
      await queryInterface.sequelize.query(
        `UPDATE ${table} SET ${quote('buyerId')} = ${quote('userId')} WHERE ${quote('buyerId')} IS NULL AND ${quote('userId')} IS NOT NULL`,
        { transaction }
      );
      await assertNoConflicts(queryInterface, Sequelize, transaction);
    }

    await assertCompleteBuyerOwnership(queryInterface, Sequelize, transaction);
    await assertValidReferences(queryInterface, Sequelize, transaction, 'buyerId');

    const indexesBeforeFkRepair = await queryInterface.showIndex(TABLE);
    const foreignKey = await sqliteForeignKey(queryInterface, Sequelize, transaction);
    const needsForeignKeyRepair = queryInterface.sequelize.getDialect() !== 'sqlite' ||
      !foreignKey || foreignKey.table !== USERS || foreignKey.to !== 'id' ||
      String(foreignKey.on_update).toUpperCase() !== 'CASCADE' ||
      String(foreignKey.on_delete).toUpperCase() !== 'RESTRICT';

    if (needsForeignKeyRepair) {
      await queryInterface.changeColumn(TABLE, 'buyerId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: USERS, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }, { transaction });
      await restoreIndexes(queryInterface, indexesBeforeFkRepair, transaction);
    }

    const indexes = await queryInterface.showIndex(TABLE);
    if (!indexes.some((index) => index.name === INDEX)) {
      await queryInterface.addIndex(TABLE, ['buyerId'], { name: INDEX, transaction });
    }
  },

  async down(queryInterface, Sequelize, transaction) {
    const columns = await queryInterface.describeTable(TABLE);
    if (!columns.buyerId) return;
    if (!columns.userId) {
      throw new Error('Refusing rollback: legacy Orders.userId is missing.');
    }

    await assertNoConflicts(queryInterface, Sequelize, transaction);
    await assertValidReferences(queryInterface, Sequelize, transaction, 'buyerId');

    const quote = queryInterface.queryGenerator.quoteIdentifier.bind(queryInterface.queryGenerator);
    const table = queryInterface.queryGenerator.quoteTable(TABLE);
    await queryInterface.sequelize.query(
      `UPDATE ${table} SET ${quote('userId')} = ${quote('buyerId')} WHERE ${quote('userId')} IS NULL AND ${quote('buyerId')} IS NOT NULL`,
      { transaction }
    );

    await assertNoConflicts(queryInterface, Sequelize, transaction);
    await assertValidReferences(queryInterface, Sequelize, transaction, 'userId');

    const missingLegacyOwners = await queryInterface.sequelize.query(
      `SELECT ${quote('id')} FROM ${table} WHERE ${quote('userId')} IS NULL`,
      queryOptions(transaction, Sequelize.QueryTypes.SELECT)
    );
    if (missingLegacyOwners.length) {
      throw new Error(`Refusing rollback: Orders without legacy ownership: ${missingLegacyOwners.map((row) => row.id).join(', ')}`);
    }

    const indexes = await queryInterface.showIndex(TABLE);
    if (indexes.some((index) => index.name === INDEX)) {
      await queryInterface.removeIndex(TABLE, INDEX, { transaction });
    }

    const indexesBeforeRebuild = (await queryInterface.showIndex(TABLE)).filter((index) => index.name !== INDEX);
    await queryInterface.removeColumn(TABLE, 'buyerId', { transaction });
    await restoreIndexes(queryInterface, indexesBeforeRebuild, transaction);
  }
};
