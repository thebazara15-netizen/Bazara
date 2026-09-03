const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SellerTaxProfile = sequelize.define('SellerTaxProfile', {
  vendorId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  legalName: { type: DataTypes.STRING(200), allowNull: false },
  gstin: DataTypes.STRING(15),
  state: { type: DataTypes.STRING(100), allowNull: false },
  stateCode: { type: DataTypes.STRING(2), allowNull: false },
  isGstRegistered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
});

module.exports = SellerTaxProfile;
