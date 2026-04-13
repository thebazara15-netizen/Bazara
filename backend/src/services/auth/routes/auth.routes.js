// services/auth/routes/auth.routes.js

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');

router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      companyName,
      phone
    } = req.body;

    // ✅ ADD THIS HERE (VERY IMPORTANT POSITION)
    if (role === "ADMIN") {
      return res.status(403).json({
        message: "Admin cannot be created"
      });
    }

    // 🔽 Existing logic continues below
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      companyName,
      phone
    });

    res.status(201).json({
      message: "User registered successfully",
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});
router.post('/login', authController.login);

module.exports = router;