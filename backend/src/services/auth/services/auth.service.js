// services/auth/services/auth.service.js

const User = require('../../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
exports.registerUser = async (data) => {
  const {
    email,
    password,
    role = 'CLIENT',
    firstName,
    lastName,
    companyName,
    gstNumber,
    phone
  } = data;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  if (role === 'ADMIN') {
    throw new Error('Admin cannot be created');
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashedPassword,
    role,
    firstName,
    lastName,
    companyName,
    gstNumber,
    phone,
    isVerified: true // ✅ Auto-verify all users on signup (admins can mark as unverified if needed)
  });

  return user;
};

// Login User
exports.loginUser = async (data) => {
  const { email, password } = data;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user };
};
