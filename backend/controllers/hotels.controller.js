/**
 * controllers/hotels.controller.js
 * Handles Amadeus hotel search and room offer endpoints
 */

const amadeusService = require('../services/amadeus.service');
const RateOverride   = require('../models/RateOverride');
const AppError       = require('../utils/AppError');
const logger         = require('../utils/logger');

// ── GET /api/hotels/cities ───────────────────────────────────
exports.getCities = (req, res) => {
  const cities = amadeusService.getSupportedCities();
  res.json({ status: 'success', data: { cities } });
};

// ── GET /api/hotels?city=MAA ─────────────────────────────────
exports.getHotels = async (req, res, next) => {
  try {
    const { city } = req.query;
    if (!city) throw new AppError('Query param "city" is required (e.g. ?city=MAA)', 400);

    const hotels = await amadeusService.searchHotels(city.toUpperCase());
    res.json({ status: 'success', results: hotels.length, data: { hotels } });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hotels/:hotelId/rooms ───────────────────────────
// Returns room offers; applies admin rate overrides; falls back to
// curated rooms when Amadeus test env has no inventory.
exports.getHotelRooms = async (req, res, next) => {
  try {
    const { hotelId }               = req.params;
    const { checkIn, checkOut, adults } = req.query;

    const result = await amadeusService.getHotelOffers(
      hotelId, checkIn, checkOut, adults
    );

    const { hotel, offers, usedCheckIn, usedCheckOut, isFallbackData } = result;

    if (!offers || offers.length === 0) {
      return res.json({ status: 'success', data: { hotel, rooms: [], isFallbackData: false } });
    }

    // Fetch active rate overrides for this hotel
    const overrides = await RateOverride.find({ hotelId, isActive: true });

    // Apply overrides (offer-specific first, then hotel-wide catch-all)
    const rooms = offers.map(offer => {
      const offerOverride  = overrides.find(o => o.offerId === offer.offerId);
      const hotelOverride  = overrides.find(o => !o.offerId);
      const activeOverride = offerOverride || hotelOverride;

      return {
        ...offer,
        displayPrice:    activeOverride ? activeOverride.overridePrice : offer.totalPrice,
        overrideApplied: !!activeOverride,
        overrideNote:    activeOverride?.note  || null,
        originalPrice:   offer.totalPrice,
      };
    });

    res.json({
      status: 'success',
      data: {
        hotel,
        rooms,
        isFallbackData:  !!isFallbackData,   // tells frontend these are demo rooms
        usedCheckIn,
        usedCheckOut,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hotels/admin/rate-overrides ─────────────────────
exports.getRateOverrides = async (req, res, next) => {
  try {
    const overrides = await RateOverride.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    res.json({ status: 'success', data: { overrides } });
  } catch (err) { next(err); }
};

// ── POST /api/hotels/admin/rate-overrides ────────────────────
exports.createRateOverride = async (req, res, next) => {
  try {
    const { hotelId, offerId, overridePrice, note } = req.body;
    if (!hotelId || overridePrice === undefined) {
      throw new AppError('hotelId and overridePrice are required', 400);
    }

    await RateOverride.updateMany(
      { hotelId, offerId: offerId || null },
      { isActive: false }
    );

    const override = await RateOverride.create({
      hotelId,
      offerId:       offerId || null,
      overridePrice: Number(overridePrice),
      note:          note || '',
      isActive:      true,
      createdBy:     req.user._id,
    });

    logger.info(`[RateOverride] Admin set override for ${hotelId}: ₹${overridePrice}`);
    res.status(201).json({ status: 'success', data: { override } });
  } catch (err) { next(err); }
};

// ── DELETE /api/hotels/admin/rate-overrides/:id ──────────────
exports.deleteRateOverride = async (req, res, next) => {
  try {
    const override = await RateOverride.findByIdAndDelete(req.params.id);
    if (!override) throw new AppError('Rate override not found', 404);
    res.json({ status: 'success', message: 'Rate override removed' });
  } catch (err) { next(err); }
};
