const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const money = () => ({ type: DataTypes.BIGINT, allowNull: false, defaultValue: 0, validate: { isInt: true, min: 0 } });
const BuyerOrder = sequelize.define('BuyerOrder', {
  buyerId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('DRAFT', 'PENDING_PAYMENT', 'PLACED', 'CANCELLED'), allowNull: false, defaultValue: 'DRAFT' },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR', validate: { isIn: [['INR']] } },
  subtotalPaise: money(),
  shippingPaise: money(),
  taxPaise: money(),
  discountPaise: money(),
  grandTotalPaise: money(),
  shippingAddressSnapshot: { type: DataTypes.JSON, allowNull: false },
  billingAddressSnapshot: { type: DataTypes.JSON, allowNull: false },
  checkoutDraftId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
  checkoutReference: { type: DataTypes.STRING(100), allowNull: true, unique: true }
}, {
  indexes: [{ name: 'buyer_orders_buyer_id_idx', fields: ['buyerId'] }, { name: 'buyer_orders_status_idx', fields: ['status'] }],
  hooks: {
    beforeUpdate(order) {
      if (order.changed('shippingAddressSnapshot') || order.changed('billingAddressSnapshot')) throw new Error('Order address snapshots are immutable');
    }
  }
});

module.exports = BuyerOrder;
