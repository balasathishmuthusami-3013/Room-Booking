/**
 * models/LoyaltyProgram.js — Loyalty Program Configuration
 * Admin-editable tiers, thresholds, and perks
 */

const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '🏅' },
  minPoints: { type: Number, required: true },
  maxPoints: { type: Number, default: null }, // null = unlimited (top tier)
  perks: [{ type: String }],
  color: { type: String, default: '#b8894a' },
});

const loyaltyChangeSchema = new mongoose.Schema({
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminEmail: { type: String },
  action: { type: String, required: true },
  detail: { type: String },
  changedAt: { type: Date, default: Date.now },
});

const loyaltyProgramSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: true },
    programName: { type: String, default: 'Axopay Loyalty Program' },
    description: { type: String },
    pointsPerDollar: { type: Number, default: 1 },
    tiers: [tierSchema],
    changeHistory: [loyaltyChangeSchema],
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);
