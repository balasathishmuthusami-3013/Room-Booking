/**
 * routes/review.routes.js
 */
const router = require('express').Router();
const ctrl = require('../controllers/review.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', ctrl.getReviews);
router.post('/', optionalAuth, ctrl.createReview);
router.patch('/:id/toggle', protect, authorize('admin'), ctrl.toggleApproval);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteReview);

module.exports = router;
