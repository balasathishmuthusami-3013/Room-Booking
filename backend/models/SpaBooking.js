const mongoose = require('mongoose');
const spaBookingSchema = new mongoose.Schema({
  ref:           { type: String, unique: true, required: true },
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  treatment:     { type: String, required: true },
  duration:      String,
  price:         String,
  amount:        { type: Number, default: 0 },
  category:      String,
  date:          String,
  time:          String,
  guests:        { type: String, default: '1' },
  notes:         { type: String, default: '' },
  fullName:      { type: String, required: true },
  email:         { type: String, required: true },
  phone:         String,
  paymentMethod: String,
  status: {
    type: String,
    enum: ['Pending','AttendRequested','Confirmed','Cancelled'],
    default: 'Pending',
  },
  attendRequest: {
    requestedAt: Date,
    reviewedAt:  Date,
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:      { type: String, enum: ['pending','approved','rejected'] },
    note:        String,
  },
  cancelledAt:  Date,
  cancelReason: { type: String, default: '' },
}, { timestamps: true });
module.exports = mongoose.model('SpaBooking', spaBookingSchema);
