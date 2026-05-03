const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');

router.post('/checkout-order', auth, role(['CLIENT']), paymentController.createCheckoutOrder);
router.post('/verify', auth, role(['CLIENT']), paymentController.verifyPayment);

module.exports = router;
