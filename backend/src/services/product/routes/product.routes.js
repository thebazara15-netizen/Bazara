const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const upload = require('../../../middleware/upload.middleware');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');

// ✅ UPDATED: Handle multiple images with upload.array()
router.post('/', upload.array('images', 10), productController.createProduct);

// ✅ IMPORTANT: Specific routes MUST come before generic /:id routes
router.get('/vendor/my-products', auth, role(['VENDOR']), productController.getVendorProducts);

// ✅ NEW: Delete vendor's own product
router.delete('/:id', auth, role(['VENDOR']), productController.deleteVendorProduct);

// GET all products (for clients/public)
router.get('/', productController.getProducts);

module.exports = router;