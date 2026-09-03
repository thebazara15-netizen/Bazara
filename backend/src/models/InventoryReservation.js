const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryReservation = sequelize.define('InventoryReservation', {
  buyerOrderId: { type: DataTypes.INTEGER, allowNull: false },
  buyerOrderItemId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 1 } },
  status: { type: DataTypes.ENUM('RESERVED', 'COMMITTED', 'RELEASED', 'EXPIRED'), allowNull: false, defaultValue: 'RESERVED' },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  releasedAt: DataTypes.DATE,
  committedAt: DataTypes.DATE
}, {
  indexes: [
    { name: 'inventory_reservations_order_item_unique', unique: true, fields: ['buyerOrderItemId'] },
    { name: 'inventory_reservations_product_id_idx', fields: ['productId'] },
    { name: 'inventory_reservations_buyer_order_id_idx', fields: ['buyerOrderId'] },
    { name: 'inventory_reservations_status_idx', fields: ['status'] },
    { name: 'inventory_reservations_expires_at_idx', fields: ['expiresAt'] },
    { name: 'inventory_reservations_product_status_idx', fields: ['productId', 'status'] }
  ]
});

module.exports = InventoryReservation;
