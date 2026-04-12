const Product = require('../../../models/Product');

// Create Product
exports.createProduct = async (data, user) => {
  return await Product.create({
    ...data,
    vendorId: user.id
  });
};

// Get All Products
exports.getProducts = async () => {
  return await Product.findAll();
};