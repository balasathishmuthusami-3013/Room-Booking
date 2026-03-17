/**
 * controllers/review.controller.js — Guest Reviews
 */

const Review = require('../models/Review');
const AppError = require('../utils/AppError');

// GET /api/reviews — Public: list approved reviews
exports.getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find({ isApproved: true }).sort('-createdAt').skip(skip).limit(Number(limit)),
      Review.countDocuments({ isApproved: true }),
    ]);
    res.json({ status: 'success', data: { reviews, total } });
  } catch (err) { next(err); }
};

// POST /api/reviews — Anyone (guest name required)
exports.createReview = async (req, res, next) => {
  try {
    const { guestName, rating, comment, roomStayed } = req.body;
    if (!guestName || !rating || !comment) throw new AppError('Name, rating and comment are required.', 400);

    const review = await Review.create({
      user: req.user?._id || null,
      guestName,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment,
      roomStayed: roomStayed || '',
    });

    res.status(201).json({ status: 'success', data: { review } });
  } catch (err) { next(err); }
};

// Admin: toggle approval
exports.toggleApproval = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new AppError('Review not found.', 404);
    review.isApproved = !review.isApproved;
    await review.save();
    res.json({ status: 'success', data: { review } });
  } catch (err) { next(err); }
};

// Admin: delete review
exports.deleteReview = async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'Review deleted.' });
  } catch (err) { next(err); }
};
