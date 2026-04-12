const User = require('../../../models/user');
const Order = require('../../../models/Order');

// Get all users
exports.getUsers = async () => {
  return await User.findAll();
};

// Approve vendor
exports.approveVendor = async (id) => {
  const user = await User.findByPk(id);

  if (!user) throw new Error('User not found');

  user.isVerified = true;
  await user.save();

  return user;
};

// Get all orders
exports.getOrders = async () => {
  return await Order.findAll();
};