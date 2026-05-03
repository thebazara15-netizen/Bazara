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
    res.status(400).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Login error', error);
    res.status(400).json({ message: error.message });
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
    res.status(400).json({ message: error.message });
  }
};
