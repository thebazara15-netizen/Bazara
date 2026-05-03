const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');
const upload = require('../../../middleware/upload.middleware');

// Only ADMIN allowed
router.get('/users', auth, role(['ADMIN']), adminController.getUsers);

router.put('/approve/:id', auth, role(['ADMIN']), adminController.approveVendor);

router.get('/orders', auth, role(['ADMIN']), adminController.getOrders);

// ✅ Margin API
router.put('/product/:id/margin', auth, role(['ADMIN']), adminController.updateMargin);
router.get('/products', auth, role(['ADMIN']), adminController.getProducts);

// ✅ NEW: Admin can edit any vendor's product
router.put('/product/:id/edit', auth, role(['ADMIN']), upload.array('images', 10), adminController.editProduct);

// ✅ NEW: Admin can delete any product
router.delete('/product/:id', auth, role(['ADMIN']), adminController.deleteProduct);

module.exports = router;
