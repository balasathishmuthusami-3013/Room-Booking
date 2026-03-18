/**
 * server.js — Production Ready for Render + Netlify + MongoDB Atlas
 */

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const connectDB      = require('./config/database');
const logger         = require('./utils/logger');
const errorHandler   = require('./middleware/errorHandler');

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

// ─── CORS ─────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_ALT,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) return callback(null, true);
    logger.warn(`CORS blocked: ${origin}`);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

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

// ─── Rate Limiting ─────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

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

// ─── Root Route (so / doesn't show "not found") ───────
app.get('/', (req, res) => {
  res.json({
    message: '🏨 Hoto.tours Hotel API is running',
    status: 'OK',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api:    '/api',
    },
  });
});

// ─── Health Check ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'OK',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV,
    db:        'connected',
  });
});

// ─── API Routes ───────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/rooms',        roomRoutes);
app.use('/api/bookings',     bookingRoutes);
app.use('/api/payments',     paymentRoutes);
app.use('/api/chat',         chatRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/hotels',       hotelRoutes);
app.use('/api/memberships',  membershipRoutes);
app.use('/api/cities',       cityHotelRoutes);
app.use('/api/spa-bookings', spaBookingRoutes);

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
  server.close(() => process.exit(0));
});
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
