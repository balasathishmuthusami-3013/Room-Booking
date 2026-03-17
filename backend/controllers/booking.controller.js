/**
 * controllers/booking.controller.js — Booking CRUD + Check-in/Check-out Requests
 */

const BookingService = require('../services/booking.service');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');

// POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const booking = await BookingService.createBooking(req.user._id, req.body);
    res.status(201).json({ status: 'success', data: { booking } });
  } catch (err) { next(err); }
};

// GET /api/bookings/my — Customer's own bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('room', 'name type images pricePerNight roomNumber')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: { bookings, total, page: Number(page) },
    });
  } catch (err) { next(err); }
};

// GET /api/bookings/:id
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('user', 'name email phone')
      .populate('payment');

    if (!booking) throw new AppError('Booking not found.', 404);

    // Customers can only view their own bookings
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized.', 403);
    }

    res.json({ status: 'success', data: { booking } });
  } catch (err) { next(err); }
};

// PATCH /api/bookings/:id/cancel
exports.cancelBooking = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const { reason } = req.body;

    const { booking, refundInfo } = await BookingService.cancelBooking(
      req.params.id, req.user._id, reason, isAdmin
    );

    res.json({
      status: 'success',
      data: { booking, refund: refundInfo },
      message: `Booking cancelled. Refund: $${refundInfo.refundAmount} (${refundInfo.refundPercent}%)`,
    });
  } catch (err) { next(err); }
};

// GET /api/bookings — Admin: all bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('room', 'name roomNumber type images hotelName hotelId cityName cityId pricePerNight')
        .populate('user', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.json({ status: 'success', data: { bookings, total } });
  } catch (err) { next(err); }
};

// PATCH /api/bookings/:id/confirm-demo — Demo payment confirmation
// Used by the demo PaymentGateway to actually confirm the booking in DB
exports.confirmDemoPayment = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new AppError('Booking not found.', 404);

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('Not authorized.', 403);
    }

    if (booking.status !== 'pending') {
      return res.json({ status: 'success', data: { booking }, message: 'Already confirmed.' });
    }

    await Booking.findByIdAndUpdate(req.params.id, {
      status: 'confirmed',
      paymentStatus: 'paid',
    });

    const updated = await Booking.findById(req.params.id);
    res.json({ status: 'success', data: { booking: updated } });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────
//  CHECK-IN / CHECK-OUT REQUEST FLOW
// ─────────────────────────────────────────────────────────────────

/**
 * PATCH /api/bookings/:id/request-checkin
 * Customer submits a check-in request on their check-in date
 */
exports.requestCheckIn = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room', 'name roomNumber');
    if (!booking) throw new AppError('Booking not found.', 404);

    // Only booking owner
    if (booking.user.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized.', 403);
    }

    if (booking.status !== 'confirmed') {
      throw new AppError('Only confirmed bookings can request check-in.', 400);
    }

    if (booking.checkInRequest && booking.checkInRequest.status === 'pending') {
      throw new AppError('Check-in request already submitted. Please wait for admin approval.', 400);
    }

    // Date validation: must be on or after check-in date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDay = new Date(booking.checkIn);
    checkInDay.setHours(0, 0, 0, 0);

    if (today < checkInDay) {
      throw new AppError(
        `Check-in is only available on or after ${checkInDay.toDateString()}.`,
        400
      );
    }

    booking.checkInRequest = {
      status: 'pending',
      requestedAt: new Date(),
    };
    await booking.save();

    res.json({
      status: 'success',
      message: 'Check-in request submitted. Admin will verify and approve shortly.',
      data: { booking },
    });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/bookings/:id/request-checkout
 * Customer submits a check-out request on their check-out date
 */
exports.requestCheckOut = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room', 'name roomNumber');
    if (!booking) throw new AppError('Booking not found.', 404);

    if (booking.user.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized.', 403);
    }

    if (booking.status !== 'checked_in') {
      throw new AppError('You must be checked in before requesting check-out.', 400);
    }

    if (booking.checkOutRequest && booking.checkOutRequest.status === 'pending') {
      throw new AppError('Check-out request already submitted. Please wait for admin approval.', 400);
    }

    // Date validation: must be on or after check-out date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOutDay = new Date(booking.checkOut);
    checkOutDay.setHours(0, 0, 0, 0);

    if (today < checkOutDay) {
      throw new AppError(
        `Check-out is only available on or after ${checkOutDay.toDateString()}.`,
        400
      );
    }

    booking.checkOutRequest = {
      status: 'pending',
      requestedAt: new Date(),
    };
    await booking.save();

    res.json({
      status: 'success',
      message: 'Check-out request submitted. Admin will process shortly.',
      data: { booking },
    });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/bookings/:id/approve-checkin  [admin]
 * Admin approves or rejects a check-in request
 */
exports.approveCheckIn = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('room', 'name roomNumber');

    if (!booking) throw new AppError('Booking not found.', 404);
    if (!booking.checkInRequest || booking.checkInRequest.status !== 'pending') {
      throw new AppError('No pending check-in request for this booking.', 400);
    }

    if (action === 'approve') {
      booking.status = 'checked_in';
      booking.checkInRequest.status = 'approved';
    } else if (action === 'reject') {
      booking.checkInRequest.status = 'rejected';
      booking.checkInRequest.rejectionReason = rejectionReason || 'Rejected by admin';
    } else {
      throw new AppError('Action must be "approve" or "reject".', 400);
    }

    booking.checkInRequest.reviewedAt = new Date();
    booking.checkInRequest.reviewedBy = req.user._id;
    await booking.save();

    res.json({
      status: 'success',
      message: action === 'approve' ? 'Check-in approved successfully.' : 'Check-in request rejected.',
      data: { booking },
    });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/bookings/:id/approve-checkout  [admin]
 * Admin approves or rejects a check-out request
 */
exports.approveCheckOut = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('room', 'name roomNumber');

    if (!booking) throw new AppError('Booking not found.', 404);
    if (!booking.checkOutRequest || booking.checkOutRequest.status !== 'pending') {
      throw new AppError('No pending check-out request for this booking.', 400);
    }

    if (action === 'approve') {
      booking.status = 'checked_out';
      booking.checkOutRequest.status = 'approved';
    } else if (action === 'reject') {
      booking.checkOutRequest.status = 'rejected';
      booking.checkOutRequest.rejectionReason = rejectionReason || 'Rejected by admin';
    } else {
      throw new AppError('Action must be "approve" or "reject".', 400);
    }

    booking.checkOutRequest.reviewedAt = new Date();
    booking.checkOutRequest.reviewedBy = req.user._id;
    await booking.save();

    res.json({
      status: 'success',
      message: action === 'approve' ? 'Check-out approved successfully.' : 'Check-out request rejected.',
      data: { booking },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/bookings/checkin-requests  [admin]
 * List all pending check-in requests
 */
exports.getCheckInRequests = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const bookings = await Booking.find({ 'checkInRequest.status': status })
      .populate('user', 'name email phone')
      .populate('room', 'name roomNumber type images')
      .sort('-checkInRequest.requestedAt');

    res.json({ status: 'success', data: { bookings, total: bookings.length } });
  } catch (err) { next(err); }
};

/**
 * GET /api/bookings/checkout-requests  [admin]
 * List all pending check-out requests
 */
exports.getCheckOutRequests = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const bookings = await Booking.find({ 'checkOutRequest.status': status })
      .populate('user', 'name email phone')
      .populate('room', 'name roomNumber type images')
      .sort('-checkOutRequest.requestedAt');

    res.json({ status: 'success', data: { bookings, total: bookings.length } });
  } catch (err) { next(err); }
};

// PATCH /api/bookings/:id — Admin updates booking
exports.updateBooking = async (req, res, next) => {
  try {
    const allowed = ['status','paymentStatus','checkIn','checkOut','guests','specialRequests'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const booking = await require('../models/Booking').findByIdAndUpdate(
      req.params.id, update, { new: true }
    ).populate('room','name roomNumber type images hotelName cityName')
     .populate('user','name email');
    if (!booking) throw new require('../utils/AppError')('Booking not found', 404);
    res.json({ status:'success', data:{ booking } });
  } catch(e) { next(e); }
};
