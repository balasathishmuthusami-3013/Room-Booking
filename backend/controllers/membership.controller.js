/**
 * controllers/membership.controller.js
 */
const { MembershipPackage, Membership } = require('../models/Membership');
const AppError = require('../utils/AppError');
const logger   = require('../utils/logger');

// Seed default packages if none exist
async function seedDefaultPackages() {
  const count = await MembershipPackage.countDocuments();
  if (count > 0) return;
  await MembershipPackage.insertMany([
    {
      tier: 'silver', name: 'Silver Circle', price: 10000, freeBookings: 5,
      color: 'from-gray-400 to-slate-500', icon: '🥈',
      benefits: ['5 free room bookings', '5% off dining', 'Welcome drink on arrival', 'Late checkout 1PM', 'Priority support'],
    },
    {
      tier: 'gold', name: 'Gold Prestige', price: 25000, freeBookings: 15,
      color: 'from-amber-400 to-yellow-500', icon: '🥇',
      benefits: ['15 free room bookings', '10% off all services', 'Free airport transfer', 'Room upgrade on arrival', 'Access to exclusive events', 'Personal concierge', 'Complimentary breakfast'],
    },
    {
      tier: 'platinum', name: 'Platinum Elite', price: 60000, freeBookings: 40,
      color: 'from-purple-500 to-indigo-600', icon: '💎',
      benefits: ['40 free room bookings', '20% off everything', 'Personal butler', 'Guaranteed suite upgrade', 'Private dining access', 'Unlimited spa access', 'Airport limo both ways', 'Dedicated relationship manager', 'Complimentary minibar'],
    },
  ]);
  logger.info('[Membership] Default packages seeded');
}
seedDefaultPackages().catch(e => logger.warn('[Membership] Seed error: ' + e.message));

// GET /api/memberships/packages
exports.getPackages = async (req, res, next) => {
  try {
    const packages = await MembershipPackage.find({ isActive: true }).sort({ price: 1 });
    res.json({ status: 'success', data: { packages } });
  } catch (e) { next(e); }
};

// PUT /api/memberships/packages/:tier  (admin)
exports.updatePackage = async (req, res, next) => {
  try {
    const { tier } = req.params;
    const { price, freeBookings, benefits, name, icon, color } = req.body;
    const pkg = await MembershipPackage.findOneAndUpdate(
      { tier },
      { ...(price !== undefined && { price }), ...(freeBookings !== undefined && { freeBookings }), ...(benefits && { benefits }), ...(name && { name }), ...(icon && { icon }), ...(color && { color }) },
      { new: true, runValidators: true }
    );
    if (!pkg) throw new AppError(`Package "${tier}" not found`, 404);
    logger.info(`[Membership] Admin updated ${tier} package`);
    res.json({ status: 'success', data: { package: pkg } });
  } catch (e) { next(e); }
};

// POST /api/memberships/purchase
exports.purchaseMembership = async (req, res, next) => {
  try {
    const { tier, fullName, email, phone, dob, address, paymentRef } = req.body;
    if (!tier || !fullName || !email || !phone) throw new AppError('tier, fullName, email, phone are required', 400);

    const pkg = await MembershipPackage.findOne({ tier, isActive: true });
    if (!pkg) throw new AppError(`Package "${tier}" not found or inactive`, 404);

    // Cancel any existing active membership for this user+tier
    await Membership.updateMany({ user: req.user._id, tier, status: 'active' }, { status: 'cancelled' });

    const mem = await Membership.create({
      user: req.user._id,
      tier,
      packageSnapshot: { name: pkg.name, price: pkg.price, freeBookings: pkg.freeBookings, benefits: pkg.benefits, color: pkg.color, icon: pkg.icon },
      freeBookingsRemaining: pkg.freeBookings,
      fullName, email, phone, dob: dob || '', address: address || '',
      pricePaid: pkg.price,
      paymentRef: paymentRef || `DEMO-${Date.now()}`,
    });

    logger.info(`[Membership] User ${req.user._id} purchased ${tier} — ID: ${mem.membershipId}`);
    res.status(201).json({ status: 'success', data: { membership: mem } });
  } catch (e) { next(e); }
};

// GET /api/memberships/my
exports.getMyMemberships = async (req, res, next) => {
  try {
    const memberships = await Membership.find({ user: req.user._id, status: 'active' }).sort('-createdAt');
    res.json({ status: 'success', data: { memberships } });
  } catch (e) { next(e); }
};

// GET /api/memberships  (admin)
exports.getAllMemberships = async (req, res, next) => {
  try {
    const memberships = await Membership.find().populate('user', 'name email').sort('-createdAt').limit(200);
    res.json({ status: 'success', data: { memberships } });
  } catch (e) { next(e); }
};
