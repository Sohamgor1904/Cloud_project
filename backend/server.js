/**
 * backend/server.js
 * SmartWaste Express entry point
 *
 * HOW TO RUN:
 *   npm install
 *   npm run dev          →  http://localhost:3000
 *   Open: http://localhost:3000   (serves frontend/pages/home.html)
 */
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const authRoutes   = require('./routes/authRoutes');
const binRoutes    = require('./routes/binRoutes');
const routeRoutes  = require('./routes/routeRoutes');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET','POST','OPTIONS'] }));

// ── Serve frontend static files ───────────────────────────────────────────
// CSS, JS, and pages are in ../frontend/
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/bins',  binRoutes);
app.use('/api/route', routeRoutes);

// ── Health check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', service: 'SmartWaste API', version: '2.0', time: new Date() })
);

// ── Root redirect → home page ─────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/pages/home.html'));
app.get('/home', (req, res) => res.redirect('/pages/home.html'));
app.get('/login', (req, res) => res.redirect('/pages/login.html'));
app.get('/signup', (req, res) => res.redirect('/pages/signup.html'));
app.get('/dashboard', (req, res) => res.redirect('/pages/dashboard.html'));

// ── Global error handler ──────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n♻  SmartWaste running at http://localhost:${PORT}`);
  console.log(`   Home:      http://localhost:${PORT}/pages/home.html`);
  console.log(`   Login:     http://localhost:${PORT}/pages/login.html`);
  console.log(`   Dashboard: http://localhost:${PORT}/pages/dashboard.html`);
  console.log(`   API:       http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
