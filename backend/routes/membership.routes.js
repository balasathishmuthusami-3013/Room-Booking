/**
 * routes/membership.routes.js
 */
const router = require('express').Router();
const ctrl   = require('../controllers/membership.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/packages',              ctrl.getPackages);
router.put('/packages/:tier',        protect, authorize('admin'), ctrl.updatePackage);
router.post('/purchase',             protect, ctrl.purchaseMembership);
router.get('/my',                    protect, ctrl.getMyMemberships);
router.get('/',                      protect, authorize('admin'), ctrl.getAllMemberships);

module.exports = router;
