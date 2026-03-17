/**
 * controllers/room.controller.js — Room CRUD + Availability Check
 */

const Room = require('../models/Room');
const Booking = require('../models/Booking');
const BookingService = require('../services/booking.service');
const AppError = require('../utils/AppError');

// GET /api/rooms — Public: list with filters
exports.getRooms = async (req, res, next) => {
  try {
    const {
      type, minPrice, maxPrice, minRating,
      adults, children, page = 1, limit = 12, sort = '-rating.average',
    } = req.query;

    const filter = { isActive: true };
    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }
    if (minRating) filter['rating.average'] = { $gte: Number(minRating) };
    if (adults) filter['capacity.adults'] = { $gte: Number(adults) };

    const skip = (Number(page) - 1) * Number(limit);
    const [rooms, total] = await Promise.all([
      Room.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Room.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: { rooms, total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// GET /api/rooms/:id — Public: single room detail
exports.getRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, isActive: true });
    if (!room) throw new AppError('Room not found.', 404);
    res.json({ status: 'success', data: { room } });
  } catch (err) { next(err); }
};

// GET /api/rooms/:id/availability — Check date availability
exports.checkAvailability = async (req, res, next) => {
  try {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) throw new AppError('Provide checkIn and checkOut dates.', 400);

    try {
      await BookingService.checkRoomAvailability(req.params.id, checkIn, checkOut);
      const nights = BookingService.calculateNights(checkIn, checkOut);
      const room = await Room.findById(req.params.id);
      const pricing = BookingService.calculatePricing(room, nights);

      res.json({
        status: 'success',
        data: { available: true, nights, pricing },
      });
    } catch (err) {
      if (err.statusCode === 409) {
        return res.json({ status: 'success', data: { available: false, reason: err.message } });
      }
      throw err;
    }
  } catch (err) { next(err); }
};

// POST /api/rooms — Admin: create room
exports.createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ status: 'success', data: { room } });
  } catch (err) { next(err); }
};

// PUT /api/rooms/:id — Admin: update room
exports.updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!room) throw new AppError('Room not found.', 404);
    res.json({ status: 'success', data: { room } });
  } catch (err) { next(err); }
};

// DELETE /api/rooms/:id — Admin: soft delete
exports.deleteRoom = async (req, res, next) => {
  try {
    const activeBookings = await Booking.countDocuments({
      room: req.params.id,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
    });
    if (activeBookings > 0) {
      throw new AppError('Cannot delete room with active bookings.', 409);
    }
    await Room.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ status: 'success', message: 'Room deactivated.' });
  } catch (err) { next(err); }
};
