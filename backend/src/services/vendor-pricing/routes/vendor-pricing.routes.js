const router = require('express').Router();
const auth = require('../../../middleware/auth.middleware');
const role = require('../../../middleware/role.middleware');
const controller = require('../controllers/vendor-pricing.controller');
router.get('/', auth, role(['VENDOR']), controller.get);
router.put('/', auth, role(['VENDOR']), controller.save);
module.exports = router;
