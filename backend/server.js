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
  const uptime = process.uptime();
  const hrs = String(Math.floor(uptime / 3600)).padStart(2, '0');
  const mins = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0');
  const secs = String(Math.floor(uptime % 60)).padStart(2, '0');
  const mongoOk = mongoose.connection.readyState === 1;
  const startedAt = SERVER_START_TIME.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer List API</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#111;color:#fff;height:100vh;display:flex;align-items:center;justify-content:center}
    .wrap{text-align:center}
    h1{font-size:1.4rem;font-weight:500;letter-spacing:-.5px;margin-bottom:32px;color:#fff}
    .row{display:flex;gap:40px;justify-content:center;margin-bottom:28px}
    .item .label{font-size:.6rem;text-transform:uppercase;letter-spacing:2px;color:#555;margin-bottom:6px}
    .item .val{font-size:.9rem;font-weight:500}
    .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;position:relative;top:-1px}
    .green{background:#4ade80;box-shadow:0 0 6px #4ade8066}
    .red{background:#f87171;box-shadow:0 0 6px #f8717166}
    .time{font-family:'Courier New',monospace;font-size:1.6rem;font-weight:600;color:#888;letter-spacing:2px;margin-bottom:8px}
    .started{font-size:.7rem;color:#444}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Customer List API</h1>
    <div class="row">
      <div class="item">
        <div class="label">Server</div>
        <div class="val"><span class="dot green"></span>Running</div>
      </div>
      <div class="item">
        <div class="label">MongoDB</div>
        <div class="val"><span class="dot ${mongoOk ? 'green' : 'red'}"></span>${mongoOk ? 'Connected' : 'Disconnected'}</div>
      </div>
    </div>
    <div class="time">${hrs}:${mins}:${secs}</div>
    <div class="started">started ${startedAt}</div>
  </div>
</body>
</html>`);
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
