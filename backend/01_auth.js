// ============================================
//  01_auth.js — Authentication Routes
// ============================================
//  Handles user signup and login.
//  Uses JWT tokens for authentication.
//
//  Routes:
//    POST /auth/signup  — Create a new user
//    POST /auth/login   — Login and get a token
//
//  Exported:
//    authMiddleware — protect routes in other files
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
  fullname: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  dob: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// ──────────────────────────────────────────────
//  AUTH MIDDLEWARE
// ──────────────────────────────────────────────
//  This function checks if the request has a valid JWT token.
//  Other route files (like 02_customers.js) import and use this.
//
//  Usage in Postman (for protected routes):
//    Header Key   : Authorization
//    Header Value : Bearer <your_token_here>
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
//  POST /auth/signup
// ──────────────────────────────────────────────
//  Creates a new user account and returns a JWT token.
//
//  Postman:
//    Method : POST
//    URL    : http://localhost:3000/auth/signup
//    Headers: Content-Type: application/json
//    Body   : (raw JSON)
//      {
//        "username": "john",
//        "password": "secret123"
//      }
//
//  Success Response (201):
//      {
//        "token": "eyJhbGciOi...",
//        "username": "john"
//      }
//
//  Error Responses:
//    400 — "Username and password are required."
//    400 — "Username already taken."
//    500 — "Server error. Please try again."
// ──────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { fullname, username, dob, password } = req.body;

    // Check if fields are provided
    if (!fullname || !username || !dob || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const trimmedFullname = fullname.trim();
    if (trimmedFullname.length < 3) {
      return res.status(400).json({ message: 'Fullname must be at least 3 characters long.' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long.' });
    }

    if (!/^[a-z0-9]+$/.test(trimmedUsername)) {
      return res.status(400).json({ message: 'Username must contain only lowercase letters and numbers.' });
    }

    // Check password length and complexity
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least 1 letter and 1 number.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    // Convert fullname to Title Case
    const toTitleCase = (str) => {
      return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    const titleCaseFullname = toTitleCase(trimmedFullname);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = new User({
      fullname: titleCaseFullname,
      username: trimmedUsername,
      dob: dob.trim(),
      password: hashedPassword
    });
    await user.save();

    // Create a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, username: user.username, fullname: user.fullname });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ──────────────────────────────────────────────
//  POST /auth/login
// ──────────────────────────────────────────────
//  Logs in an existing user and returns a JWT token.
//
//  Postman:
//    Method : POST
//    URL    : http://localhost:3000/auth/login
//    Headers: Content-Type: application/json
//    Body   : (raw JSON)
//      {
//        "username": "john",
//        "password": "secret123"
//      }
//
//  Success Response (200):
//      {
//        "token": "eyJhbGciOi...",
//        "username": "john"
//      }
//
//  Error Responses:
//    400 — "Username and password are required."
//    400 — "Invalid username or password."
//    500 — "Server error. Please try again."
// ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if fields are provided
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const lowercaseUsername = username.toLowerCase().trim();

    // Find the user
    const user = await User.findOne({ username: lowercaseUsername });
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

    res.json({ token, username: user.username, fullname: user.fullname });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Export the router AND the middleware
//  (so 02_customers.js can use authMiddleware)
module.exports = router;
module.exports.authMiddleware = authMiddleware;
