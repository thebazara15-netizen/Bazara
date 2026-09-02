const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');
const controller = require('../controllers/account.controller');

router.get('/profile', auth, role(['CLIENT']), controller.getProfile);
router.put('/profile', auth, role(['CLIENT']), controller.updateProfile);
router.get('/addresses', auth, role(['CLIENT']), controller.getAddresses);
router.post('/addresses', auth, role(['CLIENT']), controller.createAddress);
router.put('/addresses/:id', auth, role(['CLIENT']), controller.updateAddress);
router.delete('/addresses/:id', auth, role(['CLIENT']), controller.deleteAddress);

module.exports = router;
