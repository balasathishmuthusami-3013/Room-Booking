/**
 * models/CityHotel.js
 * Admin-managed cities and hotels (separate from Amadeus live data).
 */
const mongoose = require('mongoose');

// ── City ─────────────────────────────────────────────────────
const citySchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  code:     { type: String, required: true, trim: true, uppercase: true, unique: true },
  tagline:  { type: String, default: '' },
  image:    { type: String, default: '' },    // hero image URL
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ── Hotel ────────────────────────────────────────────────────
const hotelSchema = new mongoose.Schema({
  city:        { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  cityCode:    { type: String, required: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  location:    { type: String, default: '' },
  website:     { type: String, default: '' },
  images:      [{ type: String }],
  starRating:  { type: Number, default: 4, min: 1, max: 5 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

const City  = mongoose.model('City',  citySchema);
const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = { City, Hotel };
