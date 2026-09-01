const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');
const controller = require('../controllers/account.controller');

router.get('/profile', auth, role(['CLIENT']), controller.getProfile);
router.put('/profile', auth, role(['CLIENT']), controller.updateProfile);

module.exports = router;
