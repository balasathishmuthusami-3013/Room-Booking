/**
 * BookingPage.jsx — with INR currency, 4-step flow
 */
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { roomAPI, bookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PaymentGateway from '../../components/payment/PaymentGateway';
import { formatINR } from '../../utils/currency';
import toast from 'react-hot-toast';

const STEPS = ['Stay Details', 'Review', 'Your Details', 'Payment'];

export default function BookingPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [room, setRoom] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: { adults: 2, children: 0 },
    specialRequests: '',
  });

  const [customerDetails, setCustomerDetails] = useState({
    fullName: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', nationality: '',
    idType: 'aadhar', idNumber: '', address: '',
    arrivalTime: '15:00', agreeTerms: false,
  });

  useEffect(() => {
    roomAPI.getById(roomId).then(({ data }) => setRoom(data.data.room)).finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (user) setCustomerDetails(p => ({ ...p, fullName: user.name || p.fullName, email: user.email || p.email, phone: user.phone || p.phone }));
  }, [user]);

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000)) : 0;
  const effectivePrice = room ? (room.discountPercent > 0 ? room.pricePerNight * (1 - room.discountPercent / 100) : room.pricePerNight) : 0;
  const base  = +(effectivePrice * nights).toFixed(2);
  const tax   = +(base * 0.12).toFixed(2);
  const svc   = +(base * 0.05).toFixed(2);
  const total = +(base + tax + svc).toFixed(2);

  const handleCreateBooking = async () => {
    if (!form.checkIn || !form.checkOut || nights < 1) { toast.error('Please select valid dates.'); return; }
    setSubmitting(true);
    try {
      const { data } = await bookingAPI.create({ roomId, ...form, customerDetails });
      setBooking(data.data.booking);
      setStep(3);
      toast.success('Booking created! Complete payment to confirm.');
    } finally { setSubmitting(false); }
  };

  const customerValid = customerDetails.fullName.trim() && customerDetails.email.trim() &&
    customerDetails.phone.trim() && customerDetails.idNumber.trim() && customerDetails.agreeTerms;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Complete Your Booking</h1>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-amber-400 text-gray-900' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${i === step ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {/* STEP 0 */}
          {step === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Stay Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Check-In</label>
                  <input type="date" value={form.checkIn} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, checkIn: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Check-Out</label>
                  <input type="date" value={form.checkOut} min={form.checkIn || new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, checkOut: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Adults</label>
                  <select value={form.guests.adults} onChange={e => setForm({ ...form, guests: { ...form.guests, adults: +e.target.value } })}
                    className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Children</label>
                  <select value={form.guests.children} onChange={e => setForm({ ...form, guests: { ...form.guests, children: +e.target.value } })}
                    className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Special Requests (optional)</label>
                <textarea value={form.specialRequests} onChange={e => setForm({ ...form, specialRequests: e.target.value })}
                  placeholder="Early check-in, dietary needs..." rows={3}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <button onClick={() => setStep(1)} disabled={nights < 1}
                className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-lg transition disabled:opacity-50">
                Continue to Review →
              </button>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Review Your Stay</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                {[
                  ['Room', room?.name],
                  ['Check-In', new Date(form.checkIn).toDateString()],
                  ['Check-Out', new Date(form.checkOut).toDateString()],
                  ['Duration', `${nights} night${nights > 1 ? 's' : ''}`],
                  ['Guests', `${form.guests.adults} adults, ${form.guests.children} children`],
                  ...(form.specialRequests ? [['Special Requests', form.specialRequests]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800 text-right">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition">← Edit</button>
                <button onClick={() => setStep(2)} className="flex-[2] bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-lg transition">Enter Details →</button>
              </div>
            </div>
          )}

          {/* STEP 2 — Customer Details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Your Details</h2>
                <p className="text-gray-500 text-sm mt-1">Required for hotel check-in record.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-400 text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Full Name *</label>
                    <input value={customerDetails.fullName} onChange={e => setCustomerDetails({ ...customerDetails, fullName: e.target.value })}
                      placeholder="As per your ID" className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Email *</label>
                    <input type="email" value={customerDetails.email} onChange={e => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Mobile Number *</label>
                    <input type="tel" value={customerDetails.phone} onChange={e => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                      placeholder="+91 98765 43210" className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Nationality</label>
                    <input value={customerDetails.nationality} onChange={e => setCustomerDetails({ ...customerDetails, nationality: e.target.value })}
                      placeholder="e.g. Indian" className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Expected Arrival</label>
                    <select value={customerDetails.arrivalTime} onChange={e => setCustomerDetails({ ...customerDetails, arrivalTime: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                      {['12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'].map(t=>(
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-400 text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Identity Verification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">ID Type *</label>
                    <select value={customerDetails.idType} onChange={e => setCustomerDetails({ ...customerDetails, idType: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                      <option value="aadhar">Aadhar Card</option>
                      <option value="passport">Passport</option>
                      <option value="pan">PAN Card</option>
                      <option value="driving_license">Driving Licence</option>
                      <option value="voter_id">Voter ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">ID Number *</label>
                    <input value={customerDetails.idNumber} onChange={e => setCustomerDetails({ ...customerDetails, idNumber: e.target.value })}
                      placeholder="Enter ID number" className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Home Address</label>
                    <input value={customerDetails.address} onChange={e => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                      placeholder="Street, City, State, PIN" className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={customerDetails.agreeTerms}
                    onChange={e => setCustomerDetails({ ...customerDetails, agreeTerms: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-amber-400" />
                  <span className="text-sm text-gray-700">
                    I agree to the <span className="text-amber-600 font-semibold">Terms & Conditions</span> and <span className="text-amber-600 font-semibold">Cancellation Policy</span>.
                    Full refund if cancelled 48+ hours before check-in. 50% refund within 24-48 hours.
                  </span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition">← Back</button>
                <button onClick={handleCreateBooking} disabled={!customerValid || submitting}
                  className="flex-[2] bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Proceed to Payment →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && booking && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border p-5">
                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Paying As</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center font-bold text-lg">
                    {customerDetails.fullName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{customerDetails.fullName}</div>
                    <div className="text-sm text-gray-500">{customerDetails.email} · {customerDetails.phone}</div>
                  </div>
                </div>
              </div>
              <PaymentGateway
                bookingId={booking._id}
                amount={booking.pricing?.totalAmount || total}
                userInfo={{ name: customerDetails.fullName, email: customerDetails.email }}
                onSuccess={() => navigate(`/bookings/${booking._id}?success=true`)}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border p-5 sticky top-20 space-y-4">
            <img src={room?.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'}
              alt={room?.name} className="w-full h-36 object-cover rounded-xl" />
            <div>
              <div className="text-xs text-amber-600 font-semibold capitalize">{room?.type}</div>
              <div className="font-bold text-gray-800">{room?.name}</div>
            </div>
            {nights > 0 && (
              <div className="space-y-1.5 text-sm border-t pt-3">
                <div className="flex justify-between text-gray-600"><span>{formatINR(effectivePrice)} × {nights} nights</span><span>{formatINR(base)}</span></div>
                <div className="flex justify-between text-gray-600"><span>GST (12%)</span><span>{formatINR(tax)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Service (5%)</span><span>{formatINR(svc)}</span></div>
                <div className="flex justify-between font-bold text-gray-800 border-t pt-2 text-base">
                  <span>Total</span><span>{formatINR(total)}</span>
                </div>
              </div>
            )}
            <div className="text-xs text-gray-400 space-y-1">
              <p>✓ Free cancellation 48h before check-in</p>
              <p>✓ Includes GST & service charges</p>
              <p>✓ Instant confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
