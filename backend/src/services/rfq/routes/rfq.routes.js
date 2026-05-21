const express = require('express');
const router = express.Router();

const controller = require('../controllers/rfq.controller');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');

router.get('/', controller.getRfqs);
router.post('/', auth, role(['CLIENT']), controller.createRfq);
router.get('/my', auth, role(['CLIENT']), controller.getMyRfqs);
router.get('/vendor/quotes', auth, role(['VENDOR']), controller.getVendorQuotes);
router.post('/:id/quotes', auth, role(['VENDOR']), controller.createQuote);
router.patch('/quotes/:id/status', auth, role(['CLIENT']), controller.updateQuoteStatus);

module.exports = router;
