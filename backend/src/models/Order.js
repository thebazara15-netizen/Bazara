const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  userId: DataTypes.INTEGER,

  totalAmount: DataTypes.FLOAT,

  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'),
    defaultValue: 'PENDING'
  }
}, { timestamps: true });

module.exports = Order;