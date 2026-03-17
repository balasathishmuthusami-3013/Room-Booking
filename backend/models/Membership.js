/**
 * models/Membership.js
 * Defines the 3 membership package tiers and tracks customer purchases.
 */
const mongoose = require('mongoose');

// ── Package config (admin-editable, stored in DB) ────────────
const membershipPackageSchema = new mongoose.Schema({
  tier: {
    type: String,
    enum: ['silver', 'gold', 'platinum'],
    required: true,
    unique: true,
  },
  name: { type: String, required: true },          // e.g. "Silver Circle"
  price: { type: Number, required: true },          // INR
  freeBookings: { type: Number, required: true },   // free room bookings included
  benefits: [{ type: String }],                     // bullet list of perks
  color: { type: String, default: '#a0aec0' },      // gradient hint for UI
  icon: { type: String, default: '🥈' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ── Individual customer membership purchase ───────────────────
const membershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tier: {
    type: String,
    enum: ['silver', 'gold', 'platinum'],
    required: true,
  },
  // Snapshot of package at time of purchase
  packageSnapshot: {
    name: String,
    price: Number,
    freeBookings: Number,
    benefits: [String],
    color: String,
    icon: String,
  },
  // Remaining free bookings
  freeBookingsRemaining: { type: Number, default: 0 },
  // Personal details filled before payment
  fullName:   { type: String, required: true },
  email:      { type: String, required: true },
  phone:      { type: String, required: true },
  dob:        { type: String },
  address:    { type: String },
  // Payment
  pricePaid:  { type: Number, required: true },
  paymentRef: { type: String },
  // Card ID
  membershipId: { type: String, unique: true },
  status:     { type: String, enum: ['active','expired','cancelled'], default: 'active' },
  expiresAt:  { type: Date },
}, { timestamps: true });

membershipSchema.pre('save', function(next) {
  if (!this.membershipId) {
    const yr  = new Date().getFullYear();
    const uid = Math.random().toString(36).substring(2, 8).toUpperCase();
    const tier = this.tier.slice(0,3).toUpperCase();
    this.membershipId = `AMG-${tier}-${yr}-${uid}`;
  }
  if (!this.expiresAt) {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    this.expiresAt = d;
  }
  next();
});

const MembershipPackage = mongoose.model('MembershipPackage', membershipPackageSchema);
const Membership        = mongoose.model('Membership', membershipSchema);

module.exports = { MembershipPackage, Membership };
