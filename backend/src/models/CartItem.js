const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  cartId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  price: DataTypes.FLOAT
}, {
  indexes: [
    { name: 'cart_items_cart_product_unique', unique: true, fields: ['cartId', 'productId'] },
    { name: 'cart_items_product_id_idx', fields: ['productId'] }
  ]
});

module.exports = CartItem;
