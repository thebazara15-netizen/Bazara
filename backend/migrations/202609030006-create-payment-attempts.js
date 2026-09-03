'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PaymentAttempts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      buyerOrderId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'BuyerOrders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      buyerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      provider: { type: Sequelize.ENUM('RAZORPAY'), allowNull: false, defaultValue: 'RAZORPAY' },
      status: { type: Sequelize.ENUM('CREATED', 'PROVIDER_ORDER_CREATING', 'PROVIDER_ORDER_CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED'), allowNull: false, defaultValue: 'CREATED' },
      idempotencyKey: { type: Sequelize.STRING(100), allowNull: false },
      amountPaise: { type: Sequelize.BIGINT, allowNull: false }, currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      providerOrderId: { type: Sequelize.STRING(100), allowNull: true }, providerPaymentId: { type: Sequelize.STRING(100), allowNull: true },
      failureCode: { type: Sequelize.STRING(80), allowNull: true }, failureMessage: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false }, updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('PaymentAttempts', ['buyerOrderId', 'idempotencyKey'], { unique: true, name: 'payment_attempts_order_idempotency_unique' });
    await queryInterface.addIndex('PaymentAttempts', ['buyerOrderId'], { name: 'payment_attempts_buyer_order_id_idx' });
    await queryInterface.addIndex('PaymentAttempts', ['buyerId'], { name: 'payment_attempts_buyer_id_idx' });
    await queryInterface.addIndex('PaymentAttempts', ['status'], { name: 'payment_attempts_status_idx' });
    await queryInterface.addIndex('PaymentAttempts', ['providerOrderId'], { unique: true, name: 'payment_attempts_provider_order_unique' });
    await queryInterface.addIndex('PaymentAttempts', ['providerPaymentId'], { unique: true, name: 'payment_attempts_provider_payment_unique' });
  },
  async down(queryInterface) { await queryInterface.dropTable('PaymentAttempts'); }
};
