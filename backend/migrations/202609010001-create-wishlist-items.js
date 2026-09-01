'use strict';

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    await queryInterface.createTable('WishlistItems', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Products', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }, { transaction });

    await queryInterface.addConstraint('WishlistItems', {
      fields: ['userId', 'productId'],
      type: 'unique',
      name: 'wishlist_items_user_product_unique',
      transaction
    });
    await queryInterface.addIndex('WishlistItems', ['userId'], {
      name: 'wishlist_items_user_id_idx',
      transaction
    });
    await queryInterface.addIndex('WishlistItems', ['productId'], {
      name: 'wishlist_items_product_id_idx',
      transaction
    });
  },

  async down(queryInterface, Sequelize, transaction) {
    await queryInterface.dropTable('WishlistItems', { transaction });
  }
};
