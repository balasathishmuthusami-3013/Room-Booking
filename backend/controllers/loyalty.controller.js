/**
 * controllers/loyalty.controller.js — Loyalty Program Management
 */

const LoyaltyProgram = require('../models/LoyaltyProgram');
const AppError = require('../utils/AppError');

const DEFAULT_TIERS = [
  { name: 'Bronze', icon: '🥉', minPoints: 0, maxPoints: 499, perks: ['Priority check-in', '5% dining discount', 'Welcome drink'], color: '#cd7f32' },
  { name: 'Silver', icon: '🥈', minPoints: 500, maxPoints: 1499, perks: ['Room upgrade requests', 'Complimentary breakfast', '10% spa discount', 'Late checkout'], color: '#9e9e9e' },
  { name: 'Gold', icon: '🥇', minPoints: 1500, maxPoints: 4999, perks: ['Suite upgrades', 'Airport transfer', '$50 spa credits', 'Priority reservations', 'Dedicated concierge'], color: '#d4a853' },
  { name: 'Diamond', icon: '💎', minPoints: 5000, maxPoints: null, perks: ['Butler service', 'Unlimited upgrades', 'VIP events access', 'Annual luxury gift', 'Private dining'], color: '#64b5f6' },
];

// GET /api/loyalty — Public: view current program
exports.getProgram = async (req, res, next) => {
  try {
    let program = await LoyaltyProgram.findOne();
    if (!program) {
      program = await LoyaltyProgram.create({ tiers: DEFAULT_TIERS });
    }
    res.json({ status: 'success', data: { program } });
  } catch (err) { next(err); }
};

// PATCH /api/loyalty — Admin: update tiers or program details
exports.updateProgram = async (req, res, next) => {
  try {
    let program = await LoyaltyProgram.findOne();
    if (!program) program = await LoyaltyProgram.create({ tiers: DEFAULT_TIERS });

    const { tiers, programName, description, pointsPerDollar, action, detail } = req.body;

    if (tiers) program.tiers = tiers;
    if (programName) program.programName = programName;
    if (description) program.description = description;
    if (pointsPerDollar) program.pointsPerDollar = pointsPerDollar;

    // Log the change
    program.changeHistory.push({
      changedBy: req.user._id,
      adminEmail: req.user.email,
      action: action || 'Program updated',
      detail: detail || 'Configuration updated by admin',
    });

    program.lastUpdatedBy = req.user._id;
    await program.save();

    res.json({ status: 'success', data: { program } });
  } catch (err) { next(err); }
};

// GET /api/loyalty/history — Admin: change log
exports.getHistory = async (req, res, next) => {
  try {
    const program = await LoyaltyProgram.findOne().populate('changeHistory.changedBy', 'name email');
    res.json({ status: 'success', data: { history: program?.changeHistory || [] } });
  } catch (err) { next(err); }
};
