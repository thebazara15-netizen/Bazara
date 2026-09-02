const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const money = () => ({ type: DataTypes.BIGINT, allowNull: false, defaultValue: 0, validate: { isInt: true, min: 0 } });
const IMMUTABLE = ['productId', 'vendorId', 'productName', 'descriptionSnapshot', 'imageUrlSnapshot', 'quantity', 'unit', 'moqSnapshot', 'unitPricePaise', 'lineSubtotalPaise', 'discountPaise', 'taxableValuePaise', 'gstRateBasisPoints', 'cgstPaise', 'sgstPaise', 'igstPaise', 'taxTotalPaise', 'lineTotalPaise', 'hsnCode', 'currency'];
const BuyerOrderItem = sequelize.define('BuyerOrderItem', {
  sellerOrderId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: true },
  vendorId: { type: DataTypes.INTEGER, allowNull: false },
  productName: { type: DataTypes.STRING(255), allowNull: false },
  descriptionSnapshot: DataTypes.TEXT,
  imageUrlSnapshot: DataTypes.STRING(2048),
  quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 1 } },
  unit: { type: DataTypes.STRING(30), allowNull: false },
  moqSnapshot: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 1 } },
  unitPricePaise: money(),
  lineSubtotalPaise: money(),
  discountPaise: money(),
  taxableValuePaise: money(),
  gstRateBasisPoints: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { isInt: true, min: 0 } },
  cgstPaise: money(),
  sgstPaise: money(),
  igstPaise: money(),
  taxTotalPaise: money(),
  lineTotalPaise: money(),
  hsnCode: DataTypes.STRING(20),
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR', validate: { isIn: [['INR']] } }
}, {
  indexes: [
    { name: 'buyer_order_items_seller_order_id_idx', fields: ['sellerOrderId'] },
    { name: 'buyer_order_items_product_id_idx', fields: ['productId'] },
    { name: 'buyer_order_items_vendor_id_idx', fields: ['vendorId'] }
  ],
  hooks: { beforeUpdate(item) { if (IMMUTABLE.some((field) => item.changed(field))) throw new Error('Order item snapshots are immutable'); } }
});

module.exports = BuyerOrderItem;
