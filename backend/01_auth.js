// ============================================
//  01_auth.js — Authentication Routes
// ============================================
//  Handles user signup and login.
//  Uses JWT tokens for authentication.
//
//  Routes:
//    POST /auth/signup  — Create a new user
//    POST /auth/login   — Login and get a token
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const router = express.Router();

// ── User Model ─────────────────────────────
//  Kept in this file for simplicity.
//  A student can move it to a separate models/ folder later.

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// ── Auth Middleware ─────────────────────────
//  This function checks if the request has a valid JWT token.
//  Other route files (like 02_customers.js) import and use this.

function authMiddleware(req, res, next) {
  // Get token from the Authorization header
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided. Please login.' });
  }

  // Token format: "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Attach user ID to the request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// ── POST /auth/signup ──────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if fields are provided
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = new User({ username, password: hashedPassword });
    await user.save();

    // Create a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /auth/login ───────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if fields are provided
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Create a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Export the router AND the middleware
//  (so 02_customers.js can use authMiddleware)
module.exports = router;
module.exports.authMiddleware = authMiddleware;
