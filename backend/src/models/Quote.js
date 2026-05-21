const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quote = sequelize.define('Quote', {
  rfqId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  deliveryDays: {
    type: DataTypes.INTEGER,
    defaultValue: 14
  },
  message: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('SENT', 'ACCEPTED', 'REJECTED'),
    defaultValue: 'SENT'
  },
  validUntil: DataTypes.DATE
}, {
  timestamps: true
});

module.exports = Quote;
