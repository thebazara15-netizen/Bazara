const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const upload = require('../../../middleware/upload.middleware');

// ✅ THIS LINE IS THE KEY FIX
router.post('/', upload.single('image'), productController.createProduct);

// GET products
router.get('/', productController.getProducts);

module.exports = router;