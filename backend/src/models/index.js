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
const WishlistItem = require('./WishlistItem');
const Address = require('./Address');
const BuyerOrder = require('./BuyerOrder');
const SellerOrder = require('./SellerOrder');
const BuyerOrderItem = require('./BuyerOrderItem');
const CheckoutDraft = require('./CheckoutDraft');
const SellerTaxProfile = require('./SellerTaxProfile');
const SellerShippingPolicy = require('./SellerShippingPolicy');
const InventoryReservation = require('./InventoryReservation');
const PaymentAttempt = require('./PaymentAttempt');
const PaymentEvent = require('./PaymentEvent');
const Conversation = require('./Conversation');
const ConversationParticipant = require('./ConversationParticipant');
const Message = require('./Message');

// Define associations
User.hasMany(Product, { as: 'products', foreignKey: 'vendorId' });
Product.belongsTo(User, { as: 'vendor', foreignKey: 'vendorId' });

User.hasMany(Cart, { as: 'carts', foreignKey: 'userId' });
Cart.belongsTo(User, { as: 'user', foreignKey: 'userId' });

Cart.hasMany(CartItem, { as: 'items', foreignKey: 'cartId' });
CartItem.belongsTo(Cart, { as: 'cart', foreignKey: 'cartId' });
CartItem.belongsTo(Product, { as: 'product', foreignKey: 'productId' });
Product.hasMany(CartItem, { as: 'cartItems', foreignKey: 'productId' });

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

User.hasMany(Inquiry, { as: 'buyerInquiries', foreignKey: 'buyerId' });
Inquiry.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
User.hasMany(Inquiry, { as: 'vendorInquiries', foreignKey: 'vendorId' });
Inquiry.belongsTo(User, { as: 'vendor', foreignKey: 'vendorId' });
Product.hasMany(Inquiry, { as: 'inquiries', foreignKey: 'productId' });
Inquiry.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

User.hasMany(WishlistItem, { as: 'wishlistItems', foreignKey: 'userId' });
WishlistItem.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Product.hasMany(WishlistItem, { as: 'wishlistItems', foreignKey: 'productId' });
WishlistItem.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

User.hasMany(Address, { as: 'addresses', foreignKey: 'userId' });
Address.belongsTo(User, { as: 'user', foreignKey: 'userId' });

User.hasMany(BuyerOrder, { as: 'buyerOrders', foreignKey: 'buyerId' });
BuyerOrder.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
BuyerOrder.hasMany(SellerOrder, { as: 'sellerOrders', foreignKey: 'buyerOrderId' });
SellerOrder.belongsTo(BuyerOrder, { as: 'buyerOrder', foreignKey: 'buyerOrderId' });
User.hasMany(SellerOrder, { as: 'sellerOrders', foreignKey: 'vendorId' });
SellerOrder.belongsTo(User, { as: 'vendor', foreignKey: 'vendorId' });
SellerOrder.hasMany(BuyerOrderItem, { as: 'items', foreignKey: 'sellerOrderId' });
BuyerOrderItem.belongsTo(SellerOrder, { as: 'sellerOrder', foreignKey: 'sellerOrderId' });
Product.hasMany(BuyerOrderItem, { as: 'buyerOrderItems', foreignKey: 'productId' });
BuyerOrderItem.belongsTo(Product, { as: 'productReference', foreignKey: 'productId' });

User.hasMany(CheckoutDraft, { as: 'checkoutDrafts', foreignKey: 'buyerId' });
CheckoutDraft.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
Address.hasMany(CheckoutDraft, { as: 'shippingCheckoutDrafts', foreignKey: 'shippingAddressId' });
CheckoutDraft.belongsTo(Address, { as: 'shippingAddress', foreignKey: 'shippingAddressId' });
Address.hasMany(CheckoutDraft, { as: 'billingCheckoutDrafts', foreignKey: 'billingAddressId' });
CheckoutDraft.belongsTo(Address, { as: 'billingAddress', foreignKey: 'billingAddressId' });
CheckoutDraft.hasOne(BuyerOrder, { as: 'preparedOrder', foreignKey: 'checkoutDraftId' });
BuyerOrder.belongsTo(CheckoutDraft, { as: 'checkoutDraft', foreignKey: 'checkoutDraftId' });

BuyerOrder.hasMany(InventoryReservation, { as: 'inventoryReservations', foreignKey: 'buyerOrderId' });
InventoryReservation.belongsTo(BuyerOrder, { as: 'buyerOrder', foreignKey: 'buyerOrderId' });
BuyerOrderItem.hasOne(InventoryReservation, { as: 'inventoryReservation', foreignKey: 'buyerOrderItemId' });
InventoryReservation.belongsTo(BuyerOrderItem, { as: 'buyerOrderItem', foreignKey: 'buyerOrderItemId' });
Product.hasMany(InventoryReservation, { as: 'inventoryReservations', foreignKey: 'productId' });
InventoryReservation.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

BuyerOrder.hasMany(PaymentAttempt, { as: 'paymentAttempts', foreignKey: 'buyerOrderId' });
PaymentAttempt.belongsTo(BuyerOrder, { as: 'buyerOrder', foreignKey: 'buyerOrderId' });
User.hasMany(PaymentAttempt, { as: 'paymentAttempts', foreignKey: 'buyerId' });
PaymentAttempt.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
PaymentAttempt.hasMany(PaymentEvent, { as: 'paymentEvents', foreignKey: 'paymentAttemptId' });
PaymentEvent.belongsTo(PaymentAttempt, { as: 'paymentAttempt', foreignKey: 'paymentAttemptId' });

User.hasMany(Conversation,{as:'buyerConversations',foreignKey:'buyerId'});Conversation.belongsTo(User,{as:'buyer',foreignKey:'buyerId'});
User.hasMany(Conversation,{as:'vendorConversations',foreignKey:'vendorId'});Conversation.belongsTo(User,{as:'vendor',foreignKey:'vendorId'});
Inquiry.hasOne(Conversation,{as:'conversation',foreignKey:'inquiryId'});Conversation.belongsTo(Inquiry,{as:'inquiry',foreignKey:'inquiryId'});
Conversation.hasMany(ConversationParticipant,{as:'participants',foreignKey:'conversationId'});ConversationParticipant.belongsTo(Conversation,{as:'conversation',foreignKey:'conversationId'});
User.hasMany(ConversationParticipant,{as:'conversationMemberships',foreignKey:'userId'});ConversationParticipant.belongsTo(User,{as:'user',foreignKey:'userId'});
Conversation.hasMany(Message,{as:'messages',foreignKey:'conversationId'});Message.belongsTo(Conversation,{as:'conversation',foreignKey:'conversationId'});
User.hasMany(Message,{as:'sentMessages',foreignKey:'senderId'});Message.belongsTo(User,{as:'sender',foreignKey:'senderId'});

User.hasOne(SellerTaxProfile, { as: 'taxProfile', foreignKey: 'vendorId' });
SellerTaxProfile.belongsTo(User, { as: 'vendor', foreignKey: 'vendorId' });
User.hasOne(SellerShippingPolicy, { as: 'shippingPolicy', foreignKey: 'vendorId' });
SellerShippingPolicy.belongsTo(User, { as: 'vendor', foreignKey: 'vendorId' });

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
  Inquiry,
  WishlistItem,
  Address,
  BuyerOrder,
  SellerOrder,
  BuyerOrderItem,
  CheckoutDraft,
  SellerTaxProfile,
  SellerShippingPolicy,
  InventoryReservation,
  PaymentAttempt,
  PaymentEvent,
  Conversation,
  ConversationParticipant,
  Message
};
