/**
 * routes/loyalty.routes.js
 */
const router = require('express').Router();
const ctrl = require('../controllers/loyalty.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', ctrl.getProgram);
router.patch('/', protect, authorize('admin'), ctrl.updateProgram);
router.get('/history', protect, authorize('admin'), ctrl.getHistory);

module.exports = router;
