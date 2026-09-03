const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentAttempt = sequelize.define('PaymentAttempt', {
  buyerOrderId: { type: DataTypes.INTEGER, allowNull: false },
  buyerId: { type: DataTypes.INTEGER, allowNull: false },
  provider: { type: DataTypes.ENUM('RAZORPAY'), allowNull: false, defaultValue: 'RAZORPAY' },
  status: { type: DataTypes.ENUM('CREATED', 'PROVIDER_ORDER_CREATING', 'PROVIDER_ORDER_CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED'), allowNull: false, defaultValue: 'CREATED' },
  idempotencyKey: { type: DataTypes.STRING(100), allowNull: false },
  amountPaise: { type: DataTypes.BIGINT, allowNull: false, validate: { isInt: true, min: 1 } },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR', validate: { isIn: [['INR']] } },
  providerOrderId: { type: DataTypes.STRING(100), allowNull: true, unique: true },
  providerPaymentId: { type: DataTypes.STRING(100), allowNull: true, unique: true },
  failureCode: { type: DataTypes.STRING(80), allowNull: true },
  failureMessage: { type: DataTypes.STRING(255), allowNull: true }
}, { indexes: [
  { name: 'payment_attempts_order_idempotency_unique', unique: true, fields: ['buyerOrderId', 'idempotencyKey'] },
  { name: 'payment_attempts_buyer_order_id_idx', fields: ['buyerOrderId'] },
  { name: 'payment_attempts_buyer_id_idx', fields: ['buyerId'] },
  { name: 'payment_attempts_status_idx', fields: ['status'] },
  { name: 'payment_attempts_provider_order_unique', unique: true, fields: ['providerOrderId'] },
  { name: 'payment_attempts_provider_payment_unique', unique: true, fields: ['providerPaymentId'] }
] });

module.exports = PaymentAttempt;
