const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cart.controller');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');

router.get('/', auth, role(['CLIENT']), cartController.getCart);
router.post('/', auth, role(['CLIENT']), cartController.addToCart);

// Update quantity
router.put('/:id', auth, role(['CLIENT']), cartController.updateCart);

// Delete item
router.delete('/:id', auth, role(['CLIENT']), cartController.removeFromCart);

module.exports = router;
