'use strict';

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    await queryInterface.addColumn('Products', 'hsnCode', { type: Sequelize.STRING(20), allowNull: true }, { transaction });
    await queryInterface.addColumn('Products', 'gstRateBasisPoints', { type: Sequelize.INTEGER, allowNull: true }, { transaction });
    await queryInterface.addColumn('Products', 'unit', { type: Sequelize.STRING(30), allowNull: true }, { transaction });
    await queryInterface.addColumn('Products', 'taxInclusive', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }, { transaction });

    await queryInterface.createTable('SellerTaxProfiles', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      vendorId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      legalName: { type: Sequelize.STRING(200), allowNull: false },
      gstin: { type: Sequelize.STRING(15), allowNull: true },
      state: { type: Sequelize.STRING(100), allowNull: false },
      stateCode: { type: Sequelize.STRING(2), allowNull: false },
      isGstRegistered: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }, { transaction });
    await queryInterface.addConstraint('SellerTaxProfiles', { fields: ['vendorId'], type: 'unique', name: 'seller_tax_profiles_vendor_unique', transaction });

    await queryInterface.createTable('SellerShippingPolicies', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      vendorId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      mode: { type: Sequelize.ENUM('FLAT', 'FREE', 'FREE_ABOVE_THRESHOLD', 'MANUAL_FREIGHT_QUOTE'), allowNull: false },
      flatChargePaise: { type: Sequelize.BIGINT, allowNull: true },
      freeAbovePaise: { type: Sequelize.BIGINT, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }, { transaction });
    await queryInterface.addConstraint('SellerShippingPolicies', { fields: ['vendorId'], type: 'unique', name: 'seller_shipping_policies_vendor_unique', transaction });
    await queryInterface.addIndex('SellerShippingPolicies', ['isActive'], { name: 'seller_shipping_policies_active_idx', transaction });

    // SQLite stores Sequelize ENUM values as TEXT, so it already accepts the new
    // status. Rebuilding this table via changeColumn would weaken Phase 3F's
    // named composite uniqueness and foreign-key actions.
    if (queryInterface.sequelize.getDialect() !== 'sqlite') {
      await queryInterface.changeColumn('CheckoutDrafts', 'pricingStatus', {
        type: Sequelize.ENUM('PARTIAL', 'READY', 'FREIGHT_QUOTE_REQUIRED'), allowNull: false, defaultValue: 'PARTIAL'
      }, { transaction });
    }
  },

  async down(queryInterface, Sequelize, transaction) {
    if (queryInterface.sequelize.getDialect() !== 'sqlite') {
      await queryInterface.changeColumn('CheckoutDrafts', 'pricingStatus', {
        type: Sequelize.ENUM('PARTIAL', 'READY'), allowNull: false, defaultValue: 'PARTIAL'
      }, { transaction });
    }
    await queryInterface.dropTable('SellerShippingPolicies', { transaction });
    await queryInterface.dropTable('SellerTaxProfiles', { transaction });
    await queryInterface.removeColumn('Products', 'taxInclusive', { transaction });
    await queryInterface.removeColumn('Products', 'unit', { transaction });
    await queryInterface.removeColumn('Products', 'gstRateBasisPoints', { transaction });
    await queryInterface.removeColumn('Products', 'hsnCode', { transaction });
  }
};
