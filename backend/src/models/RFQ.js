const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RFQ = sequelize.define('RFQ', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  category: DataTypes.STRING,
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'units'
  },
  budget: DataTypes.FLOAT,
  deliveryLocation: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM('OPEN', 'QUOTED', 'CLOSED'),
    defaultValue: 'OPEN'
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = RFQ;
