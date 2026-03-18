/**
 * ProfilePage.jsx — With mandatory phone + email, My Bookings at top
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:     { bg: 'bg-yellow-100 text-yellow-700 border-yellow-300', dot: 'bg-yellow-400' },
  confirmed:   { bg: 'bg-green-100 text-green-700 border-green-300',   dot: 'bg-green-400' },
  cancelled:   { bg: 'bg-red-100 text-red-700 border-red-300',         dot: 'bg-red-400' },
  checked_in:  { bg: 'bg-blue-100 text-blue-700 border-blue-300',      dot: 'bg-blue-400' },
  checked_out: { bg: 'bg-gray-100 text-gray-600 border-gray-300',      dot: 'bg-gray-400' },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    bookingAPI.getMyBookings({ limit: 10 })
      .then(({ data }) => setBookings(data.data.bookings))
      .finally(() => setLoadingBookings(false));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Mobile number is mandatory';
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    if (!form.email.trim()) e.email = 'Email is mandatory';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.patch('/users/profile', { name: form.name, phone: form.phone });
      toast.success('Profile updated successfully!');
    } finally { setSaving(false); }
  };

  const loyaltyLevel = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_out').length;
  const tier = loyaltyLevel >= 10 ? 'Platinum' : loyaltyLevel >= 5 ? 'Gold' : 'Silver';
  const tierColor = tier === 'Platinum' ? 'text-purple-600 bg-purple-100' : tier === 'Gold' ? 'text-amber-700 bg-amber-100' : 'text-gray-600 bg-gray-100';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <h2 className="font-bold text-xl text-gray-800">{user?.name}</h2>
            <p className="text-gray-500 text-sm mb-3">{user?.email}</p>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${tierColor}`}>
              {tier} Member ✦
            </span>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
                <p className="text-xs text-gray-400">Total Stays</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{user?.loyaltyPoints || 0}</p>
                <p className="text-xs text-gray-400">Points</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Edit Profile</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.name ? 'border-red-400' : ''}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.phone ? 'border-red-400' : ''}`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input value={form.email} disabled
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <button type="submit" disabled={saving}
                className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 rounded-lg transition disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: My Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">📋 My Bookings</h3>
              <Link to="/bookings" className="text-sm text-amber-600 font-semibold hover:underline">View All →</Link>
            </div>

            {loadingBookings ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_,i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-4">📭</span>
                <p className="text-gray-500 mb-4">No bookings yet</p>
                <Link to="/rooms" className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded-lg transition text-sm">
                  Browse Rooms
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {bookings.map(b => (
                  <BookingRow key={b._id} booking={b} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Booking Row with pending CTA and confirmed badge ──
function BookingRow({ booking: b }) {
  const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
  const isConfirmed = b.status === 'confirmed' || b.status === 'checked_out' || b.status === 'checked_in';
  const isPending   = b.status === 'pending';

  return (
    <div className="p-5 hover:bg-gray-50 transition">
      <div className="flex gap-4 items-start">
        {/* Room thumb */}
        <img
          src={b.room?.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200'}
          alt={b.room?.name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{b.room?.name}</h4>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{b.bookingReference}</p>
            </div>
            {/* Status badge */}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize flex items-center gap-1.5 ${sc.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
              {b.status.replace('_',' ')}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
            <span>📅 {new Date(b.checkIn).toLocaleDateString()} – {new Date(b.checkOut).toLocaleDateString()}</span>
            <span>🌙 {b.numberOfNights} nights</span>
            <span className="font-bold text-gray-700">💰 ₹{b.pricing?.totalAmount?.toLocaleString("en-IN")}</span>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            {/* PENDING: show complete payment button */}
            {isPending && (
              <Link to={`/bookings/${b._id}`}
                className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-4 py-1.5 rounded-lg text-xs transition">
                ⚠️ Complete Payment →
              </Link>
            )}

            {/* CONFIRMED: show green confirmed badge with date */}
            {isConfirmed && (
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                <span className="text-green-500 text-sm">✅</span>
                <div>
                  <span className="text-green-700 font-bold text-xs">Booking Confirmed</span>
                  <span className="text-green-500 text-xs ml-2">Check-in: {new Date(b.checkIn).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                </div>
              </div>
            )}

            {/* CANCELLED */}
            {b.status === 'cancelled' && (
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-red-500 text-xs">❌ Cancelled</span>
                {b.cancellation?.refundAmount > 0 && (
                  <span className="text-red-400 text-xs">· Refund: ₹{b.cancellation.refundAmount}</span>
                )}
              </div>
            )}

            <Link to={`/bookings/${b._id}`} className="text-xs text-amber-600 hover:underline font-semibold self-center">
              View Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
