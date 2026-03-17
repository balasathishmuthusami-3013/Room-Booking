/**
 * pages/Customer/MyBookingsPage.jsx
 * Enhanced with check-in/out request flow and AR access control.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import toast from 'react-hot-toast';
import ARExplorer from '../../components/ar/ARExplorer';

const todayMidnight = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const dayOf = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const isOnOrAfter = (date) => todayMidnight() >= dayOf(date);

export default function MyBookingsPage() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [arBooking, setArBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await bookingAPI.getMyBookings(filter ? { status: filter } : {});
      setBookings(data.data.bookings);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a cancellation reason'); return; }
    setCancelling(true);
    try {
      await bookingAPI.cancel(cancelModal._id, { reason: cancelReason });
      toast.success('Booking cancelled successfully');
      setCancelModal(null); setCancelReason(''); fetchBookings();
    } finally { setCancelling(false); }
  };

  const handleAction = async (bookingId, type) => {
    setActionLoading(p => ({ ...p, [bookingId]: type }));
    try {
      if (type === 'checkin') {
        await bookingAPI.requestCheckIn(bookingId);
        toast.success('Check-in request sent! Admin will verify shortly.');
      } else {
        await bookingAPI.requestCheckOut(bookingId);
        toast.success('Check-out request sent! Admin will process shortly.');
      }
      fetchBookings();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Something went wrong.');
    } finally {
      setActionLoading(p => ({ ...p, [bookingId]: null }));
    }
  };

  const TABS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'checked_out', label: 'Checked Out' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse inline-block"></span>
              {pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting payment
            </p>
          )}
        </div>
        <Link to="/rooms" className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm transition">+ New Booking</Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ value, label }) => (
          <button key={value} onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition ${filter === value ? 'bg-amber-400 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
            {value === 'pending' && pendingCount > 0 && filter !== 'pending' && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="bg-gray-100 rounded-2xl h-36 animate-pulse"/>)}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📋</span>
          <p className="text-gray-500 text-lg mb-4">No bookings found.</p>
          <Link to="/rooms" className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded-lg transition">Browse Rooms</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <BookingCard key={b._id} booking={b}
              onCancel={() => { setCancelModal(b); setCancelReason(''); }}
              onCheckIn={() => handleAction(b._id, 'checkin')}
              onCheckOut={() => handleAction(b._id, 'checkout')}
              onAR={() => setArBooking(b)}
              actionLoading={actionLoading[b._id]}
            />
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setCancelModal(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-red-50 rounded-t-3xl p-6 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">❌</div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Cancel Booking</h3>
                  <p className="text-gray-500 text-sm">{cancelModal.room?.name}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-bold text-amber-800 mb-2">📋 Cancellation & Refund Policy</p>
                <div className="space-y-1.5 text-amber-700">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span><span>Cancel 48+ hours before check-in → <strong>100% refund</strong></span></div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 bg-yellow-500 rounded-full"></span><span>Cancel 24–48 hours before → <strong>50% refund</strong></span></div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full"></span><span>Cancel less than 24 hours → <strong>No refund</strong></span></div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm flex justify-between">
                <span className="text-gray-500">Check-In</span>
                <span className="font-semibold text-gray-700">{new Date(cancelModal.checkIn).toDateString()}</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Reason *</label>
                <div className="grid grid-cols-2 gap-2 mt-2 mb-2">
                  {['Change of plans','Found better option','Medical emergency','Work commitment','Travel cancelled','Other'].map(r => (
                    <button key={r} onClick={() => setCancelReason(r)}
                      className={`text-xs py-2 px-3 rounded-lg border transition text-left ${cancelReason === r ? 'bg-red-50 border-red-400 text-red-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{r}</button>
                  ))}
                </div>
                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  placeholder="Or type your reason..." rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setCancelModal(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">Keep Booking</button>
                <button onClick={handleCancelConfirm} disabled={!cancelReason.trim() || cancelling}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50 text-sm">
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AR Overlay */}
      {arBooking && (
        <ARExplorer hotelLat={1.2868} hotelLng={103.8545} onClose={() => setArBooking(null)} />
      )}
    </div>
  );
}

function BookingCard({ booking: b, onCancel, onCheckIn, onCheckOut, onAR, actionLoading }) {
  const isPending    = b.status === 'pending';
  const isConfirmed  = b.status === 'confirmed';
  const isCheckedIn  = b.status === 'checked_in';
  const isCheckedOut = b.status === 'checked_out';
  const isCancelled  = b.status === 'cancelled';
  const isActive     = isConfirmed || isCheckedIn;

  const checkInAvailable  = isConfirmed && isOnOrAfter(b.checkIn);
  const checkOutAvailable = isCheckedIn && isOnOrAfter(b.checkOut);
  const checkInLocked     = isConfirmed && !isOnOrAfter(b.checkIn);
  const checkInPending    = b.checkInRequest?.status  === 'pending';
  const checkOutPending   = b.checkOutRequest?.status === 'pending';
  const checkInRejected   = b.checkInRequest?.status  === 'rejected' && isConfirmed;
  const checkOutRejected  = b.checkOutRequest?.status === 'rejected' && isCheckedIn;

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden transition hover:shadow-md border-2 ${isPending?'border-amber-300':isActive?'border-green-200':isCancelled?'border-red-100':'border-gray-100'}`}>
      {isPending && (
        <div className="bg-gradient-to-r from-amber-400 to-yellow-400 px-5 py-2 flex items-center justify-between">
          <span className="text-gray-900 text-xs font-bold flex items-center gap-2"><span className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></span>⚠️ Payment Required</span>
          <Link to={`/bookings/${b._id}`} className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-gray-700 transition">Pay Now →</Link>
        </div>
      )}
      {isConfirmed && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          <span className="text-white text-xs font-bold">Confirmed · Check-in {new Date(b.checkIn).toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}</span>
        </div>
      )}
      {isCheckedIn && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 flex items-center gap-2">
          <span className="text-white text-xs font-bold">🏁 Checked-In · Check-out {new Date(b.checkOut).toLocaleDateString()}</span>
        </div>
      )}
      {isCheckedOut && <div className="bg-gray-600 px-5 py-2"><span className="text-white text-xs font-semibold">✅ Stay Completed · {new Date(b.checkOut).toLocaleDateString()}</span></div>}
      {isCancelled && (
        <div className="bg-red-50 border-b border-red-100 px-5 py-2 flex items-center justify-between">
          <span className="text-red-600 text-xs font-semibold">❌ Cancelled on {new Date(b.cancellation?.cancelledAt).toLocaleDateString()}</span>
          {b.cancellation?.refundAmount > 0 && <span className="text-green-600 text-xs font-semibold">Refund: ₹{b.cancellation.refundAmount?.toLocaleString('en-IN')} ({b.cancellation.refundPercent}%)</span>}
        </div>
      )}

      <div className="p-5 flex gap-4">
        <div className="relative flex-shrink-0">
          <img src={b.room?.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300'} alt={b.room?.name} className="w-24 h-24 rounded-xl object-cover"/>
          {isActive && <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md"><svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
          {isPending && <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md text-gray-900 font-bold text-xs">!</div>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-800">{b.room?.name}</h3>
              <p className="text-xs text-gray-400 font-mono">{b.bookingReference}</p>
            </div>
            <span className="font-bold text-gray-800 text-sm">₹{b.pricing?.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
            <span>📅 {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</span>
            <span>🌙 {b.numberOfNights} nights</span>
            <span>👤 {b.guests?.adults} adults</span>
          </div>

          {checkInPending && <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-700 font-semibold flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>Check-in request pending — awaiting admin approval</div>}
          {checkInRejected && <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs text-red-700">❌ Check-in rejected: {b.checkInRequest.rejectionReason || 'Contact reception.'}</div>}
          {checkOutPending && <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-blue-700 font-semibold flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>Check-out request pending — admin processing</div>}
          {checkOutRejected && <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs text-red-700">❌ Check-out rejected: {b.checkOutRequest.rejectionReason || 'Contact reception.'}</div>}
          {checkInLocked && <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500">🔒 Check-in available from {new Date(b.checkIn).toDateString()}</div>}
          {isCancelled && b.cancellation?.reason && <div className="mt-2 bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600"><span className="font-semibold">Reason:</span> {b.cancellation.reason}</div>}

          <div className="mt-3 flex gap-2 flex-wrap items-center">
            {isPending && <Link to={`/bookings/${b._id}`} className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-4 py-1.5 rounded-lg text-xs transition">💳 Complete Payment</Link>}

            {checkInAvailable && !checkInPending && (
              <button onClick={onCheckIn} disabled={actionLoading === 'checkin'}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition disabled:opacity-60">
                {actionLoading === 'checkin' ? '⏳ Sending...' : '🏁 Request Check-in'}
              </button>
            )}

            {checkOutAvailable && !checkOutPending && (
              <button onClick={onCheckOut} disabled={actionLoading === 'checkout'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition disabled:opacity-60">
                {actionLoading === 'checkout' ? '⏳ Sending...' : '🚪 Request Check-out'}
              </button>
            )}

            {/* AR only when checked_in */}
            {isCheckedIn && (
              <button onClick={onAR}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition shadow-sm flex items-center gap-1">
                📡 Explore Nearby in AR
              </button>
            )}

            {/* AR disabled after checkout */}
            {isCheckedOut && (
              <span className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5">
                📡 AR Unavailable (Checked Out)
              </span>
            )}

            <Link to={`/bookings/${b._id}`} className="text-xs text-amber-600 hover:underline font-semibold">View Details →</Link>
            {['pending','confirmed'].includes(b.status) && (
              <button onClick={onCancel} className="text-xs text-red-500 hover:text-red-700 hover:underline ml-auto font-semibold">Cancel Booking</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
