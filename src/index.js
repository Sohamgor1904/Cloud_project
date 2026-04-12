/**
 * SmartWaste — src/index.js
 * Member 2 — Backend Developer (Express entry point)
 *
 * HOW TO RUN:
 *   1. Copy .env.example to .env and fill in DB credentials
 *   2. npm install
 *   3. npm run dev   (or: node src/index.js)
 *   4. Server starts at http://localhost:3000
 *
 * Without PostgreSQL the server still runs — binService uses in-memory fallback.
 */
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const binRouter  = require('./routes/binRouter');
const routeRouter = require('./routes/routeRouter');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — allow Member 1's frontend to call the API (add your domain in production)
app.use(cors({
  origin: [
    'http://localhost:8765',    // python http.server dev
    'http://localhost:5173',    // vite dev server
    'http://localhost:3000',    // same origin
    /localhost/,                // any localhost port
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serve Member 1's static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API ROUTES ────────────────────────────────────────────────────────────
app.use('/api/bins',  binRouter);
app.use('/api/route', routeRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'SmartWaste API',
    version:   '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Catch-all → serve frontend (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'landing.html'));
});

// ── ERROR HANDLER ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[API Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error:   err.message || 'Internal server error',
    status,
  });
});

// ── START ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n♻  SmartWaste API running at http://localhost:${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}/landing.html`);
  console.log(`   Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`   API docs: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
