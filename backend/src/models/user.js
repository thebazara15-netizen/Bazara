const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    unique: true
  },

  password: DataTypes.STRING,

  role: {
    type: DataTypes.ENUM('ADMIN', 'VENDOR', 'CLIENT'),
    defaultValue: 'CLIENT'
  },

  // ✅ EXISTING
  companyName: DataTypes.STRING,
  gstNumber: DataTypes.STRING,

  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  // ✅ ADD THESE NEW FIELDS (JUST ADD BELOW)
  firstName: {
    type: DataTypes.STRING
  },

  lastName: {
    type: DataTypes.STRING
  },

  phone: {
    type: DataTypes.STRING
  }

}, {
  timestamps: true
});

module.exports = User;