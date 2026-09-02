const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  label: DataTypes.STRING(50),
  contactName: { type: DataTypes.STRING(120), allowNull: false },
  companyName: { type: DataTypes.STRING(200), allowNull: false },
  phoneCountryCode: { type: DataTypes.STRING(5), allowNull: false, defaultValue: '+91' },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  addressLine1: { type: DataTypes.STRING(255), allowNull: false },
  addressLine2: DataTypes.STRING(255),
  landmark: DataTypes.STRING(150),
  city: { type: DataTypes.STRING(100), allowNull: false },
  district: DataTypes.STRING(100),
  state: { type: DataTypes.STRING(100), allowNull: false },
  stateCode: { type: DataTypes.STRING(2), allowNull: false },
  postalCode: { type: DataTypes.STRING(10), allowNull: false },
  countryCode: { type: DataTypes.STRING(2), allowNull: false, defaultValue: 'IN' },
  gstin: DataTypes.STRING(15),
  isDefaultShipping: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isDefaultBilling: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  indexes: [
    { name: 'addresses_user_id_idx', fields: ['userId'] },
    { name: 'addresses_user_default_shipping_idx', fields: ['userId', 'isDefaultShipping'] },
    { name: 'addresses_user_default_billing_idx', fields: ['userId', 'isDefaultBilling'] }
  ]
});

module.exports = Address;
