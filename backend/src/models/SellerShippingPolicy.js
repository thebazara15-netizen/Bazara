const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SellerShippingPolicy = sequelize.define('SellerShippingPolicy', {
  vendorId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  mode: { type: DataTypes.ENUM('FLAT', 'FREE', 'FREE_ABOVE_THRESHOLD', 'MANUAL_FREIGHT_QUOTE'), allowNull: false },
  flatChargePaise: { type: DataTypes.BIGINT, allowNull: true },
  freeAbovePaise: { type: DataTypes.BIGINT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { indexes: [{ name: 'seller_shipping_policies_active_idx', fields: ['isActive'] }] });

module.exports = SellerShippingPolicy;
