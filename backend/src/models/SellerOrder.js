const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const money = () => ({ type: DataTypes.BIGINT, allowNull: false, defaultValue: 0, validate: { isInt: true, min: 0 } });
const SellerOrder = sequelize.define('SellerOrder', {
  buyerOrderId: { type: DataTypes.INTEGER, allowNull: false },
  vendorId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('DRAFT', 'PENDING_PAYMENT', 'PLACED', 'CANCELLED'), allowNull: false, defaultValue: 'DRAFT' },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR', validate: { isIn: [['INR']] } },
  subtotalPaise: money(),
  shippingPaise: money(),
  taxPaise: money(),
  discountPaise: money(),
  grandTotalPaise: money(),
  sellerSnapshot: { type: DataTypes.JSON, allowNull: false },
  freightMode: { type: DataTypes.STRING(30), allowNull: true }
}, {
  indexes: [
    { name: 'seller_orders_buyer_vendor_unique', unique: true, fields: ['buyerOrderId', 'vendorId'] },
    { name: 'seller_orders_buyer_order_id_idx', fields: ['buyerOrderId'] },
    { name: 'seller_orders_vendor_id_idx', fields: ['vendorId'] }
  ],
  hooks: { beforeUpdate(order) { if (order.changed('sellerSnapshot')) throw new Error('Seller snapshot is immutable'); } }
});

module.exports = SellerOrder;
