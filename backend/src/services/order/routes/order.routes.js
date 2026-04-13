const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');

router.post('/', auth, role(['CLIENT']), orderController.placeOrder);

module.exports = router;
