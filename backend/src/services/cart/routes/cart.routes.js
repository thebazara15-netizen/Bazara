const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cart.controller');
const auth = require('../../../middleware/auth.middleware');

router.get('/', auth, cartController.getCart);
router.post('/', auth, cartController.addToCart);

// Update quantity
router.put('/:id', auth, cartController.updateCart);

// Delete item
router.delete('/:id', auth, cartController.removeFromCart);

module.exports = router;