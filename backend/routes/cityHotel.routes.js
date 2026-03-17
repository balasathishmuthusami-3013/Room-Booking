/**
 * routes/cityHotel.routes.js
 */
const router = require('express').Router();
const ctrl   = require('../controllers/cityHotel.controller');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/',                         ctrl.getCities);
router.get('/:cityId/hotels',           ctrl.getHotelsByCity);

// Admin
router.post('/',                        protect, authorize('admin'), ctrl.createCity);
router.put('/:id',                      protect, authorize('admin'), ctrl.updateCity);
router.delete('/:id',                   protect, authorize('admin'), ctrl.deleteCity);
router.get('/hotels/all',               protect, authorize('admin'), ctrl.getAllHotels);
router.post('/hotels',                  protect, authorize('admin'), ctrl.createHotel);
router.put('/hotels/:id',               protect, authorize('admin'), ctrl.updateHotel);
router.delete('/hotels/:id',            protect, authorize('admin'), ctrl.deleteHotel);

module.exports = router;
