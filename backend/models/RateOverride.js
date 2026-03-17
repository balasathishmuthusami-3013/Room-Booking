/**
 * models/RateOverride.js
 * Allows admin to manually override Amadeus hotel room prices
 */

const mongoose = require('mongoose');

const rateOverrideSchema = new mongoose.Schema(
  {
    hotelId: {
      type: String,
      required: true,
      trim: true,
    },
    offerId: {
      type: String,
      trim: true,
      default: null, // null = applies to all offers of this hotel
    },
    overridePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Compound index: one active override per hotel+offer combo
rateOverrideSchema.index({ hotelId: 1, offerId: 1 }, { unique: false });

module.exports = mongoose.model('RateOverride', rateOverrideSchema);
