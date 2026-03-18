/**
 * models/Booking.js — Booking Schema
 * Central model with full pricing breakdown and status management
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },

    // ─── Stay Dates ───────────────────────────────────
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    numberOfNights: {
      type: Number,
      required: true,
      min: 1,
    },

    // ─── Guests ───────────────────────────────────────
    guests: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0 },
    },

    // ─── Pricing Breakdown ────────────────────────────
    pricing: {
      pricePerNight: { type: Number, required: true },
      baseAmount: { type: Number, required: true },    // pricePerNight × nights
      discountAmount: { type: Number, default: 0 },
      taxAmount: { type: Number, required: true },     // 12%
      serviceCharge: { type: Number, required: true }, // 5%
      totalAmount: { type: Number, required: true },   // Final payable
    },

    // ─── Status Flow ──────────────────────────────────
    // pending → confirmed (on payment) → cancelled
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'no_show'],
      default: 'pending',
    },

    // ─── Payment ──────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'partially_refunded', 'failed'],
      default: 'unpaid',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },

    // ─── Special Requests ─────────────────────────────
    specialRequests: { type: String, maxlength: 500 },
    guestNotes: { type: String },

    // ─── Cancellation ─────────────────────────────────
    cancellation: {
      cancelledAt: Date,
      reason: String,
      refundAmount: { type: Number, default: 0 },
      refundPercent: { type: Number, default: 0 },
      refundStatus: {
        type: String,
        enum: ['none', 'initiated', 'processed'],
        default: 'none',
      },
    },

    // ─── Check-in Request ─────────────────────────────
    checkInRequest: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      requestedAt: Date,
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String,
    },

    // ─── Check-out Request ────────────────────────────
    checkOutRequest: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      requestedAt: Date,
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String,
    },

    // ─── Admin flags ──────────────────────────────────
    isModified: { type: Boolean, default: false },
    modificationHistory: [
      {
        modifiedAt: Date,
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changes: Object,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });

// ─── Virtual: Is currently active (within stay) ───────
bookingSchema.virtual('isActive').get(function () {
  const now = new Date();
  return (
    this.status === 'confirmed' &&
    this.checkIn <= now &&
    this.checkOut >= now
  );
});

module.exports = mongoose.model('Booking', bookingSchema);
