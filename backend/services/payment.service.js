/**
 * services/payment.service.js — Multi-Gateway Payment Service
 *
 * Supported Gateways:
 *  1. Stripe          — International cards (Visa, MC, Amex, etc.)
 *  2. Razorpay        — Indian payments (UPI, Net Banking, Cards)
 *  3. Cryptocurrency  — BTC, ETH, USDT, BNB (simulated for demo)
 *  4. International   — Stripe with multi-currency support
 */

const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ─── Lazy Stripe init ─────────────────────────────────
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your')) {
    throw new AppError('Stripe is not configured. Add STRIPE_SECRET_KEY to .env', 500);
  }
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
};

// ─── Lazy Razorpay init ───────────────────────────────
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_your')) {
    throw new AppError('Razorpay is not configured. Add RAZORPAY_KEY_ID to .env', 500);
  }
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

// ─── Crypto wallet addresses (demo — replace with real in prod) ──
const CRYPTO_WALLETS = {
  BTC:  process.env.CRYPTO_BTC_WALLET  || '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf...',
  ETH:  process.env.CRYPTO_ETH_WALLET  || '0x742d35Cc6634C0532925a3b8D4C9Bb0...',
  USDT: process.env.CRYPTO_USDT_WALLET || '0x742d35Cc6634C0532925a3b8D4C9Bb0...',
  BNB:  process.env.CRYPTO_BNB_WALLET  || 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn7...',
};

// Simulated crypto exchange rates (in prod: fetch from CoinGecko API)
const CRYPTO_RATES = { BTC: 65000, ETH: 3200, USDT: 1, BNB: 580 };

class PaymentService {

  // ══════════════════════════════════════════════════════════
  //  STRIPE — International Cards
  // ══════════════════════════════════════════════════════════

  static async createStripePaymentIntent(bookingId, userId) {
    const booking = await Booking.findById(bookingId).populate('room user');
    if (!booking) throw new AppError('Booking not found.', 404);
    if (String(booking.user._id) !== String(userId)) throw new AppError('Unauthorized.', 403);
    if (booking.paymentStatus === 'paid') throw new AppError('Booking already paid.', 400);

    const stripe = getStripe();
    const amountInCents = Math.round(booking.pricing.totalAmount * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { bookingId: String(booking._id), userId: String(userId) },
    });

    const payment = await Payment.create({
      booking: booking._id,
      user: userId,
      gateway: 'stripe',
      amount: amountInCents,
      currency: 'usd',
      status: 'pending',
      stripe: { paymentIntentId: intent.id, clientSecret: intent.client_secret },
    });

    return {
      clientSecret: intent.client_secret,
      paymentId: payment._id,
      amount: booking.pricing.totalAmount,
      currency: 'USD',
    };
  }

  static async handleStripeWebhook(rawBody, signature) {
    const stripe = getStripe();
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw new AppError(`Webhook Error: ${err.message}`, 400);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const payment = await Payment.findOne({ 'stripe.paymentIntentId': intent.id });
      if (payment) {
        payment.status = 'success';
        payment.paidAt = new Date();
        payment.stripe.chargeId = intent.latest_charge;
        await payment.save();
        await this._confirmBooking(payment.booking);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const payment = await Payment.findOne({ 'stripe.paymentIntentId': intent.id });
      if (payment) {
        payment.status = 'failed';
        payment.failureReason = intent.last_payment_error?.message;
        await payment.save();
      }
    }
    return { received: true };
  }

  static async processStripeRefund(bookingId) {
    const stripe = getStripe();
    const payment = await Payment.findOne({ booking: bookingId, gateway: 'stripe', status: 'success' });
    if (!payment) throw new AppError('No successful Stripe payment found.', 404);

    const refund = await stripe.refunds.create({ charge: payment.stripe.chargeId });
    payment.status = 'refunded';
    payment.amountRefunded = refund.amount;
    payment.stripe.refundId = refund.id;
    payment.refundedAt = new Date();
    await payment.save();
    return refund;
  }

  // ══════════════════════════════════════════════════════════
  //  RAZORPAY — India (UPI / Cards / Net Banking)
  // ══════════════════════════════════════════════════════════

  static async createRazorpayOrder(bookingId, userId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError('Booking not found.', 404);
    if (String(booking.user) !== String(userId)) throw new AppError('Unauthorized.', 403);

    const razorpay = getRazorpay();
    const amountInPaise = Math.round(booking.pricing.totalAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: { bookingId: String(bookingId) },
    });

    const payment = await Payment.create({
      booking: bookingId,
      user: userId,
      gateway: 'razorpay',
      amount: amountInPaise,
      currency: 'INR',
      status: 'pending',
      razorpay: { orderId: order.id },
    });

    return {
      orderId: order.id,
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: 'INR',
    };
  }

  static async verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      const payment = await Payment.findOne({ 'razorpay.orderId': razorpayOrderId });
      if (payment) { payment.status = 'failed'; payment.failureReason = 'Signature mismatch'; await payment.save(); }
      throw new AppError('Invalid payment signature. Payment verification failed.', 400);
    }

    const payment = await Payment.findOne({ 'razorpay.orderId': razorpayOrderId });
    if (!payment) throw new AppError('Payment record not found.', 404);

    payment.status = 'success';
    payment.paidAt = new Date();
    payment.razorpay.paymentId = razorpayPaymentId;
    payment.razorpay.signature = razorpaySignature;
    await payment.save();
    await this._confirmBooking(payment.booking);

    return { success: true, paymentId: payment._id };
  }

  // ══════════════════════════════════════════════════════════
  //  INTERNATIONAL — Stripe with multi-currency
  // ══════════════════════════════════════════════════════════

  static async createInternationalIntent(bookingId, userId, { currency = 'usd', country } = {}) {
    const booking = await Booking.findById(bookingId).populate('room user');
    if (!booking) throw new AppError('Booking not found.', 404);
    if (String(booking.user._id) !== String(userId)) throw new AppError('Unauthorized.', 403);
    if (booking.paymentStatus === 'paid') throw new AppError('Booking already paid.', 400);

    const stripe = getStripe();
    const amountInSmallestUnit = Math.round(booking.pricing.totalAmount * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        bookingId: String(booking._id),
        userId: String(userId),
        gateway: 'international',
        country: country || 'international',
      },
    });

    const payment = await Payment.create({
      booking: booking._id,
      user: userId,
      gateway: 'international',
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      status: 'pending',
      international: {
        country,
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
      },
      stripe: { paymentIntentId: intent.id, clientSecret: intent.client_secret },
    });

    return {
      clientSecret: intent.client_secret,
      paymentId: payment._id,
      amount: booking.pricing.totalAmount,
      currency: currency.toUpperCase(),
    };
  }

  static async confirmInternationalPayment(paymentIntentId, paymentDetails) {
    const payment = await Payment.findOne({ 'stripe.paymentIntentId': paymentIntentId });
    if (!payment) throw new AppError('Payment record not found.', 404);

    // In production the webhook handles this; this is for demo/manual confirmation
    payment.status = 'success';
    payment.paidAt = new Date();
    if (paymentDetails) {
      payment.international.cardBrand = paymentDetails.cardBrand;
      payment.international.last4 = paymentDetails.last4;
    }
    await payment.save();
    await this._confirmBooking(payment.booking);

    return { success: true, paymentId: payment._id };
  }

  // ══════════════════════════════════════════════════════════
  //  CRYPTOCURRENCY — BTC, ETH, USDT, BNB
  // ══════════════════════════════════════════════════════════

  static async createCryptoPayment(bookingId, userId, { coin = 'USDT' }) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError('Booking not found.', 404);
    if (String(booking.user) !== String(userId)) throw new AppError('Unauthorized.', 403);
    if (booking.paymentStatus === 'paid') throw new AppError('Booking already paid.', 400);

    const supportedCoins = ['BTC', 'ETH', 'USDT', 'BNB'];
    if (!supportedCoins.includes(coin.toUpperCase())) {
      throw new AppError(`Unsupported coin. Choose: ${supportedCoins.join(', ')}`, 400);
    }

    const upperCoin = coin.toUpperCase();
    const usdAmount = booking.pricing.totalAmount;
    const rate = CRYPTO_RATES[upperCoin];
    const amountInCrypto = parseFloat((usdAmount / rate).toFixed(8));
    const walletAddress = CRYPTO_WALLETS[upperCoin];

    // 30 minutes to pay
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const payment = await Payment.create({
      booking: bookingId,
      user: userId,
      gateway: 'crypto',
      amount: usdAmount,
      currency: 'usd',
      status: 'pending',
      crypto: {
        coin: upperCoin,
        network: upperCoin === 'BTC' ? 'mainnet' : upperCoin === 'ETH' ? 'ethereum' : 'polygon',
        walletAddress,
        amountInCrypto,
        exchangeRate: rate,
        confirmations: 0,
        requiredConfirmations: upperCoin === 'BTC' ? 3 : 12,
        expiresAt,
      },
    });

    return {
      paymentId: payment._id,
      coin: upperCoin,
      walletAddress,
      amountInCrypto,
      amountInUSD: usdAmount,
      exchangeRate: rate,
      expiresAt,
      network: payment.crypto.network,
      requiredConfirmations: payment.crypto.requiredConfirmations,
    };
  }

  static async confirmCryptoPayment(paymentId, { txHash, coin }) {
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.gateway !== 'crypto') throw new AppError('Crypto payment not found.', 404);
    if (payment.status === 'success') return { success: true, alreadyConfirmed: true };

    // In production: verify txHash on blockchain via Infura/Alchemy/BlockCypher API
    // For demo: simulate successful confirmation
    payment.crypto.txHash = txHash;
    payment.crypto.confirmations = payment.crypto.requiredConfirmations;
    payment.status = 'success';
    payment.paidAt = new Date();
    await payment.save();
    await this._confirmBooking(payment.booking);

    return { success: true, paymentId: payment._id, txHash };
  }

  static async getCryptoPaymentStatus(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new AppError('Payment not found.', 404);

    // Check expiry
    if (payment.crypto?.expiresAt && new Date() > payment.crypto.expiresAt && payment.status === 'pending') {
      payment.status = 'expired';
      await payment.save();
    }

    return {
      status: payment.status,
      confirmations: payment.crypto?.confirmations || 0,
      requiredConfirmations: payment.crypto?.requiredConfirmations || 3,
      txHash: payment.crypto?.txHash,
      expiresAt: payment.crypto?.expiresAt,
    };
  }

  // ══════════════════════════════════════════════════════════
  //  DEMO — Simulate payment for dev/testing
  // ══════════════════════════════════════════════════════════

  static async processDemo(bookingId, userId, method = 'demo') {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError('Booking not found.', 404);
    if (String(booking.user) !== String(userId)) throw new AppError('Unauthorized.', 403);

    const payment = await Payment.create({
      booking: bookingId,
      user: userId,
      gateway: 'stripe',
      amount: Math.round(booking.pricing.totalAmount * 100),
      currency: 'usd',
      status: 'success',
      paidAt: new Date(),
      metadata: { method, demo: true },
    });

    await this._confirmBooking(bookingId);
    return { success: true, paymentId: payment._id };
  }

  // ─── Shared: Mark booking as confirmed ────────────────────
  static async _confirmBooking(bookingId) {
    try {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'paid',
        status: 'confirmed',
        $push: {
          statusHistory: {
            status: 'confirmed',
            changedAt: new Date(),
            note: 'Payment received — booking confirmed automatically',
          },
        },
      });
      logger.info(`Booking ${bookingId} confirmed after successful payment.`);
    } catch (err) {
      logger.error(`Failed to confirm booking ${bookingId}:`, err);
    }
  }
}

module.exports = PaymentService;
