const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  cartId: DataTypes.INTEGER,
  productId: DataTypes.INTEGER,
  quantity: DataTypes.INTEGER,
  price: DataTypes.FLOAT
});

const Product = require('./Product');

CartItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

module.exports = CartItem;
