const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');
const controller = require('../controllers/wishlist.controller');

router.get('/', auth, role(['CLIENT']), controller.getWishlist);
router.post('/:productId', auth, role(['CLIENT']), controller.addWishlistItem);
router.delete('/:productId', auth, role(['CLIENT']), controller.removeWishlistItem);

module.exports = router;
