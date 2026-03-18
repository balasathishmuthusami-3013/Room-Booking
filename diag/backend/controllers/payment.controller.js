/**
 * controllers/payment.controller.js — Multi-Gateway Payment Controller
 */

const PaymentService = require('../services/payment.service');
const AppError = require('../utils/AppError');

// ── Stripe (International Cards) ──────────────────────────
exports.createStripeIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const data = await PaymentService.createStripePaymentIntent(bookingId, req.user._id);
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
};

exports.stripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    await PaymentService.handleStripeWebhook(req.body, signature);
    res.json({ received: true });
  } catch (err) { next(err); }
};

// ── Razorpay ──────────────────────────────────────────────
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const data = await PaymentService.createRazorpayOrder(bookingId, req.user._id);
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
};

exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const result = await PaymentService.verifyRazorpayPayment(req.body);
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

// ── International (multi-currency Stripe) ─────────────────
exports.createInternationalIntent = async (req, res, next) => {
  try {
    const { bookingId, currency, country } = req.body;
    const data = await PaymentService.createInternationalIntent(bookingId, req.user._id, { currency, country });
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
};

exports.confirmInternationalPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, cardBrand, last4 } = req.body;
    const result = await PaymentService.confirmInternationalPayment(paymentIntentId, { cardBrand, last4 });
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

// ── Cryptocurrency ─────────────────────────────────────────
exports.createCryptoPayment = async (req, res, next) => {
  try {
    const { bookingId, coin } = req.body;
    const data = await PaymentService.createCryptoPayment(bookingId, req.user._id, { coin });
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
};

exports.confirmCryptoPayment = async (req, res, next) => {
  try {
    const { paymentId, txHash, coin } = req.body;
    const result = await PaymentService.confirmCryptoPayment(paymentId, { txHash, coin });
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

exports.getCryptoStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const status = await PaymentService.getCryptoPaymentStatus(paymentId);
    res.json({ status: 'success', data: status });
  } catch (err) { next(err); }
};

// ── Demo Payment ──────────────────────────────────────────
exports.processDemo = async (req, res, next) => {
  try {
    const { bookingId, method } = req.body;
    const result = await PaymentService.processDemo(bookingId, req.user._id, method);
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

// ── Refund ────────────────────────────────────────────────
exports.processRefund = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { gateway } = req.body;
    let refund;
    if (gateway === 'stripe' || gateway === 'international') {
      refund = await PaymentService.processStripeRefund(bookingId);
    } else {
      throw new AppError('Refunds for this gateway must be processed via dashboard.', 400);
    }
    res.json({ status: 'success', data: { refund } });
  } catch (err) { next(err); }
};
