const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');
const controller = require('../controllers/checkout.controller');

router.post('/draft', auth, role(['CLIENT']), controller.createDraft);
router.get('/draft/:id', auth, role(['CLIENT']), controller.getDraft);
router.post('/draft/:id/prepare-order', auth, role(['CLIENT']), controller.prepareOrder);

module.exports = router;
