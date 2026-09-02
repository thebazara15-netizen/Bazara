// services/auth/controllers/auth.controller.js

const authService = require('../services/auth.service');
const logger = require('../../../utils/logger');

// Register
exports.register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    logger.error('Register error', error);
    const isConflict = error?.code === 'EMAIL_EXISTS' || error?.name === 'SequelizeUniqueConstraintError';
    const validationMessages = {
      INVALID_EMAIL: 'Enter a valid email address',
      WEAK_PASSWORD: 'Password must be at least 8 characters long',
      INVALID_ROLE: 'Account role must be CLIENT or VENDOR'
    };
    res.status(isConflict ? 409 : 400).json({
      message: isConflict
        ? 'An account with this email already exists'
        : validationMessages[error?.code] || 'Unable to register account'
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Login error', error);
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

exports.socialConfig = (req, res) => {
  res.json(authService.getSocialConfig());
};

exports.socialLogin = (req, res) => {
  authService.startSocialLogin(req.params.provider, req, res);
};

exports.socialCallback = async (req, res) => {
  try {
    await authService.handleSocialCallback(req.params.provider, req, res);
  } catch (error) {
    logger.error('Social login error', error);
    res.status(400).json({ message: 'Social login failed' });
  }
};
