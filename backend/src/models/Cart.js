const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  userId: DataTypes.INTEGER
});

const Product = require('./Product');

Cart.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

module.exports = Cart;