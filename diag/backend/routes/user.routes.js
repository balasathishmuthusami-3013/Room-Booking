/**
 * routes/user.routes.js
 */
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const AppError = require('../utils/AppError');

router.use(protect);

// PATCH /api/users/profile
router.patch('/profile', async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );
    res.json({ status: 'success', data: { user } });
  } catch (err) { next(err); }
});

// PATCH /api/users/change-password
router.patch('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Current password is incorrect.', 400);
    user.password = newPassword;
    await user.save();
    res.json({ status: 'success', message: 'Password updated.' });
  } catch (err) { next(err); }
});

module.exports = router;
