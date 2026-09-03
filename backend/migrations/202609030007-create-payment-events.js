'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PaymentEvents', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      provider: { type: Sequelize.ENUM('RAZORPAY'), allowNull: false, defaultValue: 'RAZORPAY' },
      providerEventId: { type: Sequelize.STRING(200), allowNull: false, unique: true },
      eventType: { type: Sequelize.STRING(100), allowNull: false },
      providerOrderId: { type: Sequelize.STRING(100), allowNull: true },
      providerPaymentId: { type: Sequelize.STRING(100), allowNull: true },
      paymentAttemptId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'PaymentAttempts', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      status: { type: Sequelize.ENUM('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED'), allowNull: false, defaultValue: 'RECEIVED' },
      payloadHash: { type: Sequelize.STRING(64), allowNull: false },
      receivedAt: { type: Sequelize.DATE, allowNull: false },
      processedAt: { type: Sequelize.DATE, allowNull: true },
      failureCode: { type: Sequelize.STRING(80), allowNull: true }, failureMessage: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false }, updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    for (const [fields, options] of [
      [['providerEventId'], { unique: true, name: 'payment_events_provider_event_unique' }],
      [['paymentAttemptId'], { name: 'payment_events_attempt_id_idx' }], [['providerOrderId'], { name: 'payment_events_provider_order_idx' }],
      [['providerPaymentId'], { name: 'payment_events_provider_payment_idx' }], [['eventType'], { name: 'payment_events_type_idx' }],
      [['status'], { name: 'payment_events_status_idx' }], [['receivedAt'], { name: 'payment_events_received_at_idx' }]
    ]) await queryInterface.addIndex('PaymentEvents', fields, options);
  },
  async down(queryInterface) { await queryInterface.dropTable('PaymentEvents'); }
};
