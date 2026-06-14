const sequelize = require('../config/database');
const User = require('./user');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const RFQ = require('./RFQ');
const Quote = require('./Quote');
const Inquiry = require('./Inquiry');

// Define associations
User.hasMany(Product, { as: 'products', foreignKey: 'vendorId' });
Product.belongsTo(User, { as: 'vendor', foreignKey: 'vendorId' });

User.hasMany(Cart, { as: 'carts', foreignKey: 'userId' });
Cart.belongsTo(User, { as: 'user', foreignKey: 'userId' });

Cart.hasMany(CartItem, { as: 'items', foreignKey: 'cartId' });
CartItem.belongsTo(Cart, { as: 'cart', foreignKey: 'cartId' });
CartItem.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

User.hasMany(Order, { as: 'orders', foreignKey: 'buyerId' });
Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });

Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

User.hasMany(RFQ, { as: 'rfqs', foreignKey: 'buyerId' });
RFQ.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });

RFQ.hasMany(Quote, { as: 'quotes', foreignKey: 'rfqId' });
Quote.belongsTo(RFQ, { as: 'rfq', foreignKey: 'rfqId' });
Quote.belongsTo(User, { as: 'vendor', foreignKey: 'vendorId' });

User.hasMany(Inquiry, { as: 'inquiries', foreignKey: 'fromUserId' });
Inquiry.belongsTo(User, { as: 'sender', foreignKey: 'fromUserId' });
Inquiry.belongsTo(User, { as: 'recipient', foreignKey: 'toUserId' });

module.exports = {
  sequelize,
  User,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
  RFQ,
  Quote,
  Inquiry
};
