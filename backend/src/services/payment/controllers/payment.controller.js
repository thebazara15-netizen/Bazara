const paymentService = require('../services/payment.service');

exports.createCheckoutOrder = async (req, res) => {
  try {
    const paymentOrder = await paymentService.createCheckoutOrder(req.user.id, req.body?.address);
    res.json(paymentOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const result = await paymentService.verifyAndPlaceOrder(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
