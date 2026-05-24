// ============================================
//  server.js — Main Express Server
// ============================================
//  This is the single entry point for the backend.
//  It connects to MongoDB and mounts all route files.
//
//  BASE URL: http://localhost:3000
//
//  Mounted Routes:
//    /auth       → 01_auth.js     (signup, login)
//    /customers  → 02_customers.js (CRUD)
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
require('dotenv').config();

// ── Fix MongoDB Atlas DNS issue ────────────
//  Some ISPs/networks block SRV record lookups.
//  Using Google & Cloudflare DNS servers fixes this.
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

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

// ── Track server start time ────────────────
const SERVER_START_TIME = new Date();

// ──────────────────────────────────────────────
//  GET /
// ──────────────────────────────────────────────
//  Status page — shows a nice HTML dashboard with
//  server info, MongoDB status, uptime, and API docs.
//
//  Postman:
//    Method : GET
//    URL    : http://localhost:3000/
//    Headers: none
//    Body   : none
// ──────────────────────────────────────────────
app.get('/', (req, res) => {
  const u = process.uptime();
  const up = `${String(Math.floor(u/3600)).padStart(2,'0')}:${String(Math.floor((u%3600)/60)).padStart(2,'0')}:${String(Math.floor(u%60)).padStart(2,'0')}`;
  const db = mongoose.connection.readyState === 1;
  const started = SERVER_START_TIME.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Customer List API</title>
<style>*{margin:0;padding:0}body{font-family:system-ui,sans-serif;height:100vh;display:flex;align-items:center;justify-content:center}
.c{text-align:center}.t{font-size:1.2rem;margin-bottom:24px}.s{font-size:.85rem;color:#333;margin:6px 0}.u{font-family:monospace;font-size:2rem;margin:20px 0;color:#222}.st{font-size:.75rem;color:#999}</style>
</head><body><div class="c">
<div class="t">📋 Customer List API</div>
<div class="s">🟢 Server running</div>
<div class="s">${db ? '🟢' : '🔴'} MongoDB ${db ? 'connected' : 'disconnected'}</div>
<div class="u">${up}</div>
<div class="st">started ${started}</div>
</div></body></html>`);
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
