import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TREATMENTS = [
  { name:'Amigo Gold Body Wrap', duration:'90 min', price:'₹12,000', amount:12000, category:'Body', desc:'Pure 24K gold-infused oil body treatment for radiant, youthful skin.' },
  { name:'Himalayan Salt Stone Massage', duration:'60 min', price:'₹8,500', amount:8500, category:'Massage', desc:'Warm salt stones melt away tension and detoxify the body deeply.' },
  { name:'Couples Retreat', duration:'120 min', price:'₹22,000', amount:22000, category:'Couples', desc:'Private suite with jacuzzi, champagne, rose petals and dual massage.' },
  { name:'Ayurvedic Abhyanga', duration:'75 min', price:'₹9,000', amount:9000, category:'Ayurvedic', desc:'Traditional four-hand oil massage balancing all three doshas.' },
  { name:'Oxygen Facial', duration:'60 min', price:'₹7,500', amount:7500, category:'Facial', desc:'Pressurised oxygen infused with hyaluronic acid for instant glow.' },
  { name:'Hammam Ritual', duration:'90 min', price:'₹10,500', amount:10500, category:'Body', desc:'Traditional Turkish bath with black soap, kessa scrub, and foam massage.' },
];

const GALLERY = [
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800',
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800',
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800',
  'https://images.unsplash.com/photo-1552693673-1bf958298935?w=800',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
];

export default function SpaPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  // Modal state machine: null → 'schedule' → 'payment' → 'success' → 'cancel_confirm' → 'cancelled'
  const [modalStep, setModalStep] = useState(null);
  const [treatment, setTreatment] = useState(null);
  const [schedule, setSchedule] = useState({ date:'', time:'', guests:'1', notes:'' });
  const [payMethod, setPayMethod] = useState('card');
  const [payForm, setPayForm] = useState({ cardName:'', cardNumber:'', expiry:'', cvv:'', upiId:'', bank:'' });
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState(null);

  const cats = ['All','Massage','Body','Facial','Ayurvedic','Couples'];
  const filtered = activeFilter === 'All' ? TREATMENTS : TREATMENTS.filter(t => t.category === activeFilter);

  const openBook = (t) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate('/spa/book', { state: { treatment: t } });
  };

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      const ref = 'SPA-' + Math.random().toString(36).substr(2,8).toUpperCase();
      const apptDate = new Date(schedule.date + 'T' + schedule.time);
      setBooking({ ref, treatment, date: schedule.date, time: schedule.time, guests: schedule.guests, amount: treatment.amount, bookedAt: new Date().toLocaleString('en-IN'), apptDate });
      setProcessing(false);
      setModalStep('success');
    }, 2000);
  };

  const handleCancelConfirm = () => {
    if (!booking) return;
    const now = new Date();
    const hoursUntil = (booking.apptDate - now) / 3600000;
    let refundPct, refundAmt, policy;
    if (hoursUntil > 48) { refundPct = 100; refundAmt = booking.amount; policy = 'Full refund — cancelled more than 48 hours before appointment.'; }
    else if (hoursUntil > 24) { refundPct = 50; refundAmt = Math.round(booking.amount * 0.5); policy = '50% refund — cancelled between 24–48 hours before appointment.'; }
    else { refundPct = 0; refundAmt = 0; policy = 'No refund — cancelled less than 24 hours before appointment.'; }
    setBooking(prev => ({ ...prev, refundPct, refundAmt, policy }));
    setModalStep('cancelled');
  };

  const closeModal = () => { setModalStep(null); setTreatment(null); setBooking(null); };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600" alt="Spa" className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-black/50"/>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Total Wellbeing</p>
          <h1 className="text-5xl font-light mb-2" style={{fontFamily:'Georgia,serif'}}>Amigo <em className="text-amber-400">Spa</em></h1>
          <p className="text-gray-300 text-sm">5,000 sqm sanctuary · 22 treatment rooms · Open 6AM–11PM</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">
        {/* Gallery */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center" style={{fontFamily:'Georgia,serif'}}>Our Sanctuary</h2>
          <div className="grid grid-cols-3 gap-3">
            {GALLERY.map((img, i) => (
              <div key={i} className={`overflow-hidden rounded-2xl ${i===0?'col-span-2':''}`}>
                <img src={img} alt={`Spa ${i+1}`} className="w-full object-cover hover:scale-105 transition-transform duration-500" style={{height: i===0?'320px':'155px'}}/>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{icon:'🧖',label:'22 Treatment Rooms'},{icon:'🏊',label:'Heated Indoor Pool'},{icon:'🧖‍♂️',label:'Hammam & Steam'},{icon:'💑',label:'Couples Suites'},{icon:'🧘',label:'Yoga & Meditation'},{icon:'💪',label:'24hr Fitness Center'},{icon:'🌿',label:'Organic Products'},{icon:'🍵',label:'Herbal Tea Lounge'}].map(h => (
            <div key={h.label} className="bg-white rounded-2xl p-4 text-center shadow-sm border hover:border-amber-300 transition">
              <span className="text-3xl block mb-2">{h.icon}</span>
              <p className="text-sm font-semibold text-gray-700">{h.label}</p>
            </div>
          ))}
        </div>

        {/* Treatments */}
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1" style={{fontFamily:'Georgia,serif'}}>Signature Treatments</h2>
            <p className="text-gray-500 text-sm">All treatments include access to thermal facilities</p>
          </div>
          <div className="flex gap-2 justify-center mb-6 flex-wrap">
            {cats.map(c => (
              <button key={c} onClick={() => setActiveFilter(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${activeFilter===c?'bg-amber-400 text-gray-900':'bg-white text-gray-600 border hover:bg-gray-50'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(t => (
              <div key={t.name} className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{t.category}</span>
                  <span className="text-xs text-gray-400">⏱ {t.duration}</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{t.name}</h3>
                <p className="text-gray-500 text-sm mb-4 flex-1">{t.desc}</p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t">
                  <span className="text-amber-600 font-bold text-lg">{t.price}</span>
                  <button onClick={() => openBook(t)} className="bg-gray-900 hover:bg-amber-400 hover:text-gray-900 text-white text-sm font-bold px-5 py-2 rounded-xl transition">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MODAL ═══ */}
      {modalStep && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">

            {/* ── STEP 1: Schedule ── */}
            {modalStep === 'schedule' && (
              <>
                <div className="bg-gradient-to-r from-gray-900 to-amber-900 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">Book Treatment</p>
                      <h3 className="font-bold text-xl">{treatment?.name}</h3>
                      <p className="text-amber-300 text-sm mt-0.5">{treatment?.price} · {treatment?.duration}</p>
                    </div>
                    <button onClick={closeModal} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition text-lg">✕</button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Date *</label>
                      <input type="date" value={schedule.date} min={new Date().toISOString().split('T')[0]}
                        onChange={e => setSchedule({...schedule, date:e.target.value})}
                        className="w-full border rounded-xl px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Time *</label>
                      <select value={schedule.time} onChange={e => setSchedule({...schedule, time:e.target.value})}
                        className="w-full border rounded-xl px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="">Select</option>
                        {['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00','19:00'].map(t=>(
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Guests</label>
                    <select value={schedule.guests} onChange={e => setSchedule({...schedule, guests:e.target.value})}
                      className="w-full border rounded-xl px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                      {['1','2'].map(n=><option key={n} value={n}>{n} person{n>'1'?'s':''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Special Notes</label>
                    <textarea value={schedule.notes} onChange={e => setSchedule({...schedule, notes:e.target.value})}
                      placeholder="Allergies, preferences, medical conditions..." rows={2}
                      className="w-full border rounded-xl px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"/>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                    <p className="font-bold mb-1">💡 Cancellation Policy</p>
                    <p>48+ hours: Full refund · 24–48 hours: 50% refund · Under 24 hours: No refund</p>
                  </div>
                  <button onClick={() => setModalStep('payment')} disabled={!schedule.date || !schedule.time}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50">
                    Proceed to Payment →
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: Payment ── */}
            {modalStep === 'payment' && (
              <>
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">Secure Payment</p>
                      <h3 className="font-bold text-lg leading-tight">{treatment?.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-400">{treatment?.price}</p>
                      <p className="text-gray-400 text-xs">{schedule.date} · {schedule.time}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
                    <div className="flex justify-between text-gray-600"><span>Treatment</span><span className="font-semibold text-gray-800 text-right max-w-[60%]">{treatment?.name}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Duration</span><span>{treatment?.duration}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Date & Time</span><span>{schedule.date} at {schedule.time}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Guests</span><span>{schedule.guests} person{schedule.guests>'1'?'s':''}</span></div>
                    <div className="flex justify-between font-bold text-gray-800 border-t pt-2 text-base"><span>Total</span><span className="text-amber-600">{treatment?.price}</span></div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{id:'card',label:'💳 Card'},{id:'upi',label:'📱 UPI'},{id:'netbanking',label:'🏦 Net Banking'}].map(m => (
                        <button key={m.id} onClick={() => setPayMethod(m.id)}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition ${payMethod===m.id?'bg-amber-400 border-amber-400 text-gray-900 shadow-sm':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card */}
                  {payMethod === 'card' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Name on Card</label>
                        <input value={payForm.cardName} onChange={e => setPayForm({...payForm, cardName:e.target.value})}
                          placeholder="John Doe" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Card Number</label>
                        <input value={payForm.cardNumber}
                          onChange={e => setPayForm({...payForm, cardNumber:e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()})}
                          placeholder="4242 4242 4242 4242" maxLength={19}
                          className="w-full border rounded-xl px-3 py-2 mt-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Expiry</label>
                          <input value={payForm.expiry} onChange={e => setPayForm({...payForm, expiry:e.target.value})}
                            placeholder="MM/YY" maxLength={5} className="w-full border rounded-xl px-3 py-2 mt-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">CVV</label>
                          <input value={payForm.cvv} onChange={e => setPayForm({...payForm, cvv:e.target.value.replace(/\D/g,'').slice(0,3)})}
                            placeholder="•••" maxLength={3} type="password" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* UPI */}
                  {payMethod === 'upi' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">UPI ID</label>
                      <input value={payForm.upiId} onChange={e => setPayForm({...payForm, upiId:e.target.value})}
                        placeholder="yourname@okicici" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                      <p className="text-xs text-gray-400 mt-1">You'll receive a payment request on your UPI app</p>
                    </div>
                  )}
                  {/* Net Banking */}
                  {payMethod === 'netbanking' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Select Bank</label>
                      <select value={payForm.bank} onChange={e => setPayForm({...payForm, bank:e.target.value})}
                        className="w-full border rounded-xl px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="">Choose your bank</option>
                        {['SBI','HDFC Bank','ICICI Bank','Axis Bank','Kotak Bank','Yes Bank','Punjab National Bank','Bank of Baroda'].map(b=><option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                    <span>🔒</span><span>256-bit SSL encrypted. Your payment details are never stored on our servers.</span>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setModalStep('schedule')} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">← Back</button>
                    <button onClick={handlePay} disabled={processing}
                      className="flex-[2] bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-70 text-sm flex items-center justify-center gap-2">
                      {processing
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Processing...</>
                        : <>Pay {treatment?.price} →</>
                      }
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 3: Success ── */}
            {modalStep === 'success' && booking && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Booking Confirmed! 🌿</h3>
                <p className="text-gray-500 text-sm mb-5">Your spa treatment has been successfully booked and payment received.</p>

                <div className="bg-gradient-to-br from-amber-50 to-green-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2 mb-5">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Reference</span><span className="font-mono font-bold text-gray-800">{booking.ref}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Treatment</span><span className="font-semibold text-gray-800 text-right max-w-[60%]">{booking.treatment.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="font-semibold">{new Date(booking.date).toLocaleDateString('en-IN',{weekday:'short',month:'long',day:'numeric',year:'numeric'})}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Time</span><span className="font-semibold">{booking.time}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Guests</span><span>{booking.guests} person{booking.guests>'1'?'s':''}</span></div>
                  <div className="flex justify-between text-sm border-t pt-2"><span className="text-gray-500 font-bold">Amount Paid</span><span className="font-bold text-green-600 text-base">₹{booking.amount.toLocaleString('en-IN')}</span></div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 mb-5 text-left">
                  📧 Confirmation sent · 📱 Please arrive 15 minutes early · 🧴 Complimentary robe & slippers provided
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setModalStep('cancel_confirm')}
                    className="flex-1 border border-red-300 text-red-500 font-semibold py-2.5 rounded-xl hover:bg-red-50 transition text-sm">
                    Cancel Booking
                  </button>
                  <button onClick={closeModal}
                    className="flex-1 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 rounded-xl transition text-sm">
                    Done ✓
                  </button>
                </div>
              </div>
            )}

            {/* ── Cancel Confirm ── */}
            {modalStep === 'cancel_confirm' && booking && (
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">⚠️</div>
                  <h3 className="font-bold text-gray-800 text-xl">Cancel Treatment?</h3>
                  <p className="text-gray-500 text-sm mt-1 font-medium">{booking.treatment.name}</p>
                  <p className="text-gray-400 text-xs">{new Date(booking.date).toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})} at {booking.time}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm">
                  <p className="font-bold text-amber-800 mb-3">📋 Refund Policy</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-amber-700">
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>Cancel <strong>48+ hours</strong> before → <strong className="text-green-700">100% Full Refund</strong></span>
                    </div>
                    <div className="flex items-start gap-2 text-amber-700">
                      <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>Cancel <strong>24–48 hours</strong> before → <strong className="text-yellow-700">50% Refund</strong></span>
                    </div>
                    <div className="flex items-start gap-2 text-amber-700">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>Cancel <strong>under 24 hours</strong> before → <strong className="text-red-600">No Refund</strong></span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-sm flex justify-between">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-bold text-gray-800">₹{booking.amount.toLocaleString('en-IN')}</span>
                </div>

                <p className="text-xs text-center text-gray-400">This action cannot be undone. Are you sure you want to cancel?</p>

                <div className="flex gap-3">
                  <button onClick={() => setModalStep('success')} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm">Keep Booking</button>
                  <button onClick={handleCancelConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition text-sm">Yes, Cancel It</button>
                </div>
              </div>
            )}

            {/* ── Cancelled Result ── */}
            {modalStep === 'cancelled' && booking && (
              <div className="p-7">
                {/* Header */}
                <div className="text-center mb-5">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-4xl">❌</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">Booking Cancelled</h3>
                  <p className="text-gray-500 text-sm">Your {booking.treatment.name} appointment has been cancelled.</p>
                </div>

                {/* Refund Details Card */}
                <div className={`rounded-2xl p-5 mb-4 border-2 ${booking.refundPct===100?'bg-green-50 border-green-300':booking.refundPct===50?'bg-yellow-50 border-yellow-300':'bg-red-50 border-red-200'}`}>
                  <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    💰 Refund Details
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Treatment</span>
                      <span className="font-semibold text-gray-800">{booking.treatment.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount Paid</span>
                      <span className="font-semibold">₹{booking.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Refund Percentage</span>
                      <span className={`font-bold text-base ${booking.refundPct===100?'text-green-600':booking.refundPct===50?'text-yellow-600':'text-red-500'}`}>
                        {booking.refundPct}%
                      </span>
                    </div>
                    <div className="flex justify-between border-t-2 pt-2 mt-1">
                      <span className="font-bold text-gray-700 text-base">Refund to Your Account</span>
                      <span className={`font-bold text-xl ${booking.refundPct>0?'text-green-600':'text-red-500'}`}>
                        ₹{booking.refundAmt.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Policy message */}
                  <div className={`mt-3 rounded-xl p-3 text-xs font-semibold ${booking.refundPct===100?'bg-green-100 text-green-700':booking.refundPct===50?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-600'}`}>
                    📋 {booking.policy}
                  </div>
                </div>

                {/* Refund timeline */}
                {booking.refundPct > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800">
                    <p className="font-bold mb-1">✅ Refund Initiated</p>
                    <p>₹{booking.refundAmt.toLocaleString('en-IN')} will be credited back to your original payment method within <strong>5–7 business days</strong>.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-sm text-gray-600">
                    <p className="font-bold mb-1">ℹ️ No Refund Applicable</p>
                    <p>As per our policy, cancellations made less than 24 hours before the appointment are not eligible for a refund.</p>
                  </div>
                )}

                {/* Cancellation confirmation */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 mb-5">
                  <div className="flex justify-between mb-1"><span>Booking Ref</span><span className="font-mono font-bold">{booking.ref}</span></div>
                  <div className="flex justify-between"><span>Cancelled At</span><span>{new Date().toLocaleString('en-IN')}</span></div>
                </div>

                <p className="text-xs text-center text-gray-400 mb-4">📧 Cancellation confirmation has been sent to your email</p>
                <button onClick={closeModal} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition">
                  Close
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
