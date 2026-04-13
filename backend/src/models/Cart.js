const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  userId: DataTypes.INTEGER
});

const CartItem = require('./CartItem');

Cart.hasMany(CartItem, {
  foreignKey: 'cartId',
  as: 'items'
});

module.exports = Cart;
