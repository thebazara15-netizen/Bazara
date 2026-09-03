const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CheckoutDraft = sequelize.define('CheckoutDraft', {
  buyerId: { type: DataTypes.INTEGER, allowNull: false },
  idempotencyKey: { type: DataTypes.STRING(100), allowNull: false },
  status: { type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'INVALIDATED'), allowNull: false, defaultValue: 'ACTIVE' },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
  cartFingerprint: { type: DataTypes.STRING(64), allowNull: false },
  shippingAddressId: { type: DataTypes.INTEGER, allowNull: false },
  billingAddressId: { type: DataTypes.INTEGER, allowNull: false },
  shippingAddressSnapshot: { type: DataTypes.JSON, allowNull: false },
  billingAddressSnapshot: { type: DataTypes.JSON, allowNull: false },
  orderSnapshot: { type: DataTypes.JSON, allowNull: false },
  subtotalPaise: { type: DataTypes.BIGINT, allowNull: false },
  shippingPaise: { type: DataTypes.BIGINT, allowNull: true },
  taxPaise: { type: DataTypes.BIGINT, allowNull: true },
  discountPaise: { type: DataTypes.BIGINT, allowNull: true },
  grandTotalPaise: { type: DataTypes.BIGINT, allowNull: true },
  pricingStatus: { type: DataTypes.ENUM('PARTIAL', 'READY', 'FREIGHT_QUOTE_REQUIRED'), allowNull: false, defaultValue: 'PARTIAL' },
  expiresAt: { type: DataTypes.DATE, allowNull: false }
}, {
  indexes: [
    { name: 'checkout_drafts_buyer_idempotency_unique', unique: true, fields: ['buyerId', 'idempotencyKey'] },
    { name: 'checkout_drafts_buyer_id_idx', fields: ['buyerId'] },
    { name: 'checkout_drafts_status_expiry_idx', fields: ['status', 'expiresAt'] }
  ]
});

module.exports = CheckoutDraft;
