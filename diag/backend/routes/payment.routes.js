/**
 * routes/payment.routes.js — All payment gateway routes
 */
const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

// ─── Stripe webhook (no auth, raw body) ──────────────────
router.post('/stripe/webhook', ctrl.stripeWebhook);

// ─── Protected: User payment routes ──────────────────────
router.use(protect);

// Stripe (international cards)
router.post('/stripe/create-intent', ctrl.createStripeIntent);

// Razorpay (India)
router.post('/razorpay/create-order', ctrl.createRazorpayOrder);
router.post('/razorpay/verify', ctrl.verifyRazorpayPayment);

// International (multi-currency Stripe)
router.post('/international/create-intent', ctrl.createInternationalIntent);
router.post('/international/confirm', ctrl.confirmInternationalPayment);

// Cryptocurrency
router.post('/crypto/create', ctrl.createCryptoPayment);
router.post('/crypto/confirm', ctrl.confirmCryptoPayment);
router.get('/crypto/status/:paymentId', ctrl.getCryptoStatus);

// Demo (dev/testing)
router.post('/demo', ctrl.processDemo);

// Refund (admin only)
router.post('/refund/:bookingId', authorize('admin'), ctrl.processRefund);

module.exports = router;
