// src/models/User.js

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

  companyName: DataTypes.STRING,
  gstNumber: DataTypes.STRING,

  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = User;