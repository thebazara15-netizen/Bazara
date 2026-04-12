const orderService = require('../services/order.service');

exports.placeOrder = async (req, res) => {
  try {
    const order = await orderService.placeOrder(req.user.id);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};