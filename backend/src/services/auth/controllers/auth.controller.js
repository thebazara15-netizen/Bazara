// services/auth/controllers/auth.controller.js

const authService = require('../services/auth.service');

// Register
exports.register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};