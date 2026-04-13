const User = require('../../../models/user');
const Order = require('../../../models/Order');
const Product = require('../../../models/Product');
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
