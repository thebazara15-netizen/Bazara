'use strict';

const BUYER_STATUSES = ['DRAFT', 'PENDING_PAYMENT', 'PLACED', 'CANCELLED'];
const SELLER_STATUSES = ['DRAFT', 'PENDING_PAYMENT', 'PLACED', 'CANCELLED'];
const money = (Sequelize) => ({ type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 });

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    await queryInterface.createTable('BuyerOrders', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      buyerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      status: { type: Sequelize.ENUM(...BUYER_STATUSES), allowNull: false, defaultValue: 'DRAFT' },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      subtotalPaise: money(Sequelize),
      shippingPaise: money(Sequelize),
      taxPaise: money(Sequelize),
      discountPaise: money(Sequelize),
      grandTotalPaise: money(Sequelize),
      shippingAddressSnapshot: { type: Sequelize.JSON, allowNull: false },
      billingAddressSnapshot: { type: Sequelize.JSON, allowNull: false },
      checkoutReference: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }, { transaction });
    await queryInterface.addIndex('BuyerOrders', ['buyerId'], { name: 'buyer_orders_buyer_id_idx', transaction });
    await queryInterface.addIndex('BuyerOrders', ['status'], { name: 'buyer_orders_status_idx', transaction });

    await queryInterface.createTable('SellerOrders', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      buyerOrderId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'BuyerOrders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      vendorId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      status: { type: Sequelize.ENUM(...SELLER_STATUSES), allowNull: false, defaultValue: 'DRAFT' },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      subtotalPaise: money(Sequelize),
      shippingPaise: money(Sequelize),
      taxPaise: money(Sequelize),
      discountPaise: money(Sequelize),
      grandTotalPaise: money(Sequelize),
      sellerSnapshot: { type: Sequelize.JSON, allowNull: false },
      freightMode: { type: Sequelize.STRING(30), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }, { transaction });
    await queryInterface.addConstraint('SellerOrders', { fields: ['buyerOrderId', 'vendorId'], type: 'unique', name: 'seller_orders_buyer_vendor_unique', transaction });
    await queryInterface.addIndex('SellerOrders', ['buyerOrderId'], { name: 'seller_orders_buyer_order_id_idx', transaction });
    await queryInterface.addIndex('SellerOrders', ['vendorId'], { name: 'seller_orders_vendor_id_idx', transaction });

    await queryInterface.createTable('BuyerOrderItems', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      sellerOrderId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'SellerOrders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      productId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      vendorId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      productName: { type: Sequelize.STRING(255), allowNull: false },
      descriptionSnapshot: { type: Sequelize.TEXT, allowNull: true },
      imageUrlSnapshot: { type: Sequelize.STRING(2048), allowNull: true },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit: { type: Sequelize.STRING(30), allowNull: false },
      moqSnapshot: { type: Sequelize.INTEGER, allowNull: false },
      unitPricePaise: money(Sequelize),
      lineSubtotalPaise: money(Sequelize),
      discountPaise: money(Sequelize),
      taxableValuePaise: money(Sequelize),
      gstRateBasisPoints: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      cgstPaise: money(Sequelize),
      sgstPaise: money(Sequelize),
      igstPaise: money(Sequelize),
      taxTotalPaise: money(Sequelize),
      lineTotalPaise: money(Sequelize),
      hsnCode: { type: Sequelize.STRING(20), allowNull: true },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }, { transaction });
    await queryInterface.addIndex('BuyerOrderItems', ['sellerOrderId'], { name: 'buyer_order_items_seller_order_id_idx', transaction });
    await queryInterface.addIndex('BuyerOrderItems', ['productId'], { name: 'buyer_order_items_product_id_idx', transaction });
    await queryInterface.addIndex('BuyerOrderItems', ['vendorId'], { name: 'buyer_order_items_vendor_id_idx', transaction });
  },

  async down(queryInterface, Sequelize, transaction) {
    await queryInterface.dropTable('BuyerOrderItems', { transaction });
    await queryInterface.dropTable('SellerOrders', { transaction });
    await queryInterface.dropTable('BuyerOrders', { transaction });
  }
};
