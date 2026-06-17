// app.js — Express application setup
// server.js is the entry point; this file configures the app itself
// Keeping them separate makes testing easier

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// ─── CORS ───────────────────────────────────────────────────────────────────
// Allow requests from the frontend dev server and production domain
const allowedOrigins = [
  'http://localhost:5173',
  'https://programlink-cotz.vercel.app',
  'https://cacfplink.com',
  'https://www.cacfplink.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app subdomain (covers preview deployments)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────────────────
// Simple endpoint for deployment platforms to verify the server is running
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'programlink-api', timestamp: new Date().toISOString() });
});

// ─── Local file uploads (dev only — in production files go to S3) ────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
