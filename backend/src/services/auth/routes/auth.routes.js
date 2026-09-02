// services/auth/routes/auth.routes.js

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authRateLimit = require('../../../middleware/auth-rate-limit.middleware');

router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.get('/social-config', authController.socialConfig);
router.get('/:provider', authController.socialLogin);
router.get('/:provider/callback', authController.socialCallback);

module.exports = router;
