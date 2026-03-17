/**
 * controllers/admin.controller.js — Dashboard Analytics & Admin Operations
 */

const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const Payment = require('../models/Payment');

// GET /api/admin/dashboard — Analytics aggregation
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalBookings,
      monthlyBookings,
      totalRevenue,
      monthlyRevenue,
      totalUsers,
      activeRooms,
      occupiedRooms,
      bookingsByStatus,
      revenueByMonth,
      topRooms,
    ] = await Promise.all([
      // Total booking count
      Booking.countDocuments(),

      // This month's bookings
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Total revenue from confirmed/paid bookings
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
      ]),

      // Monthly revenue
      Booking.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
      ]),

      // Total customers
      User.countDocuments({ role: 'customer' }),

      // Active rooms
      Room.countDocuments({ isActive: true }),

      // Currently occupied rooms (checked_in status)
      Booking.countDocuments({
        status: 'checked_in',
        checkIn: { $lte: now },
        checkOut: { $gte: now },
      }),

      // Bookings by status
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Revenue trend: last 12 months
      Booking.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfYear } } },
        {
          $group: {
            _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
            revenue: { $sum: '$pricing.totalAmount' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Top performing rooms
      Room.find({ isActive: true })
        .sort('-totalRevenue')
        .limit(5)
        .select('name type totalRevenue totalBookings rating'),
    ]);

    const totalRevenueVal = totalRevenue[0]?.total || 0;
    const monthlyRevenueVal = monthlyRevenue[0]?.total || 0;
    const occupancyRate = activeRooms > 0
      ? ((occupiedRooms / activeRooms) * 100).toFixed(1)
      : 0;

    res.json({
      status: 'success',
      data: {
        summary: {
          totalBookings,
          monthlyBookings,
          totalRevenue: totalRevenueVal,
          monthlyRevenue: monthlyRevenueVal,
          totalUsers,
          activeRooms,
          occupiedRooms,
          occupancyRate: `${occupancyRate}%`,
        },
        bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        revenueByMonth,
        topRooms,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/admin/users — All users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ status: 'success', data: { users, total } });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/toggle-status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ status: 'success', data: { user } });
  } catch (err) { next(err); }
};
