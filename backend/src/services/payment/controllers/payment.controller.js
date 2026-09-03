const paymentService = require('../services/payment.service');
const sendError = (res, error) => res.status(error.status || 500).json({ message: error.message, code: error.code || 'PAYMENT_ERROR' });

exports.legacyDisabled = (req, res) => res.status(410).json({ message: 'Legacy cart-based payment flow is disabled', code: 'LEGACY_PAYMENT_DISABLED' });
exports.createPaymentAttempt = async (req, res) => {
  try { res.status(201).json(await paymentService.initiatePaymentAttempt(req.user.id, req.body)); }
  catch (error) { sendError(res, error); }
};
exports.verifyClientPayment = async (req, res) => {
  try { res.json(await paymentService.verifyClientSignature(req.user.id, req.params.id, req.body)); }
  catch (error) { sendError(res, error); }
};
