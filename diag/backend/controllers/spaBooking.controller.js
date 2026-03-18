const SpaBooking = require('../models/SpaBooking');
const AppError   = require('../utils/AppError');

exports.create = async (req, res, next) => {
  try {
    const b = await SpaBooking.create({ ...req.body, user: req.user?._id, status: 'Pending' });
    res.status(201).json({ status:'success', data:{ booking: b } });
  } catch(e) { next(e); }
};

exports.getMy = async (req, res, next) => {
  try {
    const bookings = await SpaBooking.find({ user: req.user._id }).sort('-createdAt');
    res.json({ status:'success', data:{ bookings } });
  } catch(e) { next(e); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      const q = new RegExp(search, 'i');
      filter.$or = [{ fullName:q }, { email:q }, { ref:q }, { treatment:q }];
    }
    const bookings = await SpaBooking.find(filter).populate('user','name email').sort('-createdAt');
    res.json({ status:'success', data:{ bookings } });
  } catch(e) { next(e); }
};

exports.cancel = async (req, res, next) => {
  try {
    const b = await SpaBooking.findById(req.params.id);
    if (!b) throw new AppError('Not found', 404);
    if (req.user.role !== 'admin' && b.user?.toString() !== req.user._id.toString())
      throw new AppError('Not authorized', 403);
    if (b.status === 'Cancelled') throw new AppError('Already cancelled', 400);
    b.status       = 'Cancelled';
    b.cancelledAt  = new Date();
    b.cancelReason = req.body.reason || 'Customer request';
    await b.save();
    res.json({ status:'success', data:{ booking: b } });
  } catch(e) { next(e); }
};

exports.requestAttend = async (req, res, next) => {
  try {
    const b = await SpaBooking.findById(req.params.id);
    if (!b) throw new AppError('Not found', 404);
    if (b.status === 'Cancelled') throw new AppError('Booking is cancelled', 400);
    b.status       = 'AttendRequested';
    b.attendRequest = { requestedAt: new Date(), status: 'pending' };
    await b.save();
    res.json({ status:'success', data:{ booking: b } });
  } catch(e) { next(e); }
};

exports.approveAttend = async (req, res, next) => {
  try {
    const { action, note } = req.body;
    const b = await SpaBooking.findById(req.params.id);
    if (!b) throw new AppError('Not found', 404);
    b.attendRequest = {
      ...b.attendRequest,
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      status: action === 'approve' ? 'approved' : 'rejected',
      note: note || '',
    };
    b.status = action === 'approve' ? 'Confirmed' : 'Pending';
    await b.save();
    res.json({ status:'success', data:{ booking: b } });
  } catch(e) { next(e); }
};
