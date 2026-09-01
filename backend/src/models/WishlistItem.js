const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WishlistItem = sequelize.define('WishlistItem', {
  id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'WishlistItems',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'productId'], name: 'wishlist_items_user_product_unique' },
    { fields: ['userId'], name: 'wishlist_items_user_id_idx' },
    { fields: ['productId'], name: 'wishlist_items_product_id_idx' }
  ]
});

module.exports = WishlistItem;
