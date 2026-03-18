/**
 * server.js — Application Entry Point
 * Production-ready: Render + MongoDB Atlas + Netlify
 */

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB      = require('./config/database');
const logger         = require('./utils/logger');
const errorHandler   = require('./middleware/errorHandler');

// ─── Route Imports ────────────────────────────────────
const authRoutes       = require('./routes/auth.routes');
const roomRoutes       = require('./routes/room.routes');
const bookingRoutes    = require('./routes/booking.routes');
const paymentRoutes    = require('./routes/payment.routes');
const chatRoutes       = require('./routes/chat.routes');
const adminRoutes      = require('./routes/admin.routes');
const userRoutes       = require('./routes/user.routes');
const hotelRoutes      = require('./routes/hotels.routes');
const membershipRoutes = require('./routes/membership.routes');
const cityHotelRoutes  = require('./routes/cityHotel.routes');
const spaBookingRoutes = require('./routes/spaBooking.routes');

const app = express();

// ─── Database ─────────────────────────────────────────
connectDB();

// ─── Allowed Origins (supports multiple Netlify URLs) ─
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,           // e.g. https://your-site.netlify.app
  process.env.CLIENT_URL_ALT,       // optional second frontend URL
].filter(Boolean);

// ─── Security ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", 'js.stripe.com'],
      frameSrc:   ['js.stripe.com'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Also allow any *.netlify.app subdomain for preview deploys
    if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight
app.options('*', cors());

// ─── Rate Limiting ─────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts.' },
});
app.use(globalLimiter);

// ─── Static Uploads ───────────────────────────────────
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// ─── Body Parsing ─────────────────────────────────────
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ─── Health Check ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db: 'connected',
  });
});

// ─── API Routes ───────────────────────────────────────
app.use('/api/auth',        authLimiter, authRoutes);
app.use('/api/rooms',       roomRoutes);
app.use('/api/bookings',    bookingRoutes);
app.use('/api/payments',    paymentRoutes);
app.use('/api/chat',        chatRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/hotels',      hotelRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/cities',      cityHotelRoutes);
app.use('/api/spa-bookings',spaBookingRoutes);

// ─── 404 ──────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🏨 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM — shutting down gracefully');
  server.close(() => process.exit(0));
});
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
