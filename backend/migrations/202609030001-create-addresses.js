'use strict';

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    await queryInterface.createTable('Addresses', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      label: { type: Sequelize.STRING(50), allowNull: true },
      contactName: { type: Sequelize.STRING(120), allowNull: false },
      companyName: { type: Sequelize.STRING(200), allowNull: false },
      phoneCountryCode: { type: Sequelize.STRING(5), allowNull: false, defaultValue: '+91' },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      addressLine1: { type: Sequelize.STRING(255), allowNull: false },
      addressLine2: { type: Sequelize.STRING(255), allowNull: true },
      landmark: { type: Sequelize.STRING(150), allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: false },
      district: { type: Sequelize.STRING(100), allowNull: true },
      state: { type: Sequelize.STRING(100), allowNull: false },
      stateCode: { type: Sequelize.STRING(2), allowNull: false },
      postalCode: { type: Sequelize.STRING(10), allowNull: false },
      countryCode: { type: Sequelize.STRING(2), allowNull: false, defaultValue: 'IN' },
      gstin: { type: Sequelize.STRING(15), allowNull: true },
      isDefaultShipping: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      isDefaultBilling: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }, { transaction });

    await queryInterface.addIndex('Addresses', ['userId'], { name: 'addresses_user_id_idx', transaction });
    await queryInterface.addIndex('Addresses', ['userId', 'isDefaultShipping'], { name: 'addresses_user_default_shipping_idx', transaction });
    await queryInterface.addIndex('Addresses', ['userId', 'isDefaultBilling'], { name: 'addresses_user_default_billing_idx', transaction });
  },

  async down(queryInterface, Sequelize, transaction) {
    await queryInterface.dropTable('Addresses', { transaction });
  }
};
