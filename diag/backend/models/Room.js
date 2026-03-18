/**
 * models/Room.js — Room Schema
 * Represents hotel rooms with all pricing and amenity metadata
 */

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['standard', 'deluxe', 'suite', 'penthouse', 'family'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    capacity: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0 },
    },
    size: { type: Number }, // in sqm
    floor: { type: Number },
    images: [{ type: String }], // URLs
    amenities: [{ type: String }], // e.g. ['WiFi', 'AC', 'Mini Bar']
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }, // Soft delete

    // Bed configuration
    bedType: {
      type: String,
      enum: ['single', 'double', 'queen', 'king', 'twin'],
      required: true,
    },
    bedCount: { type: Number, default: 1 },

    // Policies
    smokingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },

    // For analytics
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },

    // Hotel association (optional — links room to admin-managed hotel)
    hotelId:   { type: String, default: '' },
    hotelName: { type: String, default: '' },
    cityId:    { type: String, default: '' },
    cityName:  { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────
roomSchema.index({ type: 1, isAvailable: 1, isActive: 1 });
roomSchema.index({ pricePerNight: 1 });
roomSchema.index({ 'rating.average': -1 });

// ─── Virtual: Effective price after discount ──────────
roomSchema.virtual('effectivePrice').get(function () {
  if (this.discountPercent > 0) {
    return this.pricePerNight * (1 - this.discountPercent / 100);
  }
  return this.pricePerNight;
});

// ─── Method: Update rating after new review ───────────
roomSchema.methods.updateRating = async function (newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// ─── Static: Find available rooms in date range ───────
// This is a helper; actual conflict check is in BookingService
roomSchema.statics.findAvailableRooms = async function (filters = {}) {
  const query = { isActive: true, isAvailable: true, ...filters };
  return this.find(query);
};

module.exports = mongoose.model('Room', roomSchema);
