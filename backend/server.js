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
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

  const mongoStatus = mongoose.connection.readyState;
  const mongoStates = {
    0: { text: 'Disconnected', color: '#dc3545', icon: '🔴' },
    1: { text: 'Connected', color: '#28a745', icon: '🟢' },
    2: { text: 'Connecting...', color: '#ffc107', icon: '🟡' },
    3: { text: 'Disconnecting...', color: '#ffc107', icon: '🟡' },
  };
  const mongo = mongoStates[mongoStatus] || mongoStates[0];

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Customer List API</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          color: #e0e0e0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          max-width: 720px;
          width: 100%;
        }
        .card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 40px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 8px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle { color: #999; font-size: 0.95rem; margin-bottom: 32px; }
        .status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }
        .status-item {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
        }
        .status-item .label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #888;
          margin-bottom: 8px;
        }
        .status-item .value {
          font-size: 1.1rem;
          font-weight: 600;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        h2 {
          font-size: 1.2rem;
          margin-bottom: 16px;
          color: #b8b8ff;
        }
        .endpoint {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .method {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          min-width: 60px;
          text-align: center;
          letter-spacing: 0.5px;
        }
        .get    { background: rgba(40,167,69,0.2); color: #5cdb6f; }
        .post   { background: rgba(0,123,255,0.2); color: #6bb3ff; }
        .put    { background: rgba(255,193,7,0.2); color: #ffd84d; }
        .delete { background: rgba(220,53,69,0.2); color: #ff6b7a; }
        .path { font-family: 'Courier New', monospace; font-size: 0.9rem; }
        .desc { color: #999; font-size: 0.85rem; margin-left: auto; }
        .auth-badge {
          font-size: 0.65rem;
          background: rgba(255,193,7,0.15);
          color: #ffc107;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .footer {
          text-align: center;
          color: #555;
          font-size: 0.8rem;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <h1>📋 Customer List API</h1>
          <p class="subtitle">Backend server for the Customer List application</p>

          <div class="status-grid">
            <div class="status-item">
              <div class="label">Server Status</div>
              <div class="value">
                <span class="badge" style="background:rgba(40,167,69,0.2);color:#5cdb6f;">🟢 Running</span>
              </div>
            </div>
            <div class="status-item">
              <div class="label">MongoDB</div>
              <div class="value">
                <span class="badge" style="background:rgba(40,167,69,0.15);color:${mongo.color};">
                  ${mongo.icon} ${mongo.text}
                </span>
              </div>
            </div>
            <div class="status-item">
              <div class="label">Started At</div>
              <div class="value" style="font-size:0.9rem;">${SERVER_START_TIME.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
            </div>
            <div class="status-item">
              <div class="label">Uptime</div>
              <div class="value">${uptimeStr}</div>
            </div>
            <div class="status-item">
              <div class="label">Environment</div>
              <div class="value" style="font-size:0.9rem;">
                ${process.env.NODE_ENV || 'development'}
              </div>
            </div>
            <div class="status-item">
              <div class="label">Port</div>
              <div class="value">${process.env.PORT || 3000}</div>
            </div>
          </div>

          <h2>🔗 API Endpoints</h2>

          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="path">/auth/signup</span>
            <span class="desc">Create account</span>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="path">/auth/login</span>
            <span class="desc">Login & get token</span>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/customers</span>
            <span class="auth-badge">🔒 AUTH</span>
            <span class="desc">List your customers</span>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="path">/customers</span>
            <span class="auth-badge">🔒 AUTH</span>
            <span class="desc">Add customer</span>
          </div>
          <div class="endpoint">
            <span class="method put">PUT</span>
            <span class="path">/customers/:id</span>
            <span class="auth-badge">🔒 AUTH</span>
            <span class="desc">Update customer</span>
          </div>
          <div class="endpoint">
            <span class="method delete">DELETE</span>
            <span class="path">/customers/:id</span>
            <span class="auth-badge">🔒 AUTH</span>
            <span class="desc">Delete customer</span>
          </div>
        </div>

        <p class="footer">
          Customer List API v1.0.0 &nbsp;·&nbsp; Node.js ${process.version}
        </p>
      </div>
    </body>
    </html>
  `);
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
