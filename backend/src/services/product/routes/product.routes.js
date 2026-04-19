const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const upload = require('../../../middleware/upload.middleware');

// ✅ UPDATED: Handle multiple images with upload.array()
router.post('/', upload.array('images', 10), productController.createProduct);

// GET products
router.get('/', productController.getProducts);

module.exports = router;