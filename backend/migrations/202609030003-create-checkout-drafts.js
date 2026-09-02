'use strict';

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    await queryInterface.createTable('CheckoutDrafts', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      buyerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      idempotencyKey: { type: Sequelize.STRING(100), allowNull: false },
      status: { type: Sequelize.ENUM('ACTIVE', 'EXPIRED', 'INVALIDATED'), allowNull: false, defaultValue: 'ACTIVE' },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      cartFingerprint: { type: Sequelize.STRING(64), allowNull: false },
      shippingAddressId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Addresses', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      billingAddressId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Addresses', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      shippingAddressSnapshot: { type: Sequelize.JSON, allowNull: false },
      billingAddressSnapshot: { type: Sequelize.JSON, allowNull: false },
      orderSnapshot: { type: Sequelize.JSON, allowNull: false },
      subtotalPaise: { type: Sequelize.BIGINT, allowNull: false },
      shippingPaise: { type: Sequelize.BIGINT, allowNull: true },
      taxPaise: { type: Sequelize.BIGINT, allowNull: true },
      discountPaise: { type: Sequelize.BIGINT, allowNull: true },
      grandTotalPaise: { type: Sequelize.BIGINT, allowNull: true },
      pricingStatus: { type: Sequelize.ENUM('PARTIAL', 'READY'), allowNull: false, defaultValue: 'PARTIAL' },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }, { transaction });
    await queryInterface.addConstraint('CheckoutDrafts', { fields: ['buyerId', 'idempotencyKey'], type: 'unique', name: 'checkout_drafts_buyer_idempotency_unique', transaction });
    await queryInterface.addIndex('CheckoutDrafts', ['buyerId'], { name: 'checkout_drafts_buyer_id_idx', transaction });
    await queryInterface.addIndex('CheckoutDrafts', ['status', 'expiresAt'], { name: 'checkout_drafts_status_expiry_idx', transaction });
  },

  async down(queryInterface, Sequelize, transaction) {
    await queryInterface.dropTable('CheckoutDrafts', { transaction });
  }
};
