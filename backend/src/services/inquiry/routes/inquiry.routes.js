const express = require('express');
const router = express.Router();

const controller = require('../controllers/inquiry.controller');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');

router.post('/', auth, role(['CLIENT']), controller.createInquiry);
router.get('/vendor', auth, role(['VENDOR']), controller.getVendorInquiries);
router.get('/my', auth, role(['CLIENT']), controller.getMyInquiries);
router.patch('/:id/status', auth, role(['VENDOR']), controller.updateInquiryStatus);

module.exports = router;
