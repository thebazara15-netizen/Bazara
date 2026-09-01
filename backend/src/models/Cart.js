const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  userId: DataTypes.INTEGER
});

module.exports = Cart;
