/**
 * BookingDetailPage.jsx
 * - Confirmed: shows big green confirmation card with date + confetti effect
 * - Pending: shows "Complete Payment" banner with direct payment flow
 */
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PaymentGateway from '../../components/payment/PaymentGateway';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed:   'bg-green-100 text-green-700 border-green-200',
  cancelled:   'bg-red-100 text-red-700 border-red-200',
  checked_in:  'bg-blue-100 text-blue-700 border-blue-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuccess = searchParams.get('success') === 'true';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = () => {
    bookingAPI.getById(id)
      .then(({ data }) => setBooking(data.data.booking))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setLoading(true);
    fetchBooking();
    navigate(`/bookings/${id}?success=true`);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a cancellation reason'); return; }
    setCancelling(true);
    try {
      await bookingAPI.cancel(id, { reason: cancelReason });
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      fetchBooking();
      navigate(`/bookings/${id}`);
    } catch {
      toast.error('Cancellation failed. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="text-center py-20 text-gray-500">
      <span className="text-5xl block mb-4">🔍</span>
      Booking not found.
    </div>
  );

  const b = booking;
  // isSuccess means payment just completed — treat as confirmed even if DB hasn't updated yet
  const isConfirmed = isSuccess || b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out';
  const isPending   = !isSuccess && b.status === 'pending';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* ── CONFIRMED BANNER ──────────────────────── */}
      {(isConfirmed || isSuccess) && (
        <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl border-2 border-green-200">
          {/* Decorative header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-8 text-white text-center relative overflow-hidden">
            {/* Animated confetti dots */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div key={i}
                  className="absolute rounded-full opacity-30 animate-bounce"
                  style={{
                    width: `${Math.random()*8+4}px`,
                    height: `${Math.random()*8+4}px`,
                    left: `${Math.random()*100}%`,
                    top: `${Math.random()*100}%`,
                    backgroundColor: ['#FCD34D','#FFFFFF','#A7F3D0','#FCA5A5'][i%4],
                    animationDelay: `${Math.random()*2}s`,
                    animationDuration: `${Math.random()*1+0.5}s`,
                  }} />
              ))}
            </div>
            <div className="relative">
              <div className="text-6xl mb-3">🎉</div>
              <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="text-green-100 text-sm">Your reservation has been successfully confirmed</p>
            </div>
          </div>

          {/* Confirmation details card */}
          <div className="bg-white p-6">
            <div className="flex items-center justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-green-100 border-4 border-green-400 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm">Booking Reference</p>
              <p className="text-2xl font-mono font-bold text-gray-800 tracking-wider">{b.bookingReference}</p>
            </div>

            {/* Key dates highlighted */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">✅ Check-In</p>
                <p className="text-xl font-bold text-gray-800">
                  {new Date(b.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-sm text-gray-500 mt-1">From 3:00 PM</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">🚪 Check-Out</p>
                <p className="text-xl font-bold text-gray-800">
                  {new Date(b.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-sm text-gray-500 mt-1">By 12:00 PM</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <img
                  src={b.room?.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200'}
                  alt={b.room?.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <p className="font-bold text-gray-800">{b.room?.name}</p>
                  <p className="text-gray-500 text-xs">{b.numberOfNights} nights · {b.guests?.adults} guests</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total Paid</p>
                <p className="font-bold text-lg text-green-600">₹{b.pricing?.totalAmount?.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">📧 A confirmation has been sent to <span className="font-semibold">{user?.email}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ── PENDING PAYMENT BANNER ────────────────── */}
      {isPending && !showPayment && (
        <div className="mb-8 bg-yellow-50 border-2 border-yellow-300 rounded-3xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-400 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center text-2xl">⏳</div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Payment Pending</h3>
              <p className="text-gray-800 text-sm">Your booking is reserved — complete payment to confirm</p>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 mb-5 text-center text-sm">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <p className="text-gray-400 text-xs">Room</p>
                <p className="font-bold text-gray-700 text-xs mt-0.5">{b.room?.name}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <p className="text-gray-400 text-xs">Check-In</p>
                <p className="font-bold text-gray-700 text-xs mt-0.5">{new Date(b.checkIn).toLocaleDateString()}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <p className="text-gray-400 text-xs">Amount Due</p>
                <p className="font-bold text-amber-600 text-sm mt-0.5">₹{b.pricing?.totalAmount?.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              💳 Complete Payment Now →
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">🔒 Secure payment · Instant confirmation</p>
          </div>
        </div>
      )}

      {/* ── INLINE PAYMENT FORM (when pending and clicked) ── */}
      {isPending && showPayment && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-lg">Complete Your Payment</h3>
            <button onClick={() => setShowPayment(false)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
          </div>
          <PaymentGateway
            bookingId={b._id}
            amount={b.pricing?.totalAmount}
            userInfo={{ name: user?.name, email: user?.email }}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      )}

      {/* ── BOOKING DETAIL CARD ───────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{b.room?.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Ref: <span className="font-mono font-semibold text-gray-700">{b.bookingReference}</span>
            </p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border capitalize ${isConfirmed ? STATUS_COLORS['confirmed'] : (STATUS_COLORS[b.status] || 'bg-gray-100')}`}>
            {isConfirmed ? 'Confirmed ✓' : b.status?.replace('_', ' ')}
          </span>
        </div>

        {/* Room Image */}
        <img
          src={b.room?.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900'}
          alt={b.room?.name}
          className="w-full h-52 object-cover rounded-xl"
        />

        {/* Stay Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Check-In',  value: new Date(b.checkIn).toDateString() },
            { label: 'Check-Out', value: new Date(b.checkOut).toDateString() },
            { label: 'Duration',  value: `${b.numberOfNights} night${b.numberOfNights > 1 ? 's' : ''}` },
            { label: 'Guests',    value: `${b.guests?.adults} adults${b.guests?.children ? `, ${b.guests.children} children` : ''}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-1">{label}</div>
              <div className="font-semibold text-gray-800 text-sm">{value}</div>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <h3 className="font-bold text-gray-700 mb-2">Price Breakdown</h3>
          <div className="flex justify-between text-gray-600"><span>Base Amount ({b.numberOfNights} nights)</span><span>₹{b.pricing?.baseAmount?.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-gray-600"><span>GST (12%)</span><span>₹{b.pricing?.taxAmount?.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-gray-600"><span>Service Charge (5%)</span><span>₹{b.pricing?.serviceCharge?.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between font-bold text-gray-800 border-t pt-2 text-base">
            <span>Total {(isConfirmed || b.paymentStatus === 'paid') ? '(Paid ✓)' : '(Due)'}</span>
            <span className={(isConfirmed || b.paymentStatus === 'paid') ? 'text-green-600' : 'text-amber-600'}>₹{b.pricing?.totalAmount?.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Special Requests */}
        {b.specialRequests && (
          <div className="bg-amber-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-1">Special Requests</h4>
            <p className="text-sm text-gray-600">{b.specialRequests}</p>
          </div>
        )}

        {/* Cancellation info */}
        {b.status === 'cancelled' && b.cancellation && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            <h4 className="font-semibold text-red-700 mb-2">❌ Cancellation Details</h4>
            <div className="space-y-1 text-red-600">
              <p>Cancelled on: {new Date(b.cancellation.cancelledAt).toDateString()}</p>
              <p>Reason: {b.cancellation.reason}</p>
              <p>Refund: <span className="font-bold">₹{b.cancellation.refundAmount?.toLocaleString("en-IN")}</span> ({b.cancellation.refundPercent}%)</p>
              <p>Refund Status: <span className="capitalize font-semibold">{b.cancellation.refundStatus}</span></p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link to="/bookings" className="flex-1 text-center border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">
            ← My Bookings
          </Link>
          {isPending && !showPayment && (
            <button onClick={() => setShowPayment(true)}
              className="flex-1 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 rounded-lg transition text-sm">
              💳 Pay Now
            </button>
          )}
          {isConfirmed && (
            <>
              <button onClick={() => setShowCancelModal(true)}
                className="flex-1 border border-red-300 text-red-600 font-semibold py-2.5 rounded-lg hover:bg-red-50 transition text-sm">
                ✕ Cancel Booking
              </button>
              <Link to="/rooms" className="flex-1 text-center bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 rounded-lg transition text-sm">
                Book Again
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── CANCEL MODAL ─────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">❌</div>
              <h3 className="text-xl font-bold text-gray-800">Cancel Booking?</h3>
              <p className="text-gray-500 text-sm mt-1">Ref: <span className="font-mono font-semibold">{b.bookingReference}</span></p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 mb-4">
              <p className="font-bold mb-1">⚠️ Cancellation Policy</p>
              <p>48+ hours before check-in → Full refund</p>
              <p>24–48 hours before → 50% refund</p>
              <p>Under 24 hours → No refund</p>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Reason for Cancellation *</label>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                placeholder="Please tell us why you're cancelling..."
                rows={3}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                Keep Booking
              </button>
              <button onClick={handleCancel} disabled={cancelling || !cancelReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition text-sm disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
