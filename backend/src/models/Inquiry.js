const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inquiry = sequelize.define('Inquiry', {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  message: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('NEW', 'CONTACTED', 'QUOTED', 'CLOSED'),
    defaultValue: 'NEW'
  }
}, {
  timestamps: true
});

module.exports = Inquiry;
