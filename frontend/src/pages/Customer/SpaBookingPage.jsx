/**
 * SpaBookingPage.jsx — /spa/book
 * Saves booking to backend. Status starts as Pending (not Confirmed).
 */
import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import PaymentGateway from '../../components/payment/PaymentGateway';
import { useAuth } from '../../context/AuthContext';
import { spaBookingAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STEPS = ['Schedule','Your Details','Payment','Confirmed'];

export default function SpaBookingPage() {
  const location = useLocation();
  const { user } = useAuth();
  const treatment = location.state?.treatment || {
    name:'Hoto.tours Gold Body Wrap', duration:'90 min', price:'₹12,000', amount:12000, category:'Body',
    desc:'Pure 24K gold-infused oil body treatment for radiant, youthful skin.',
  };

  const [step,setStep]     = useState(0);
  const [ref]              = useState('SPA-'+Math.random().toString(36).substr(2,8).toUpperCase());
  const [sch,setSch]       = useState({ date:'', time:'', guests:'1', notes:'' });
  const [det,setDet]       = useState({ fullName:user?.name||'', email:user?.email||'', phone:user?.phone||'', agreeTerms:false });
  const [saving,setSaving] = useState(false);

  const schValid = sch.date && sch.time;
  const detValid = det.fullName && det.email && det.phone && det.agreeTerms;

  const handlePaymentSuccess = async (paymentInfo) => {
    setSaving(true);
    try {
      await spaBookingAPI.create({
        ref, treatment:treatment.name, duration:treatment.duration,
        price:treatment.price, amount:treatment.amount, category:treatment.category,
        date:sch.date, time:sch.time, guests:sch.guests, notes:sch.notes,
        fullName:det.fullName, email:det.email, phone:det.phone,
        paymentMethod:paymentInfo.method,
      });
      setStep(3);
    } catch { toast.error('Failed to save booking. Please contact support.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/spa" className="text-sm text-gray-500 hover:text-amber-600 flex items-center gap-1 mb-6">← Back to Spa</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Book Spa Treatment</h1>
      <p className="text-gray-500 mb-8 text-sm">Booking for <span className="font-semibold text-amber-600">{treatment.name}</span></p>

      {/* Steps */}
      <div className="flex items-center mb-10">
        {STEPS.map((label,i)=>(
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i<step||(i===step&&step===3)?'bg-green-500 text-white':i===step?'bg-amber-400 text-gray-900 ring-4 ring-amber-100':'bg-gray-200 text-gray-400'}`}>
                {i<step||(i===step&&step===3)?'✓':i+1}
              </div>
              <span className={`text-xs mt-1.5 hidden sm:block font-medium ${i===step?(step===3?'text-green-600':'text-amber-600'):'text-gray-400'}`}>{label}</span>
            </div>
            {i<STEPS.length-1 && <div className={`flex-1 h-1 mx-2 rounded-full ${i<step||step===3?'bg-green-400':'bg-gray-200'}`}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 0 — Schedule */}
          {step===0 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Choose Schedule</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Date *</label>
                  <input type="date" value={sch.date} min={new Date().toISOString().split('T')[0]}
                    onChange={e=>setSch(s=>({...s,date:e.target.value}))}
                    className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Time *</label>
                  <select value={sch.time} onChange={e=>setSch(s=>({...s,time:e.target.value}))}
                    className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">Select time</option>
                    {['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM'].map(t=>(
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Guests</label>
                  <select value={sch.guests} onChange={e=>setSch(s=>({...s,guests:e.target.value}))}
                    className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="1">1 Person</option>
                    <option value="2">2 Persons (Couples)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Special Notes / Health Conditions</label>
                <textarea value={sch.notes} onChange={e=>setSch(s=>({...s,notes:e.target.value}))}
                  placeholder="Allergies, injuries, pressure preference…" rows={3}
                  className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"/>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <p className="font-bold mb-1">🕐 Cancellation Policy</p>
                <p>48+ hours → Full refund · 24–48 hours → 50% · Under 24h → No refund</p>
              </div>
              <button onClick={()=>setStep(1)} disabled={!schValid}
                className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50">
                Continue to Details →
              </button>
            </div>
          )}

          {/* Step 1 — Details */}
          {step===1 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Your Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Full Name *</label>
                  <input value={det.fullName} onChange={e=>setDet(d=>({...d,fullName:e.target.value}))} placeholder="As per your ID"
                    className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Email *</label>
                  <input type="email" value={det.email} onChange={e=>setDet(d=>({...d,email:e.target.value}))} placeholder="you@email.com"
                    className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Mobile *</label>
                  <input type="tel" value={det.phone} onChange={e=>setDet(d=>({...d,phone:e.target.value}))} placeholder="+91 98765 43210"
                    className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer bg-amber-50 border border-amber-200 rounded-xl p-4">
                <input type="checkbox" checked={det.agreeTerms} onChange={e=>setDet(d=>({...d,agreeTerms:e.target.checked}))}
                  className="mt-0.5 w-4 h-4 accent-amber-400"/>
                <span className="text-sm text-gray-700">I agree to the <span className="font-semibold text-amber-600">Spa Terms & Conditions</span> and <span className="font-semibold text-amber-600">Cancellation Policy</span>.</span>
              </label>
              <div className="flex gap-3">
                <button onClick={()=>setStep(0)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 text-sm">← Back</button>
                <button onClick={()=>setStep(2)} disabled={!detValid}
                  className="flex-[2] bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50">
                  Proceed to Payment →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Payment */}
          {step===2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {det.fullName?.[0]?.toUpperCase()||'?'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{det.fullName}</p>
                  <p className="text-gray-500 text-xs">{det.email} · {det.phone}</p>
                </div>
                <button onClick={()=>setStep(1)} className="text-xs text-amber-600 hover:underline">Edit</button>
              </div>
              {saving ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                  <p className="text-gray-500">Saving your booking…</p>
                </div>
              ) : (
                <PaymentGateway bookingId={ref} amount={treatment.amount}
                  userInfo={{ name:det.fullName, email:det.email }}
                  onSuccess={handlePaymentSuccess}/>
              )}
            </div>
          )}

          {/* Step 3 — Confirmed */}
          {step===3 && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h2 className="text-2xl font-bold mb-1">Booking Received! 🌿</h2>
                <p className="text-green-100 text-sm">Your booking is pending — click <strong>Attend</strong> on the day to confirm your slot</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Booking Reference</p>
                    <p className="text-2xl font-mono font-bold text-gray-800">{ref}</p>
                    <p className="text-xs text-yellow-700 mt-1.5 font-semibold">⏳ Status: Pending — Click Attend on your booking day to confirm</p>
                  </div>
                  {[['Treatment',treatment.name],['Duration',treatment.duration],
                    ['Date',sch.date?new Date(sch.date).toLocaleDateString('en-IN',{weekday:'short',month:'long',day:'numeric'}):sch.date],
                    ['Time',sch.time]].map(([k,v])=>(
                    <div key={k} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                      <p className="font-bold text-gray-800 text-sm">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                  <p>📧 Confirmation sent to <strong>{det.email}</strong></p>
                  <p>⏰ Please arrive <strong>15 minutes early</strong></p>
                  <p>🧴 Complimentary robe, slippers & herbal tea included</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Link to="/spa/bookings" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm text-center transition">📋 My Bookings</Link>
                  <Link to="/" className="flex-1 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl text-sm text-center transition">Go to Home</Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border p-5 sticky top-20">
            <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400" alt="Spa" className="w-full h-32 object-cover rounded-xl mb-4"/>
            <div className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">{treatment.category}</div>
            <h3 className="font-bold text-gray-800 mb-0.5">{treatment.name}</h3>
            <p className="text-gray-500 text-xs mb-4">⏱ {treatment.duration}</p>
            <div className="border-t pt-3 space-y-2 text-sm">
              {sch.date&&<div className="flex justify-between text-gray-600"><span>Date</span><span className="font-medium">{sch.date}</span></div>}
              {sch.time&&<div className="flex justify-between text-gray-600"><span>Time</span><span className="font-medium">{sch.time}</span></div>}
              <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                <span>Total</span><span className="text-amber-600 text-base">{treatment.price}</span>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-400">
              <p>✓ Free cancellation 48h before</p>
              <p>✓ Robe & slippers included</p>
              <p>✓ Approval required to confirm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
