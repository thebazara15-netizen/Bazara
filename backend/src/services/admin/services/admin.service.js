const User = require('../../../models/user');
const Order = require('../../../models/Order');
const Product = require('../../../models/Product');
const logger = require('../../../utils/logger');
const { getDisplayPrice } = require('../../../utils/pricingEngine');

exports.getUsers = async () => {
  return await User.findAll({
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']]
  });
};

exports.approveVendor = async (id) => {
  const user = await User.findByPk(id);

  if (!user) throw new Error('User not found');

  user.isVerified = true;
  await user.save();

  const sanitizedUser = user.toJSON();
  delete sanitizedUser.password;

  return sanitizedUser;
};

exports.getOrders = async () => {
  return await Order.findAll({
    order: [['createdAt', 'DESC']]
  });
};

exports.getProducts = async () => {
  const products = await Product.findAll({
    order: [['createdAt', 'DESC']]
  });

  return products.map((product) => ({
    ...product.toJSON(),
    finalPrice: getDisplayPrice(product)
  }));
};

exports.updateMargin = async (id, margin) => {
  const product = await Product.findByPk(id);

  if (!product) {
    throw new Error('Product not found');
  }

  const parsedMargin = Number(margin);

  if (!Number.isFinite(parsedMargin) || parsedMargin < 0) {
    throw new Error('Margin must be a valid percentage');
  }

  product.margin = parsedMargin;
  product.finalPrice = getDisplayPrice({
    ...product.toJSON(),
    margin: parsedMargin
  });

  await product.save();

  return {
    ...product.toJSON(),
    finalPrice: getDisplayPrice(product)
  };
};

// ✅ NEW: Admin can edit any vendor's product
exports.editProduct = async (id, data, files) => {
  const product = await Product.findByPk(id);

  if (!product) {
    throw new Error('Product not found');
  }

  // ✅ Update all fields that admin sends
  const { name, description, category, moq, stock, basePrice, margin } = data;

  if (name) product.name = name;
  if (description) product.description = description;
  if (category) product.category = category;
  if (moq) product.moq = Number(moq);
  if (stock) product.stock = Number(stock);
  if (basePrice) product.basePrice = Number(basePrice);
  if (margin !== undefined) product.margin = Number(margin);

  // ✅ Update images if new ones are uploaded
  if (files && files.length > 0) {
    product.images = files.map(file => file.filename);
  }

  // ✅ Recalculate finalPrice with new values
  product.finalPrice = getDisplayPrice({
    ...product.toJSON(),
    margin: product.margin
  });

  await product.save();

  return {
    ...product.toJSON(),
    finalPrice: getDisplayPrice(product)
  };
};

// ✅ NEW: Admin can delete any product
exports.deleteProduct = async (id) => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new Error('Product not found');
    }

    await product.destroy();
    
    return { message: 'Product deleted successfully' };
  } catch (error) {
    logger.error('Admin delete product error:', error);
    throw error;
  }
};
