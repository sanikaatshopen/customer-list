// ============================================
//  server.js — Main Express Server
// ============================================
//  This is the single entry point for the backend.
//  It connects to MongoDB and mounts all route files.
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────
app.use(cors()); // Allow requests from Angular dev server
app.use(express.json()); // Parse JSON request bodies

// ── Routes ─────────────────────────────────
//  Each route file handles one feature area.
//  To add a new feature, create a new file (e.g. 03_details.js)
//  and mount it here with app.use().

const authRoutes = require('./01_auth');
const customerRoutes = require('./02_customers');

app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);

// ── Health Check ───────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Customer List API is running!' });
});

// ── Connect to MongoDB & Start Server ──────
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
