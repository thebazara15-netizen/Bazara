const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');

router.post('/attempt', auth, role(['CLIENT']), paymentController.createPaymentAttempt);
router.post('/attempt/:id/verify-client', auth, role(['CLIENT']), paymentController.verifyClientPayment);
router.post('/checkout-order', auth, role(['CLIENT']), paymentController.legacyDisabled);
router.post('/verify', auth, role(['CLIENT']), paymentController.legacyDisabled);

module.exports = router;
