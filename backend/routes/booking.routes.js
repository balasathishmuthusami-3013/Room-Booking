/**
 * routes/booking.routes.js
 * Includes check-in / check-out request flow routes
 */
const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Customer routes
router.post('/', ctrl.createBooking);
router.get('/my', ctrl.getMyBookings);

// Named sub-routes BEFORE /:id to prevent interception
router.get('/checkin-requests', authorize('admin'), ctrl.getCheckInRequests);
router.get('/checkout-requests', authorize('admin'), ctrl.getCheckOutRequests);

router.patch('/:id/cancel', ctrl.cancelBooking);
router.patch('/:id/confirm-demo', ctrl.confirmDemoPayment);

// Customer submits request
router.patch('/:id/request-checkin', ctrl.requestCheckIn);
router.patch('/:id/request-checkout', ctrl.requestCheckOut);

// Admin approves/rejects
router.patch('/:id/approve-checkin', authorize('admin'), ctrl.approveCheckIn);
router.patch('/:id/approve-checkout', authorize('admin'), ctrl.approveCheckOut);

router.patch('/:id', authorize('admin'), ctrl.updateBooking);
// Generic /:id last
router.get('/:id', ctrl.getBooking);

// Admin: all bookings
router.get('/', authorize('admin'), ctrl.getAllBookings);

module.exports = router;
