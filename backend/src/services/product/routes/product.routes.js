const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const upload = require('../../../middleware/upload.middleware');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');

const uploadProductImages = (req, res, next) => {
  upload.array('images', 10)(req, res, (error) => {
    if (!error) return next();

    if (String(error.code || '').startsWith('LIMIT_') || error.status === 400) {
      return res.status(400).json({ message: 'Invalid product image upload' });
    }

    return res.status(400).json({ message: 'Unable to upload product images' });
  });
};

router.post(
  '/',
  auth,
  role(['VENDOR']),
  uploadProductImages,
  productController.createProduct
);

router.get('/vendor/my-products', auth, role(['VENDOR']), productController.getVendorProducts);
router.delete('/:id', auth, role(['VENDOR']), productController.deleteVendorProduct);
router.get('/', productController.getProducts);
router.get('/meta/categories', productController.getProductCategories);
router.get('/:id', productController.getProductById);

module.exports = router;
