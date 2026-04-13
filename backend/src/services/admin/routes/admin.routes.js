const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');

// Only ADMIN allowed
router.get('/users', auth, role(['ADMIN']), adminController.getUsers);

router.put('/approve/:id', auth, role(['ADMIN']), adminController.approveVendor);

router.get('/orders', auth, role(['ADMIN']), adminController.getOrders);

// ✅ Margin API
router.put('/product/:id/margin', auth, role(['ADMIN']), adminController.updateMargin);
router.get('/products', auth, role(['ADMIN']), adminController.getProducts);

module.exports = router;
