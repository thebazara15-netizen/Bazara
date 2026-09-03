const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
module.exports = sequelize.define('PaymentEvent', {
  provider: { type: DataTypes.ENUM('RAZORPAY'), allowNull: false, defaultValue: 'RAZORPAY' },
  providerEventId: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  eventType: { type: DataTypes.STRING(100), allowNull: false },
  providerOrderId: DataTypes.STRING(100), providerPaymentId: DataTypes.STRING(100), paymentAttemptId: DataTypes.INTEGER,
  status: { type: DataTypes.ENUM('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED'), allowNull: false, defaultValue: 'RECEIVED' },
  payloadHash: { type: DataTypes.STRING(64), allowNull: false }, receivedAt: { type: DataTypes.DATE, allowNull: false },
  processedAt: DataTypes.DATE, failureCode: DataTypes.STRING(80), failureMessage: DataTypes.STRING(255)
}, { indexes: [
  { name: 'payment_events_provider_event_unique', unique: true, fields: ['providerEventId'] },
  { name: 'payment_events_attempt_id_idx', fields: ['paymentAttemptId'] }, { name: 'payment_events_provider_order_idx', fields: ['providerOrderId'] },
  { name: 'payment_events_provider_payment_idx', fields: ['providerPaymentId'] }, { name: 'payment_events_type_idx', fields: ['eventType'] },
  { name: 'payment_events_status_idx', fields: ['status'] }, { name: 'payment_events_received_at_idx', fields: ['receivedAt'] }
] });
