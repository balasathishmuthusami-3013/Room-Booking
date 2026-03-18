/**
 * routes/room.routes.js
 */
const router = require('express').Router();
const ctrl = require('../controllers/room.controller');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/', ctrl.getRooms);
router.get('/:id', ctrl.getRoom);
router.get('/:id/availability', ctrl.checkAvailability);

// Admin only
router.post('/', protect, authorize('admin'), ctrl.createRoom);
router.put('/:id', protect, authorize('admin'), ctrl.updateRoom);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteRoom);

module.exports = router;

// Image upload route (admin only)
const upload = require('../middleware/upload');
router.post('/upload-image', protect, authorize('admin'), upload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'No images uploaded' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = req.files.map(f => `${baseUrl}/uploads/rooms/${f.filename}`);
    res.json({ status: 'success', data: { urls } });
  } catch (err) { next(err); }
});
