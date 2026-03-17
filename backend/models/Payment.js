/**
 * models/Payment.js — Payment Transaction Schema
 * Supports: Stripe (international), Razorpay, Cryptocurrency
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ─── Gateway ──────────────────────────────────────
    gateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'crypto', 'international'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'created', 'processing', 'success', 'failed', 'refunded', 'partially_refunded', 'expired'],
      default: 'pending',
    },

    // ─── Amount ───────────────────────────────────────
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    amountRefunded: { type: Number, default: 0 },

    // ─── Stripe-specific ──────────────────────────────
    stripe: {
      paymentIntentId: String,
      clientSecret: String,
      chargeId: String,
      customerId: String,
      refundId: String,
    },

    // ─── Razorpay-specific ────────────────────────────
    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
      refundId: String,
    },

    // ─── Crypto-specific ──────────────────────────────
    crypto: {
      coin: { type: String },            // BTC, ETH, USDT, BNB
      network: { type: String },         // mainnet, polygon, bsc
      walletAddress: { type: String },   // Destination wallet
      txHash: { type: String },          // Blockchain tx hash
      amountInCrypto: { type: Number },  // Amount in crypto units
      exchangeRate: { type: Number },    // Rate at time of creation
      confirmations: { type: Number, default: 0 },
      requiredConfirmations: { type: Number, default: 3 },
      expiresAt: { type: Date },
    },

    // ─── International card payments ──────────────────
    international: {
      country: { type: String },
      cardBrand: { type: String },
      last4: { type: String },
      paymentIntentId: { type: String },
      clientSecret: { type: String },
    },

    // ─── Metadata ─────────────────────────────────────
    metadata: { type: Object },
    failureReason: { type: String },
    paidAt: { type: Date },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ 'stripe.paymentIntentId': 1 });
paymentSchema.index({ 'razorpay.orderId': 1 });
paymentSchema.index({ 'crypto.walletAddress': 1 });
paymentSchema.index({ gateway: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
