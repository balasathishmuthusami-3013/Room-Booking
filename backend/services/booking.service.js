/**
 * services/booking.service.js — Core Booking Business Logic
 *
 * Handles:
 *  - Date overlap detection (prevents double booking)
 *  - Dynamic price calculation with tax & service charges
 *  - Refund calculation based on cancellation timing
 *  - Booking reference generation
 */

const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const TAX_RATE = parseFloat(process.env.TAX_RATE) || 0.12;
const SERVICE_CHARGE_RATE = parseFloat(process.env.SERVICE_CHARGE_RATE) || 0.05;

const FULL_REFUND_HOURS = parseInt(process.env.FULL_REFUND_HOURS) || 48;
const PARTIAL_REFUND_HOURS = parseInt(process.env.PARTIAL_REFUND_HOURS) || 24;
const PARTIAL_REFUND_PERCENT = parseInt(process.env.PARTIAL_REFUND_PERCENT) || 50;

class BookingService {
  /**
   * generateBookingReference — Unique human-readable ref (e.g., HB-2024-A1B2C3)
   */
  static generateBookingReference() {
    const year = new Date().getFullYear();
    const unique = uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `HB-${year}-${unique}`;
  }

  /**
   * calculateNights — Number of nights between checkIn and checkOut
   */
  static calculateNights(checkIn, checkOut) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay);
    if (nights < 1) throw new AppError('Check-out must be at least 1 night after check-in.', 400);
    return nights;
  }

  /**
   * calculatePricing — Full pricing breakdown
   *
   * Formula:
   *   baseAmount     = pricePerNight × nights × (1 - discount%)
   *   taxAmount      = baseAmount × TAX_RATE
   *   serviceCharge  = baseAmount × SERVICE_CHARGE_RATE
   *   totalAmount    = baseAmount + taxAmount + serviceCharge
   */
  static calculatePricing(room, nights) {
    const pricePerNight = room.effectivePrice ?? room.pricePerNight;
    const baseAmount = parseFloat((pricePerNight * nights).toFixed(2));
    const discountAmount = parseFloat(
      (room.pricePerNight * nights * (room.discountPercent / 100)).toFixed(2)
    );
    const taxAmount = parseFloat((baseAmount * TAX_RATE).toFixed(2));
    const serviceCharge = parseFloat((baseAmount * SERVICE_CHARGE_RATE).toFixed(2));
    const totalAmount = parseFloat((baseAmount + taxAmount + serviceCharge).toFixed(2));

    return {
      pricePerNight,
      baseAmount,
      discountAmount,
      taxAmount,
      serviceCharge,
      totalAmount,
    };
  }

  /**
   * checkRoomAvailability — Prevents double booking
   *
   * A booking conflict exists when:
   *   existingCheckIn  < newCheckOut  AND
   *   existingCheckOut > newCheckIn
   *
   * This covers all overlap cases:
   *   - New booking fully inside existing
   *   - New booking starts before and ends inside existing
   *   - New booking starts inside and ends after existing
   *   - New booking fully wraps existing
   */
  static async checkRoomAvailability(roomId, checkIn, checkOut, excludeBookingId = null) {
    const query = {
      room: roomId,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
    };

    // Exclude current booking when updating
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne(query);

    if (conflictingBooking) {
      throw new AppError(
        `Room is not available from ${new Date(checkIn).toDateString()} to ${new Date(checkOut).toDateString()}. ` +
        `Try different dates.`,
        409
      );
    }

    return true;
  }

  /**
   * calculateRefund — Time-based refund policy
   *
   * Policy:
   *   > FULL_REFUND_HOURS before check-in  → 100% refund
   *   > PARTIAL_REFUND_HOURS before check-in → PARTIAL_REFUND_PERCENT% refund
   *   ≤ PARTIAL_REFUND_HOURS before check-in → No refund
   */
  static calculateRefund(booking) {
    const now = new Date();
    const checkIn = new Date(booking.checkIn);
    const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);

    let refundPercent = 0;
    let refundAmount = 0;
    let policyApplied = 'no_refund';

    if (hoursUntilCheckIn > FULL_REFUND_HOURS) {
      refundPercent = 100;
      refundAmount = booking.pricing.totalAmount;
      policyApplied = 'full_refund';
    } else if (hoursUntilCheckIn > PARTIAL_REFUND_HOURS) {
      refundPercent = PARTIAL_REFUND_PERCENT;
      refundAmount = parseFloat(
        ((booking.pricing.totalAmount * PARTIAL_REFUND_PERCENT) / 100).toFixed(2)
      );
      policyApplied = 'partial_refund';
    }

    return { refundPercent, refundAmount, policyApplied, hoursUntilCheckIn };
  }

  /**
   * resolveRoom — Find a DB room by _id, OR upsert a virtual Room for
   * Amadeus / fallback rooms that have non-ObjectId offer IDs.
   *
   * Virtual rooms are stored with roomNumber = offerId so they are
   * idempotent — repeat bookings of the same Amadeus offer reuse the
   * same Room document and never create duplicates.
   */
  static async resolveRoom(roomId, roomData) {
    const mongoose = require('mongoose');

    // If it looks like a valid ObjectId, do a normal DB lookup
    if (mongoose.Types.ObjectId.isValid(roomId)) {
      const room = await Room.findOne({ _id: roomId, isActive: true });
      if (!room) throw new AppError('Room not found or unavailable.', 404);
      return room;
    }

    // Not an ObjectId — this is an Amadeus offerId or fallback ID.
    // We need roomData from the request to create/find the virtual room.
    if (!roomData) {
      throw new AppError(
        'Room details are required to book an Amadeus/external room.',
        400
      );
    }

    // Normalise bed type to the enum values Room schema allows
    const BED_TYPE_MAP = {
      king: 'king', queen: 'queen', double: 'double',
      twin: 'twin', single: 'single',
      // Amadeus values
      KING: 'king', QUEEN: 'queen', DOUBLE: 'double',
      TWIN: 'twin', SINGLE: 'single',
    };
    const bedType = BED_TYPE_MAP[roomData.bedType] || 'double';

    // Normalise room type to the enum values Room schema allows
    const ROOM_TYPE_MAP = {
      standard: 'standard', deluxe: 'deluxe', suite: 'suite',
      penthouse: 'penthouse', family: 'family',
      STANDARD: 'standard', DELUXE: 'deluxe', SUITE: 'suite',
      TWIN: 'standard', KING: 'deluxe',
    };
    const roomType = ROOM_TYPE_MAP[roomData.roomType] || 'standard';

    const pricePerNight = Number(roomData.pricePerNight) || 0;
    const offerId = roomData.offerId || roomId;

    // upsert: find by roomNumber (=offerId) or create fresh
    const room = await Room.findOneAndUpdate(
      { roomNumber: offerId },
      {
        $setOnInsert: {
          roomNumber:    offerId,
          name:          roomData.roomName || 'Hotel Room',
          type:          roomType,
          description:   roomData.description || `${roomData.roomName || 'Room'} at ${roomData.hotelName || 'Hotel'}.`,
          pricePerNight: pricePerNight,
          discountPercent: 0,
          capacity: {
            adults:   Number(roomData.adults) || 2,
            children: 0,
          },
          bedType:   bedType,
          bedCount:  Number(roomData.beds) || 1,
          amenities: Array.isArray(roomData.amenities) ? roomData.amenities : [],
          isAvailable: true,
          isActive:    true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    logger.info(
      `[BookingService] Resolved Amadeus room "${offerId}" → DB _id ${room._id}`
    );
    return room;
  }

  /**
   * createBooking — End-to-end booking creation
   */
  static async createBooking(userId, bookingData) {
    const { roomId, roomData, checkIn, checkOut, guests, specialRequests } = bookingData;

    // 1. Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      throw new AppError('Check-in date cannot be in the past.', 400);
    }
    if (checkOutDate <= checkInDate) {
      throw new AppError('Check-out must be after check-in.', 400);
    }

    // 2. Fetch or upsert the Room document
    const room = await BookingService.resolveRoom(roomId, roomData);

    // 3. Check guest capacity
    const totalGuests = (guests.adults || 1) + (guests.children || 0);
    const maxCapacity = room.capacity.adults + room.capacity.children;
    if (totalGuests > maxCapacity) {
      throw new AppError(`Room capacity exceeded. Max ${maxCapacity} guests.`, 400);
    }

    // 4. Check availability (anti-double-booking) — use the resolved DB _id
    await BookingService.checkRoomAvailability(room._id, checkIn, checkOut);

    // 5. Calculate pricing
    const nights = BookingService.calculateNights(checkIn, checkOut);
    const pricing = BookingService.calculatePricing(room, nights);

    // 6. Create booking — always use the resolved MongoDB _id
    const booking = await Booking.create({
      bookingReference: BookingService.generateBookingReference(),
      user: userId,
      room: room._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numberOfNights: nights,
      guests,
      pricing,
      status: 'pending',
      paymentStatus: 'unpaid',
      specialRequests,
    });

    // 7. Update room's booking counter
    await Room.findByIdAndUpdate(room._id, { $inc: { totalBookings: 1 } });

    logger.info(`Booking created: ${booking.bookingReference} for user ${userId}`);

    return booking.populate(['room', 'user']);
  }

  /**
   * cancelBooking — Cancel with refund calculation
   */
  static async cancelBooking(bookingId, userId, reason, isAdmin = false) {
    const booking = await Booking.findById(bookingId).populate('payment');

    if (!booking) throw new AppError('Booking not found.', 404);

    // Only admin or booking owner can cancel
    if (!isAdmin && booking.user.toString() !== userId.toString()) {
      throw new AppError('Not authorized to cancel this booking.', 403);
    }

    if (['cancelled', 'checked_out'].includes(booking.status)) {
      throw new AppError(`Booking is already ${booking.status}.`, 400);
    }

    const refundInfo = BookingService.calculateRefund(booking);

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      reason: reason || 'Customer request',
      refundAmount: booking.paymentStatus === 'paid' ? refundInfo.refundAmount : 0,
      refundPercent: refundInfo.refundPercent,
      refundStatus: booking.paymentStatus === 'paid' ? 'initiated' : 'none',
    };

    await booking.save();

    logger.info(`Booking cancelled: ${booking.bookingReference}. Refund: $${booking.cancellation.refundAmount}`);

    return { booking, refundInfo };
  }
}

module.exports = BookingService;
