/**
 * routes/hotels.routes.js
 */

const router = require('express').Router();
const ctrl   = require('../controllers/hotels.controller');
const { protect, authorize } = require('../middleware/auth');

// ── Public endpoints ─────────────────────────────────────────
router.get('/cities',              ctrl.getCities);
router.get('/',                    ctrl.getHotels);
router.get('/:hotelId/rooms',      ctrl.getHotelRooms);

// ── Admin-only: rate overrides ────────────────────────────────
router.get(   '/admin/rate-overrides',     protect, authorize('admin'), ctrl.getRateOverrides);
router.post(  '/admin/rate-overrides',     protect, authorize('admin'), ctrl.createRateOverride);
router.delete('/admin/rate-overrides/:id', protect, authorize('admin'), ctrl.deleteRateOverride);

module.exports = router;
