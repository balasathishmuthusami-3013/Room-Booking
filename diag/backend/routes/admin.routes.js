/**
 * routes/admin.routes.js
 */
const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/dashboard', ctrl.getDashboard);
router.get('/users', ctrl.getUsers);
router.patch('/users/:id/toggle-status', ctrl.toggleUserStatus);

module.exports = router;
