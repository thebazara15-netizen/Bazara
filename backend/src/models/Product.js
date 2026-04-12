const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  description: DataTypes.TEXT,

  category: DataTypes.STRING,

  moq: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  basePrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

    margin: {
    type: DataTypes.FLOAT,
    defaultValue: 0
    },
    finalPrice: {
    type: DataTypes.FLOAT
    },

  pricingTiers: {
    type: DataTypes.JSON // important for bulk pricing
  },

  image: {
    type: DataTypes.STRING,
    allowNull: true
  },

  vendorId: {
    type: DataTypes.INTEGER
  }

}, {
  timestamps: true
});

module.exports = Product;