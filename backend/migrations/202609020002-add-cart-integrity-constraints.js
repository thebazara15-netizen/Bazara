'use strict';

const CARTS = 'Carts';
const CART_ITEMS = 'CartItems';
const CART_USER_UNIQUE = 'carts_user_id_unique';
const CART_ITEM_PRODUCT_UNIQUE = 'cart_items_cart_product_unique';
const CART_ITEM_PRODUCT_INDEX = 'cart_items_product_id_idx';

async function select(queryInterface, Sequelize, sql, transaction) {
  return queryInterface.sequelize.query(sql, { transaction, type: Sequelize.QueryTypes.SELECT });
}

async function assertSafeData(queryInterface, Sequelize, transaction) {
  const duplicateCarts = await select(queryInterface, Sequelize,
    'SELECT userId, COUNT(*) AS count FROM Carts GROUP BY userId HAVING COUNT(*) > 1', transaction);
  if (duplicateCarts.length) {
    throw new Error(`Refusing cart integrity migration: duplicate carts exist for user IDs ${duplicateCarts.map((row) => row.userId).join(', ')}`);
  }
  const duplicateItems = await select(queryInterface, Sequelize,
    'SELECT cartId, productId, COUNT(*) AS count FROM CartItems GROUP BY cartId, productId HAVING COUNT(*) > 1', transaction);
  if (duplicateItems.length) {
    throw new Error(`Refusing cart integrity migration: duplicate cart products exist for ${duplicateItems.map((row) => `${row.cartId}:${row.productId}`).join(', ')}`);
  }
  const invalidQuantities = await select(queryInterface, Sequelize,
    "SELECT id FROM CartItems WHERE quantity IS NULL OR quantity <= 0 OR typeof(quantity) != 'integer' OR quantity != CAST(quantity AS INTEGER)", transaction);
  if (invalidQuantities.length) {
    throw new Error(`Refusing cart integrity migration: invalid quantities exist for cart item IDs ${invalidQuantities.map((row) => row.id).join(', ')}`);
  }
  const orphanCarts = await select(queryInterface, Sequelize,
    'SELECT ci.id FROM CartItems ci LEFT JOIN Carts c ON c.id = ci.cartId WHERE c.id IS NULL', transaction);
  const orphanProducts = await select(queryInterface, Sequelize,
    'SELECT ci.id FROM CartItems ci LEFT JOIN Products p ON p.id = ci.productId WHERE p.id IS NULL', transaction);
  if (orphanCarts.length || orphanProducts.length) {
    throw new Error('Refusing cart integrity migration: orphaned cart items exist.');
  }
}

async function hasIndex(queryInterface, table, name) {
  return (await queryInterface.showIndex(table)).some((index) => index.name === name);
}

async function hasUniqueFields(queryInterface, table, fields) {
  return (await queryInterface.showIndex(table)).some((index) =>
    index.unique && index.fields.map((field) => field.attribute).join(',') === fields.join(',')
  );
}

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    await assertSafeData(queryInterface, Sequelize, transaction);
    if (!await hasUniqueFields(queryInterface, CARTS, ['userId'])) {
      await queryInterface.addConstraint(CARTS, { fields: ['userId'], type: 'unique', name: CART_USER_UNIQUE, transaction });
    }
    if (!await hasUniqueFields(queryInterface, CART_ITEMS, ['cartId', 'productId'])) {
      await queryInterface.addConstraint(CART_ITEMS, { fields: ['cartId', 'productId'], type: 'unique', name: CART_ITEM_PRODUCT_UNIQUE, transaction });
    }
    if (!await hasIndex(queryInterface, CART_ITEMS, CART_ITEM_PRODUCT_INDEX)) {
      await queryInterface.addIndex(CART_ITEMS, ['productId'], { name: CART_ITEM_PRODUCT_INDEX, transaction });
    }
  },

  async down(queryInterface, Sequelize, transaction) {
    if (await hasIndex(queryInterface, CART_ITEMS, CART_ITEM_PRODUCT_INDEX)) {
      await queryInterface.removeIndex(CART_ITEMS, CART_ITEM_PRODUCT_INDEX, { transaction });
    }
    if (await hasUniqueFields(queryInterface, CART_ITEMS, ['cartId', 'productId'])) {
      await queryInterface.removeConstraint(CART_ITEMS, CART_ITEM_PRODUCT_UNIQUE, { transaction });
    }
    if (await hasUniqueFields(queryInterface, CARTS, ['userId'])) {
      await queryInterface.removeConstraint(CARTS, CART_USER_UNIQUE, { transaction });
    }
  }
};
