'use strict';

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    await queryInterface.addColumn('BuyerOrders', 'checkoutDraftId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'CheckoutDrafts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    }, { transaction });
    await queryInterface.addIndex('BuyerOrders', ['checkoutDraftId'], { unique: true, name: 'buyer_orders_checkout_draft_unique', transaction });

    await queryInterface.createTable('InventoryReservations', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      buyerOrderId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'BuyerOrders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      buyerOrderItemId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'BuyerOrderItems', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      productId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('RESERVED', 'COMMITTED', 'RELEASED', 'EXPIRED'), allowNull: false, defaultValue: 'RESERVED' },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      releasedAt: { type: Sequelize.DATE, allowNull: true },
      committedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }, { transaction });
    await queryInterface.addConstraint('InventoryReservations', { fields: ['quantity'], type: 'check', where: { quantity: { [Sequelize.Op.gt]: 0 } }, name: 'inventory_reservations_quantity_positive', transaction });
    await queryInterface.addIndex('InventoryReservations', ['buyerOrderItemId'], { unique: true, name: 'inventory_reservations_order_item_unique', transaction });
    await queryInterface.addIndex('InventoryReservations', ['productId'], { name: 'inventory_reservations_product_id_idx', transaction });
    await queryInterface.addIndex('InventoryReservations', ['buyerOrderId'], { name: 'inventory_reservations_buyer_order_id_idx', transaction });
    await queryInterface.addIndex('InventoryReservations', ['status'], { name: 'inventory_reservations_status_idx', transaction });
    await queryInterface.addIndex('InventoryReservations', ['expiresAt'], { name: 'inventory_reservations_expires_at_idx', transaction });
    await queryInterface.addIndex('InventoryReservations', ['productId', 'status'], { name: 'inventory_reservations_product_status_idx', transaction });
  },

  async down(queryInterface, Sequelize, transaction) {
    await queryInterface.dropTable('InventoryReservations', { transaction });
    await queryInterface.removeIndex('BuyerOrders', 'buyer_orders_checkout_draft_unique', { transaction });
    await queryInterface.removeColumn('BuyerOrders', 'checkoutDraftId', { transaction });
  }
};
