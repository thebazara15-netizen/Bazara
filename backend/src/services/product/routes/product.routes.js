const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const upload = require('../../../middleware/upload.middleware');

// ✅ UPDATED: Handle multiple images with upload.array()
router.post('/', upload.array('images', 10), productController.createProduct);

// ✅ NEW: Get only vendor's own products
router.get('/vendor/my-products', productController.getVendorProducts);

// GET all products (for clients/public)
router.get('/', productController.getProducts);

module.exports = router;