const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  cartId: DataTypes.INTEGER,
  productId: DataTypes.INTEGER,
  quantity: DataTypes.INTEGER,
  price: DataTypes.FLOAT
});

module.exports = CartItem;