/**
 * HotelSearchPage.jsx
 * Unified Hotel flow: Cities → Hotels → Room List → Room Detail → Booking
 * All room functionality integrated here. No separate Room module needed.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelAPI, bookingAPI } from '../../services/api';
import { useAuth }   from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';
import PaymentGateway from '../../components/payment/PaymentGateway';
import toast from 'react-hot-toast';

/* ─── City data ─────────────────────────────────────────── */
const TN_CITIES = [
  { code:'MAA', name:'Chennai',    tagline:'Gateway of South India',    hotels:'200+ Hotels', color:'#e67e22',
    image:'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
    landmark:'Marina Beach', landmarkDesc:"World's longest urban beach" },
  { code:'CJB', name:'Coimbatore', tagline:'Manchester of South India', hotels:'120+ Hotels', color:'#27ae60',
    image:'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80',
    landmark:'Ooty Hills & Tea Gardens', landmarkDesc:'Nature & cottage retreats' },
  { code:'IXM', name:'Madurai',    tagline:'City of Temples',           hotels:'90+ Hotels',  color:'#8e44ad',
    image:'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80',
    landmark:'Meenakshi Amman Temple', landmarkDesc:"4,000-year-old Dravidian heritage" },
  { code:'TRZ', name:'Trichy',     tagline:'Rock Fort City',            hotels:'70+ Hotels',  color:'#2980b9',
    image:'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    landmark:'Rockfort Temple', landmarkDesc:'Ancient temple on granite rock' },
  { code:'SXV', name:'Salem',      tagline:'City of Mango & Steel',     hotels:'50+ Hotels',  color:'#c0392b',
    image:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    landmark:'Food & Culture Hub', landmarkDesc:'Famous for Salem mangoes & cuisine' },
];

/* ─── Hotel image pool ──────────────────────────────────── */
const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  'https://images.unsplash.com/photo-1582610116397-edb72f6af4c5?w=600&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&q=80',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80',
  'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
];

/* ─── Room image sets per type ───────────────────────────── */
const ROOM_IMAGE_SETS = {
  STANDARD: {
    room:     ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80','https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80','https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=900&q=80'],
    toilet:   ['https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80','https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=900&q=80','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80'],
    amenities:['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80','https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=900&q=80','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80'],
  },
  DELUXE: {
    room:     ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80','https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=900&q=80','https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=900&q=80'],
    toilet:   ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80','https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=900&q=80'],
    balcony:  ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80'],
    amenities:['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80','https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=900&q=80','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80'],
  },
  SUITE: {
    room:     ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80','https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=900&q=80','https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=80'],
    toilet:   ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80'],
    balcony:  ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80','https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80'],
    amenities:['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80','https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=900&q=80','https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80'],
  },
  TWIN: {
    room:     ['https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=900&q=80','https://images.unsplash.com/photo-1544148103-0773bf10d330?w=900&q=80','https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80'],
    toilet:   ['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=900&q=80','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80'],
    amenities:['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80','https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=900&q=80'],
  },
};
const ROOM_IMAGE_SETS_DEFAULT = ROOM_IMAGE_SETS.STANDARD;
const getRoomImageSet = (room) => {
  const type = (room.roomType || room.bedType || '').toUpperCase();
  return ROOM_IMAGE_SETS[type] || ROOM_IMAGE_SETS_DEFAULT;
};
const getRoomHeroImage = (room) => {
  const set = getRoomImageSet(room);
  return set.room[0];
};

/* ─── Category meta for gallery ─────────────────────────── */
const CATEGORY_META = {
  room:      { label:'Room',      icon:'🛏️' },
  toilet:    { label:'Bathroom',  icon:'🚿' },
  balcony:   { label:'Balcony',   icon:'🌅' },
  amenities: { label:'Amenities', icon:'✨' },
};

/* ─── Amenity icon map ───────────────────────────────────── */
const AMENITY_ICONS = {
  WIFI:'📶', AIR_CONDITIONING:'❄️', MINIBAR:'🍸', TELEVISION:'📺',
  SAFE:'🔒', BATHTUB:'🛁', SWIMMING_POOL:'🏊', GYM:'💪',
  RESTAURANT:'🍽️', PARKING:'🅿️', SPA:'🧖', BAR:'🍺',
  ROOM_SERVICE:'🛎️', LAUNDRY:'👔', BUSINESS_CENTER:'💼',
  wifi:'📶', ac:'❄️', pool:'🏊', spa:'🌿', gym:'💪',
  parking:'🅿️', restaurant:'🍽️', bar:'🍸', tv:'📺',
  balcony:'🌅', kitchen:'🍳', laundry:'👕',
};
const getIcon = (a) => AMENITY_ICONS[a] || '✨';

/* ─── Date helpers ───────────────────────────────────────── */
const fmtDate  = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
const dispDate = (s) => s ? new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '';
const todayStr    = fmtDate(new Date());
const tomorrowStr = fmtDate(new Date(Date.now() + 86400000));
const nightsBetween = (a, b) => (a && b) ? Math.max(0, Math.round((new Date(b)-new Date(a))/86400000)) : 0;

/* ─── STEPS ─────────────────────────────────────────────── */
const STEPS = ['cities','hotels','rooms','roomDetail','booking'];

/* ════════════════════════════════════════════════════════════
   GALLERY LIGHTBOX
═══════════════════════════════════════════════════════════ */
function GalleryModal({ imageSet, initialCategory, initialIndex, onClose }) {
  const availableCats = Object.keys(CATEGORY_META).filter(c => imageSet[c]?.length);
  const [cat, setCat]   = useState(initialCategory || availableCats[0]);
  const [idx, setIdx]   = useState(initialIndex || 0);
  const [loaded, setLoaded] = useState(false);
  const imgs = imageSet[cat] || [];

  const prev = useCallback(()=>{ setIdx(i=>(i-1+imgs.length)%imgs.length); setLoaded(false); },[imgs.length]);
  const next = useCallback(()=>{ setIdx(i=>(i+1)%imgs.length); setLoaded(false); },[imgs.length]);

  useEffect(()=>{
    const k=(e)=>{ if(e.key==='ArrowLeft')prev(); if(e.key==='ArrowRight')next(); if(e.key==='Escape')onClose(); };
    window.addEventListener('keydown',k);
    return ()=>window.removeEventListener('keydown',k);
  },[prev,next,onClose]);

  useEffect(()=>{ document.body.style.overflow='hidden'; return ()=>{ document.body.style.overflow=''; }; },[]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{background:'rgba(6,8,14,0.97)'}} onClick={onClose}>
      <style>{`
        .gal-img{opacity:0;transition:opacity .35s ease}.gal-img.loaded{opacity:1}
        .gal-thumb{border:2px solid transparent;transition:all .25s ease}
        .gal-thumb:hover{border-color:#F59E0B;transform:scale(1.06)}
        .gal-thumb.active{border-color:#F59E0B;box-shadow:0 0 0 3px rgba(245,158,11,.3)}
        .gal-cat{transition:all .2s ease}.gal-cat:hover{background:rgba(245,158,11,.15)}
        .gal-cat.active{background:#F59E0B;color:#111827}
        .gal-arr{transition:all .25s cubic-bezier(.34,1.56,.64,1)}
        .gal-arr:hover{background:rgba(245,158,11,.2);transform:scale(1.12)}
      `}</style>
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{borderBottom:'1px solid rgba(255,255,255,.08)'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-2 flex-wrap">
          {availableCats.map(c=>(
            <button key={c} onClick={()=>{setCat(c);setIdx(0);setLoaded(false);}}
              className={`gal-cat flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition ${cat===c?'active':'text-gray-300 border border-white/10'}`}>
              {CATEGORY_META[c].icon} {CATEGORY_META[c].label} <span className="text-xs opacity-60">({imageSet[c]?.length})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{idx+1}/{imgs.length}</span>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition">✕</button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative px-4 py-4 min-h-0" onClick={e=>e.stopPropagation()}>
        {imgs.length>1&&<button onClick={prev} className="gal-arr absolute left-4 z-10 w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white text-2xl">‹</button>}
        <img key={`${cat}-${idx}`} src={imgs[idx]} alt="" onLoad={()=>setLoaded(true)}
          className={`gal-img max-w-full max-h-full object-contain rounded-xl shadow-2xl select-none ${loaded?'loaded':''}`}
          style={{maxHeight:'calc(100vh - 220px)'}}/>
        {imgs.length>1&&<button onClick={next} className="gal-arr absolute right-4 z-10 w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white text-2xl">›</button>}
      </div>
      <div className="flex-shrink-0 px-6 py-4 flex gap-3 justify-center overflow-x-auto" style={{borderTop:'1px solid rgba(255,255,255,.08)'}} onClick={e=>e.stopPropagation()}>
        {imgs.map((img,i)=>(
          <button key={i} onClick={()=>{setIdx(i);setLoaded(false);}} className={`gal-thumb flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden ${idx===i?'active':''}`}>
            <img src={img} alt="" className="w-full h-full object-cover"/>
          </button>
        ))}
      </div>
      <p className="text-center text-gray-600 text-xs pb-3">Press ESC or click outside to close · ← → to navigate</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   BOOKING WIZARD (4-step: Stay Details → Review → Your Details → Payment)
═══════════════════════════════════════════════════════════ */
const BOOKING_STEPS = ['Stay Details','Review','Your Details','Payment'];

function BookingWizard({ room, selectedHotel, checkIn: initialCheckIn, checkOut: initialCheckOut, adults: initialAdults, onBack, onDone }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [bStep, setBStep] = useState(0);
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    checkIn:  initialCheckIn  || todayStr,
    checkOut: initialCheckOut || tomorrowStr,
    guests:   { adults: initialAdults || 1, children: 0 },
    specialRequests: '',
  });

  const [cd, setCd] = useState({
    fullName:    user?.name  || '',
    email:       user?.email || '',
    phone:       user?.phone || '',
    nationality: '',
    idType:      'aadhar',
    idNumber:    '',
    address:     '',
    arrivalTime: '15:00',
    agreeTerms:  false,
  });

  useEffect(()=>{ if(user) setCd(p=>({...p,fullName:user.name||p.fullName,email:user.email||p.email,phone:user.phone||p.phone})); },[user]);

  const nights   = nightsBetween(form.checkIn, form.checkOut);
  // For Amadeus rooms use displayPrice/totalPrice; for DB rooms use pricePerNight
  const nightlyRate = room.displayPrice || room.totalPrice || room.pricePerNight || 0;
  const effectivePrice = (room.discountPercent > 0 && room.pricePerNight)
    ? room.pricePerNight * (1 - room.discountPercent / 100) : nightlyRate;
  const base  = +(effectivePrice * nights).toFixed(2);
  const tax   = +(base * 0.12).toFixed(2);
  const svc   = +(base * 0.05).toFixed(2);
  const total = +(base + tax + svc).toFixed(2);

  const cdValid = cd.fullName.trim() && cd.email.trim() && cd.phone.trim() && cd.idNumber.trim() && cd.agreeTerms;

  const handleCreateBooking = async () => {
    if (!form.checkIn || !form.checkOut || nights < 1) { toast.error('Please select valid dates.'); return; }
    if (!user) { toast.error('Please login to book.'); navigate('/login'); return; }
    setSubmitting(true);
    try {
      // For Amadeus/fallback rooms offerId is not a MongoDB ObjectId.
      // Send full roomData so backend can upsert a virtual Room document.
      const roomId = room._id || room.offerId || room.roomId;
      const roomData = room._id ? null : {
        offerId:      room.offerId,
        roomName:     room.roomName,
        roomType:     (room.roomType || room.bedType || 'standard').toLowerCase(),
        bedType:      (room.bedType || 'double').toLowerCase(),
        beds:         room.beds || 1,
        adults:       room.adults || 2,
        description:  room.description || '',
        pricePerNight: room.displayPrice || room.totalPrice || 0,
        amenities:    Array.isArray(room.amenities) ? room.amenities : [],
        hotelId:      selectedHotel?.hotelId || '',
        hotelName:    selectedHotel?.name || '',
        isFallback:   !!room.isFallback,
      };
      const { data } = await bookingAPI.create({ roomId, roomData, ...form, customerDetails: cd });
      setBooking(data.data.booking);
      setBStep(3);
      toast.success('Booking created! Complete payment to confirm.');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {BOOKING_STEPS.map((label,i)=>(
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i<bStep?'bg-green-500 text-white':i===bStep?'bg-amber-400 text-gray-900':'bg-gray-200 text-gray-500'}`}>
                {i<bStep?'✓':i+1}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${i===bStep?'text-amber-600 font-semibold':'text-gray-400'}`}>{label}</span>
            </div>
            {i<BOOKING_STEPS.length-1&&<div className={`flex-1 h-0.5 mx-2 ${i<bStep?'bg-green-400':'bg-gray-200'}`}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: step content */}
        <div className="lg:col-span-2">

          {/* STEP 0: Stay Details */}
          {bStep===0&&(
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Stay Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Check-In</label>
                  <input type="date" value={form.checkIn} min={todayStr}
                    onChange={e=>setForm({...form,checkIn:e.target.value})} className={inputCls}/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Check-Out</label>
                  <input type="date" value={form.checkOut} min={form.checkIn||todayStr}
                    onChange={e=>setForm({...form,checkOut:e.target.value})} className={inputCls}/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Adults</label>
                  <select value={form.guests.adults} onChange={e=>setForm({...form,guests:{...form.guests,adults:+e.target.value}})} className={inputCls}>
                    {[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Children</label>
                  <select value={form.guests.children} onChange={e=>setForm({...form,guests:{...form.guests,children:+e.target.value}})} className={inputCls}>
                    {[0,1,2,3].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Special Requests (optional)</label>
                <textarea value={form.specialRequests} onChange={e=>setForm({...form,specialRequests:e.target.value})}
                  placeholder="Early check-in, dietary needs..." rows={3}
                  className={inputCls+' resize-none'}/>
              </div>
              <div className="flex gap-3">
                <button onClick={onBack} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">← Back</button>
                <button onClick={()=>setBStep(1)} disabled={nights<1}
                  className="flex-[2] bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50">
                  Continue to Review →
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Review */}
          {bStep===1&&(
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Review Your Stay</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                {[
                  ['Hotel',     selectedHotel?.name],
                  ['Room',      room.roomName||room.name],
                  ['Check-In',  dispDate(form.checkIn)],
                  ['Check-Out', dispDate(form.checkOut)],
                  ['Duration',  `${nights} night${nights>1?'s':''}`],
                  ['Guests',    `${form.guests.adults} adults, ${form.guests.children} children`],
                  ...(form.specialRequests?[['Special Requests',form.specialRequests]]:[]),
                ].map(([label,val])=>(
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800 text-right">{val}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setBStep(0)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">← Edit</button>
                <button onClick={()=>setBStep(2)} className="flex-[2] bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition">Enter Details →</button>
              </div>
            </div>
          )}

          {/* STEP 2: Customer Details */}
          {bStep===2&&(
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
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Full Name *</label>
                    <input value={cd.fullName} onChange={e=>setCd({...cd,fullName:e.target.value})} placeholder="As per your ID" className={inputCls}/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email *</label>
                    <input type="email" value={cd.email} onChange={e=>setCd({...cd,email:e.target.value})} className={inputCls}/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Mobile Number *</label>
                    <input type="tel" value={cd.phone} onChange={e=>setCd({...cd,phone:e.target.value})} placeholder="+91 98765 43210" className={inputCls}/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Nationality</label>
                    <input value={cd.nationality} onChange={e=>setCd({...cd,nationality:e.target.value})} placeholder="e.g. Indian" className={inputCls}/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Expected Arrival</label>
                    <select value={cd.arrivalTime} onChange={e=>setCd({...cd,arrivalTime:e.target.value})} className={inputCls}>
                      {['12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'].map(t=><option key={t}>{t}</option>)}
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
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">ID Type *</label>
                    <select value={cd.idType} onChange={e=>setCd({...cd,idType:e.target.value})} className={inputCls}>
                      <option value="aadhar">Aadhar Card</option>
                      <option value="passport">Passport</option>
                      <option value="pan">PAN Card</option>
                      <option value="driving_license">Driving Licence</option>
                      <option value="voter_id">Voter ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">ID Number *</label>
                    <input value={cd.idNumber} onChange={e=>setCd({...cd,idNumber:e.target.value})} placeholder="Enter ID number" className={inputCls}/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Home Address</label>
                    <input value={cd.address} onChange={e=>setCd({...cd,address:e.target.value})} placeholder="Street, City, State, PIN" className={inputCls}/>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={cd.agreeTerms} onChange={e=>setCd({...cd,agreeTerms:e.target.checked})} className="mt-0.5 w-4 h-4 accent-amber-400"/>
                  <span className="text-sm text-gray-700">I agree to the <span className="text-amber-600 font-semibold">Terms & Conditions</span> and <span className="text-amber-600 font-semibold">Cancellation Policy</span>. Full refund if cancelled 48+ hours before check-in.</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setBStep(1)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">← Back</button>
                <button onClick={handleCreateBooking} disabled={!cdValid||submitting}
                  className="flex-[2] bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50">
                  {submitting?'Creating…':'Proceed to Payment →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {bStep===3&&booking&&(
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border p-5">
                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Paying As</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center font-bold text-lg">
                    {cd.fullName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{cd.fullName}</div>
                    <div className="text-sm text-gray-500">{cd.email} · {cd.phone}</div>
                  </div>
                </div>
              </div>
              <PaymentGateway
                bookingId={booking._id}
                amount={booking.pricing?.totalAmount||total}
                userInfo={{name:cd.fullName,email:cd.email}}
                onSuccess={()=>navigate(`/bookings/${booking._id}?success=true`)}
              />
            </div>
          )}
        </div>

        {/* Sidebar summary */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border p-5 sticky top-20 space-y-4">
            <img src={getRoomHeroImage(room)} alt={room.roomName||room.name}
              className="w-full h-36 object-cover rounded-xl"/>
            <div>
              <div className="text-xs text-amber-600 font-semibold capitalize">{room.roomType||room.bedType||'Room'}</div>
              <div className="font-bold text-gray-800">{room.roomName||room.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{selectedHotel?.name}</div>
            </div>
            {nights>0&&(
              <div className="space-y-1.5 text-sm border-t pt-3">
                <div className="flex justify-between text-gray-600"><span>{formatINR(effectivePrice)} × {nights} nights</span><span>{formatINR(base)}</span></div>
                <div className="flex justify-between text-gray-600"><span>GST (12%)</span><span>{formatINR(tax)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Service (5%)</span><span>{formatINR(svc)}</span></div>
                <div className="flex justify-between font-bold text-gray-800 border-t pt-2 text-base"><span>Total</span><span>{formatINR(total)}</span></div>
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

/* ════════════════════════════════════════════════════════════
   ROOM DETAIL VIEW (embedded, same design language as RoomDetailPage)
═══════════════════════════════════════════════════════════ */
function RoomDetailView({ room, selectedHotel, checkIn, checkOut, adults, onBack, onBook }) {
  const [activeImg, setActiveImg]   = useState(0);
  const [galleryOpen, setGallery]   = useState(false);
  const [galCat, setGalCat]         = useState('room');
  const [galIdx, setGalIdx]         = useState(0);
  const [imgLoaded, setImgLoaded]   = useState(false);
  const [localIn, setLocalIn]       = useState(checkIn||todayStr);
  const [localOut, setLocalOut]     = useState(checkOut||tomorrowStr);

  const imageSet = getRoomImageSet(room);
  const hasBalcony = !!imageSet.balcony;
  const heroImages = imageSet.room;
  const heroSrc = heroImages[activeImg] || heroImages[0];

  const nights = nightsBetween(localIn, localOut);
  const nightlyRate = room.displayPrice || room.totalPrice || room.pricePerNight || 0;
  const TAX=0.12, SVC=0.05;
  const base  = +(nightlyRate*nights).toFixed(2);
  const tax   = +(base*TAX).toFixed(2);
  const svc   = +(base*SVC).toFixed(2);
  const total = +(base+tax+svc).toFixed(2);

  const openGallery = (cat, idx=0) => { setGalCat(cat); setGalIdx(idx); setGallery(true); };

  const availableCats = Object.keys(CATEGORY_META).filter(c => c==='balcony' ? hasBalcony : imageSet[c]);

  // Amenities: normalize to array of strings
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const policies = room.policies?.cancellation || 'Free cancellation applies.';

  const statCards = [
    { label:'Max Guests', value: room.adults||room.capacity?.adults||'—', icon:'👤', detail:'Adults' },
    { label:'Bed Type',   value: room.bedType||'Deluxe Bed',               icon:'🛏', detail:`${room.beds||room.bedCount||1} Bed${(room.beds||room.bedCount||1)>1?'s':''}` },
    { label:'Room Type',  value: room.roomType||room.type||'Standard',      icon:'🏷️', detail:'Category' },
    { label:'Board',      value: room.boardType||'Room Only',               icon:'☕', detail:'Meal Plan' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300&family=Cinzel:wght@400;500&family=Cormorant+Garamond:wght@400;500&display=swap');
        .rdp-hero-wrap{cursor:pointer}.rdp-hero{transition:transform .7s cubic-bezier(.25,.46,.45,.94)}
        .rdp-hero-wrap:hover .rdp-hero{transform:scale(1.03)}
        .rdp-thumb{border:2px solid transparent;transition:all .3s ease}
        .rdp-thumb:hover{border-color:#F59E0B;transform:scale(1.06)}
        .rdp-thumb.rdp-thumb-active{border-color:#F59E0B;box-shadow:0 0 0 3px rgba(245,158,11,.2)}
        .rdp-stat{transition:all .35s cubic-bezier(.34,1.56,.64,1)}
        .rdp-stat:hover{transform:translateY(-7px) scale(1.04);box-shadow:0 20px 44px rgba(168,131,74,.16)}
        .rdp-amenity{transition:all .25s ease}
        .rdp-amenity:hover{background:#FEF3C7;border-color:#F59E0B;transform:translateY(-2px);box-shadow:0 4px 12px rgba(245,158,11,.15)}
        .rdp-book-btn{transition:all .35s cubic-bezier(.34,1.56,.64,1)}
        .rdp-book-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 36px rgba(245,158,11,.45)}
        .rdp-img-in{opacity:0;transition:opacity .55s ease}.rdp-img-in.loaded{opacity:1}
        @keyframes rdpUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        .rdp-a1{animation:rdpUp .7s cubic-bezier(.16,1,.3,1) .05s both}
        .rdp-a2{animation:rdpUp .7s cubic-bezier(.16,1,.3,1) .18s both}
        .rdp-a3{animation:rdpUp .7s cubic-bezier(.16,1,.3,1) .30s both}
        .rdp-a4{animation:rdpUp .7s cubic-bezier(.16,1,.3,1) .42s both}
        .rdp-rule{height:1px;background:linear-gradient(90deg,transparent,#C9A96E 30%,#C9A96E 70%,transparent)}
        .cat-card{transition:all .3s cubic-bezier(.34,1.56,.64,1);cursor:pointer}
        .cat-card:hover{transform:translateY(-5px) scale(1.03);box-shadow:0 14px 36px rgba(0,0,0,.15)}
        .cat-card:hover .cat-overlay{opacity:1}
        .cat-overlay{transition:opacity .3s ease;opacity:0}
        .open-gal-btn{transition:all .3s cubic-bezier(.34,1.56,.64,1)}
        .open-gal-btn:hover{transform:scale(1.05);box-shadow:0 8px 20px rgba(245,158,11,.35)}
      `}</style>

      {/* Full-width hero */}
      <div className="relative overflow-hidden bg-gray-900 rdp-hero-wrap" style={{height:'clamp(280px,50vh,520px)'}}
        onClick={()=>openGallery('room',activeImg)} title="Click to view all photos">
        <img key={activeImg} src={heroSrc} alt={room.roomName||'Room'}
          onLoad={()=>setImgLoaded(true)}
          className={`w-full h-full object-cover rdp-hero rdp-img-in ${imgLoaded?'loaded':''}`}/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none"/>
        <div className="absolute bottom-5 right-6 flex items-center gap-2 bg-black/50 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20">
          🖼️ View All Photos
        </div>
        <div className="absolute top-6 left-7 flex items-center gap-3">
          <span className="bg-amber-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            {room.roomType||room.bedType||'Room'}
          </span>
          {room.overrideApplied&&<span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">Special Rate</span>}
        </div>
        <div className="absolute bottom-7 left-7 text-white">
          <p className="text-amber-300 text-xs font-semibold tracking-[.32em] uppercase mb-2" style={{fontFamily:"'Cinzel',serif"}}>
            {selectedHotel?.name}
          </p>
          <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(1.6rem,4vw,2.8rem)',fontWeight:300,lineHeight:1.1}}>
            {room.roomName||room.name||'Deluxe Room'}
          </h1>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="bg-gray-950 px-7 py-3 flex gap-2.5 overflow-x-auto">
        {heroImages.map((img,i)=>(
          <button key={i} onClick={()=>{setActiveImg(i);setImgLoaded(false);}}
            className={`rdp-thumb flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden ${activeImg===i?'rdp-thumb-active':''}`}>
            <img src={img} alt="" className="w-full h-full object-cover"/>
          </button>
        ))}
        {/* Bathroom preview thumbnail */}
        {imageSet.toilet&&(
          <button onClick={()=>openGallery('toilet',0)}
            className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 border-transparent hover:border-amber-400 transition relative group">
            <img src={imageSet.toilet[0]} alt="Bathroom" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <span className="text-white text-xs font-bold">🚿</span>
            </div>
          </button>
        )}
        <button onClick={()=>openGallery('room',0)}
          className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-amber-400/20 border border-amber-400/40 flex flex-col items-center justify-center gap-0.5 hover:bg-amber-400/30 transition">
          <span className="text-amber-400 text-lg">⊞</span>
          <span className="text-amber-400 text-xs font-bold">All</span>
        </button>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: details */}
          <div className="lg:col-span-2 space-y-10">

            {/* Price + description */}
            <div className="rdp-a1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-amber-600 text-xs font-bold tracking-[.28em] uppercase mb-1.5" style={{fontFamily:"'Cinzel',serif"}}>Nightly Rate</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light text-gray-900" style={{fontFamily:"'Playfair Display',Georgia,serif"}}>{formatINR(nightlyRate)}</span>
                    <span className="text-gray-400 text-sm">per night</span>
                  </div>
                  {room.overrideApplied&&room.originalPrice&&(
                    <p className="text-sm text-gray-400 line-through mt-0.5">{formatINR(room.originalPrice)}</p>
                  )}
                </div>
                {room.isFallback&&(
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs" style={{background:'rgba(251,191,36,.08)',border:'1px solid rgba(251,191,36,.2)',color:'#fbbf24'}}>
                    ℹ️ Demo price — test environment
                  </div>
                )}
              </div>
              <div className="rdp-rule mb-6"/>
              {room.description?(
                <p style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:'1.08rem',lineHeight:1.85,color:'#4B4740'}}>{room.description}</p>
              ):(
                <p style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:'1.08rem',lineHeight:1.85,color:'#6b7280'}}>
                  Experience premium comfort in this beautifully appointed room at {selectedHotel?.name}. Each room is thoughtfully designed to provide a restful and memorable stay.
                </p>
              )}
            </div>

            {/* Stat cards */}
            <div className="rdp-a2">
              <p className="text-xs font-bold text-gray-400 tracking-[.28em] uppercase mb-5" style={{fontFamily:"'Cinzel',serif"}}>Room Specifications</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {statCards.map(s=>(
                  <div key={s.label} className="rdp-stat rounded-2xl text-center py-7 px-2 bg-gradient-to-b from-amber-50 to-white border border-amber-100 shadow-sm cursor-default">
                    <span className="text-4xl block mb-3">{s.icon}</span>
                    <p className="font-semibold text-gray-800 text-sm mb-0.5 leading-tight capitalize" style={{fontFamily:"'Playfair Display',Georgia,serif"}}>{s.value}</p>
                    <p className="text-gray-400 text-xs uppercase tracking-widest">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo gallery by category */}
            <div className="rdp-a3">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-bold text-gray-400 tracking-[.28em] uppercase" style={{fontFamily:"'Cinzel',serif"}}>Photo Gallery</p>
                <button onClick={()=>openGallery('room',0)}
                  className="open-gal-btn flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold text-xs px-4 py-2 rounded-full">
                  🖼️ Open Full Gallery
                </button>
              </div>
              <div className={`grid gap-4 ${availableCats.length>=4?'grid-cols-2 sm:grid-cols-4':availableCats.length===3?'grid-cols-3':'grid-cols-2'}`}>
                {availableCats.map(cat=>{
                  const imgs=imageSet[cat]||[];
                  return (
                    <div key={cat} className="cat-card rounded-2xl overflow-hidden relative" onClick={()=>openGallery(cat,0)}>
                      <img src={imgs[0]} alt={CATEGORY_META[cat].label} className="w-full h-32 object-cover"
                        onError={e=>{e.target.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';}}/>
                      <div className="cat-overlay absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                        <span className="text-2xl">{CATEGORY_META[cat].icon}</span>
                        <span className="text-white text-xs font-bold uppercase tracking-widest">View {imgs.length} Photos</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center justify-between">
                        <span className="text-white text-xs font-bold flex items-center gap-1">{CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}</span>
                        <span className="text-amber-300 text-xs">{imgs.length} photos</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            {amenities.length>0&&(
              <div className="rdp-a3">
                <p className="text-xs font-bold text-gray-400 tracking-[.28em] uppercase mb-4" style={{fontFamily:"'Cinzel',serif"}}>Amenities & Features</p>
                <div className="flex flex-wrap gap-2.5">
                  {amenities.map(a=>(
                    <span key={a} className="rdp-amenity inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full shadow-sm">
                      <span className="text-base">{getIcon(a)}</span>
                      <span className="capitalize">{a.replace(/_/g,' ').toLowerCase()}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            <div className="rdp-a4 rounded-2xl border border-gray-100 bg-gray-50/80 p-7">
              <p className="text-xs font-bold text-gray-400 tracking-[.28em] uppercase mb-5" style={{fontFamily:"'Cinzel',serif"}}>Policies</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Cancellation</p>
                    <p className="font-semibold text-gray-700 text-sm">{policies.substring(0,80)}{policies.length>80?'…':''}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌙</span>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Board Type</p>
                    <p className="font-semibold text-gray-700 text-sm">{room.boardType||'Room Only'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: booking widget */}
          <div>
            <div className="sticky top-24 rounded-3xl overflow-hidden shadow-2xl shadow-amber-100/50 border border-amber-100"
              style={{background:'linear-gradient(170deg,#fffdf8 0%,#fdf8ef 100%)'}}>
              <div className="px-7 py-6 text-white" style={{background:'linear-gradient(135deg,#1a1208 0%,#2d2010 100%)'}}>
                <p className="text-amber-400 text-xs font-semibold tracking-[.28em] uppercase mb-1" style={{fontFamily:"'Cinzel',serif"}}>Reserve Your Room</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-light" style={{fontFamily:"'Playfair Display',Georgia,serif"}}>{formatINR(nightlyRate)}</span>
                  <span className="text-gray-400 text-xs">/ night</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Check-In</label>
                    <input type="date" value={localIn} min={todayStr}
                      onChange={e=>setLocalIn(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Check-Out</label>
                    <input type="date" value={localOut} min={localIn||todayStr}
                      onChange={e=>setLocalOut(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"/>
                  </div>
                </div>

                {nights>0&&(
                  <div className="text-center text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl py-2.5">
                    {nights} night{nights>1?'s':''} selected
                  </div>
                )}

                {nights>0&&(
                  <div className="space-y-1.5 text-sm border border-amber-100 rounded-xl p-3 bg-amber-50/50">
                    <div className="flex justify-between text-gray-600"><span>Base ({nights}n)</span><span>{formatINR(base)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>GST (12%)</span><span>{formatINR(tax)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Service (5%)</span><span>{formatINR(svc)}</span></div>
                    <div className="rdp-rule my-2"/>
                    <div className="flex justify-between font-bold text-gray-800 text-base"><span>Total</span><span>{formatINR(total)}</span></div>
                  </div>
                )}

                <button
                  onClick={()=>onBook(room, localIn, localOut)}
                  disabled={nights<1}
                  className="rdp-book-btn w-full bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold py-4 rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed border-none">
                  {nights<1?'Select Dates to Book':`Book Now — ${formatINR(total)}`}
                </button>

                <div className="rdp-rule mt-2"/>
                <div className="pt-1 space-y-1.5">
                  {['✦ Free cancellation 48h before check-in','✦ Includes GST & service charges','✦ Instant booking confirmation'].map(t=>(
                    <p key={t} className="text-xs text-gray-400">{t}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {galleryOpen&&<GalleryModal imageSet={imageSet} initialCategory={galCat} initialIndex={galIdx} onClose={()=>setGallery(false)}/>}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function HotelSearchPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [step,         setStep]         = useState('cities');
  const [selectedCity, setSelectedCity] = useState(null);
  const [hotels,       setHotels]       = useState([]);
  const [loadingHotels,setLoadingHotels]= useState(false);
  const [selectedHotel,setSelectedHotel]= useState(null);
  const [hotelImgIdx,  setHotelImgIdx]  = useState({});
  const [rooms,        setRooms]        = useState([]);
  const [hotelMeta,    setHotelMeta]    = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isFallback,   setIsFallback]   = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn,  setCheckIn]  = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [adults,   setAdults]   = useState(1);
  const [heroIdx,  setHeroIdx]  = useState(0);
  // bookingRoom holds room + dates when going into booking wizard
  const [bookingRoom,    setBookingRoom]    = useState(null);
  const [bookingCheckIn, setBookingCheckIn] = useState(todayStr);
  const [bookingCheckOut,setBookingCheckOut]= useState(tomorrowStr);

  // Hero carousel
  useEffect(()=>{ const t=setInterval(()=>setHeroIdx(i=>(i+1)%TN_CITIES.length),4000); return()=>clearInterval(t); },[]);

  /* ── Fetch hotels ── */
  const fetchHotels = useCallback(async (cityCode) => {
    setLoadingHotels(true); setHotels([]);
    try { const {data}=await hotelAPI.getHotels(cityCode); setHotels(data.data.hotels||[]); }
    catch(err){ toast.error(err.response?.data?.message||'Failed to load hotels.'); }
    finally { setLoadingHotels(false); }
  },[]);

  /* ── Fetch rooms ── */
  const fetchRooms = useCallback(async (hotelId) => {
    setLoadingRooms(true); setRooms([]);
    try {
      const {data}=await hotelAPI.getHotelRooms(hotelId,{checkIn,checkOut,adults});
      setHotelMeta(data.data.hotel);
      setRooms(data.data.rooms||[]);
      setIsFallback(!!data.data.isFallbackData);
    } catch(err){ toast.error(err.response?.data?.message||'Failed to load rooms.'); }
    finally { setLoadingRooms(false); }
  },[checkIn,checkOut,adults]);

  const handleCitySelect = (city) => { setSelectedCity(city); setStep('hotels'); fetchHotels(city.code); window.scrollTo({top:0,behavior:'smooth'}); };
  const handleHotelSelect = (hotel) => { setSelectedHotel(hotel); setStep('rooms'); fetchRooms(hotel.hotelId); window.scrollTo({top:0,behavior:'smooth'}); };
  const handleRoomSelect  = (room)  => { setSelectedRoom(room); setStep('roomDetail'); window.scrollTo({top:0,behavior:'smooth'}); };
  const handleBookRoom = (room, ci, co) => {
    if(!user){ toast.error('Please login to book'); navigate('/login'); return; }
    setBookingRoom(room); setBookingCheckIn(ci); setBookingCheckOut(co); setStep('booking'); window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleBack = () => {
    if(step==='booking')    { setStep('roomDetail'); return; }
    if(step==='roomDetail') { setSelectedRoom(null); setStep('rooms'); return; }
    if(step==='rooms')      { setSelectedHotel(null); setRooms([]); setIsFallback(false); setStep('hotels'); return; }
    if(step==='hotels')     { setSelectedCity(null); setHotels([]); setStep('cities'); return; }
  };

  const nights = nightsBetween(checkIn, checkOut);

  const heroTitle = step==='cities' ? <>'Hotels in <span style={{color:'#C9A96E'}}>Tamil Nadu</span>'</> :
    step==='hotels'     ? <>{selectedCity?.name} <span style={{color:'#C9A96E'}}>Hotels</span></> :
    step==='rooms'      ? <span style={{color:'#C9A96E'}}>{selectedHotel?.name}</span> :
    step==='roomDetail' ? <span style={{color:'#C9A96E'}}>{selectedRoom?.roomName||'Room Details'}</span> :
                          <>Confirm <span style={{color:'#C9A96E'}}>Booking</span></>;

  /* ════════ RENDER ════════ */
  return (
    <div className="min-h-screen" style={{background:'#080c14',fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        :root{--gold:#C9A96E;--gold-light:#e8c98a;--gold-dim:rgba(201,169,110,.15);--surface:#0f1520;--surface2:#141c2e;--border:rgba(255,255,255,.06)}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .page-enter{animation:fadeSlideUp .55s cubic-bezier(.16,1,.3,1) both}
        .scale-in{animation:scaleIn .4s cubic-bezier(.16,1,.3,1) both}
        .slide-in{animation:fadeSlideUp .4s ease both}
        .gold-text{background:linear-gradient(90deg,#C9A96E,#e8c98a,#C9A96E);background-size:200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite}
        .skeleton{background:linear-gradient(90deg,#1a2333 25%,#243044 50%,#1a2333 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
        .search-input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:white;border-radius:12px;padding:10px 14px;font-size:13px;outline:none;transition:border-color .2s,box-shadow .2s;width:100%}
        .search-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,169,110,.12)}
        .search-input option{background:#1e293b}
        .back-btn{display:inline-flex;align-items:center;gap:8px;color:var(--gold);font-size:13px;font-weight:500;padding:8px 16px;border-radius:100px;background:var(--gold-dim);border:1px solid rgba(201,169,110,.2);cursor:pointer;transition:all .2s ease}
        .back-btn:hover{background:rgba(201,169,110,.25);transform:translateX(-3px)}
        .city-card{position:relative;overflow:hidden;cursor:pointer;border-radius:20px;transition:transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease}
        .city-card:hover{transform:translateY(-8px) scale(1.02)}
        .city-card:hover .city-img{transform:scale(1.08)}
        .city-card:hover .city-cta{opacity:1;transform:translateY(0)}
        .city-img{transition:transform .6s ease;width:100%;height:100%;object-fit:cover}
        .city-cta{opacity:0;transform:translateY(10px);transition:opacity .3s ease,transform .3s ease}
        .hotel-card{cursor:pointer;border-radius:18px;overflow:hidden;transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease;background:var(--surface);border:1px solid var(--border)}
        .hotel-card:hover{transform:translateY(-6px);box-shadow:0 20px 50px rgba(0,0,0,.5),0 0 0 1px rgba(201,169,110,.2)}
        .hotel-card:hover .hotel-img{transform:scale(1.06)}
        .hotel-card:hover .hotel-reveal{opacity:1}
        .hotel-img{transition:transform .5s ease;width:100%;height:100%;object-fit:cover}
        .hotel-reveal{opacity:0;transition:opacity .3s ease}
        .room-card{border-radius:18px;overflow:hidden;background:var(--surface);border:1px solid var(--border);cursor:pointer;transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease}
        .room-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.4);border-color:rgba(201,169,110,.25)}
        .room-card:hover .room-img{transform:scale(1.04)}
        .room-img{transition:transform .5s ease;width:100%;height:100%;object-fit:cover}
        .price-tag{font-family:'Cormorant Garamond',Georgia,serif}
        .step-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.15);transition:all .3s ease}
        .step-dot.active{background:var(--gold);width:24px;border-radius:4px}
        .loader-ring{width:48px;height:48px;border-radius:50%;border:3px solid rgba(201,169,110,.2);border-top-color:var(--gold);animation:spin-slow .9s linear infinite}
        .amenity-pill{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:100px;padding:3px 10px;font-size:11px;color:#94a3b8}
        .float-anim{animation:float 3s ease-in-out infinite}
      `}</style>

      {/* ═══ HERO HEADER ═══ */}
      <div className="relative overflow-hidden" style={{height:step==='cities'?'520px':'200px',transition:'height .6s ease'}}>
        {TN_CITIES.map((c,i)=>(
          <div key={c.code} className="absolute inset-0 transition-opacity duration-1000" style={{opacity:heroIdx===i?1:0}}>
            <img src={c.image} alt={c.name} className="w-full h-full object-cover" style={{filter:'brightness(.35)'}}/>
          </div>
        ))}
        <div className="absolute inset-0" style={{background:'linear-gradient(to bottom,rgba(8,12,20,.3) 0%,rgba(8,12,20,.7) 70%,#080c14 100%)'}}/>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-xs font-semibold tracking-[.3em] uppercase mb-3" style={{color:'rgba(201,169,110,.8)'}}>✦ Real-Time via Amadeus API ✦</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:step==='cities'?'clamp(2.5rem,6vw,4.5rem)':'clamp(1.8rem,4vw,2.8rem)',fontWeight:600,color:'#fff',lineHeight:1.1,transition:'font-size .4s ease'}}>
            {step==='cities'?<>Hotels in <span className="gold-text">Tamil Nadu</span></>:
             step==='hotels'?<>{selectedCity?.name} <span className="gold-text">Hotels</span></>:
             step==='rooms' ?<span className="gold-text">{selectedHotel?.name}</span>:
             step==='roomDetail'?<span className="gold-text">{selectedRoom?.roomName||'Room Details'}</span>:
             <>Confirm <span className="gold-text">Booking</span></>}
          </h1>
          {step==='cities'&&<p className="mt-3 text-gray-300 text-sm max-w-lg" style={{fontWeight:300}}>Discover world-class hotels across Chennai, Coimbatore, Madurai, Trichy & Salem</p>}
          <div className="flex items-center gap-2 mt-5">
            {['cities','hotels','rooms','roomDetail','booking'].map(s=>(
              <div key={s} className={`step-dot ${step===s?'active':''}`}/>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      {/* For roomDetail and booking we use their own full-width layouts */}
      {step==='roomDetail'&&selectedRoom&&(
        <div className="page-enter">
          <div className="max-w-7xl mx-auto px-4 pt-6">
            <button onClick={handleBack} className="back-btn mb-4 slide-in">← Back to Rooms</button>
          </div>
          <RoomDetailView
            room={selectedRoom}
            selectedHotel={selectedHotel}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            onBack={handleBack}
            onBook={handleBookRoom}
          />
        </div>
      )}

      {step==='booking'&&bookingRoom&&(
        <div className="page-enter" style={{background:'#f9fafb',minHeight:'100vh'}}>
          <div className="max-w-4xl mx-auto px-4 py-10">
            <button onClick={handleBack} className="mb-6 flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium transition">← Back to Room</button>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Complete Your Booking</h1>
            <BookingWizard
              room={bookingRoom}
              selectedHotel={selectedHotel}
              checkIn={bookingCheckIn}
              checkOut={bookingCheckOut}
              adults={adults}
              onBack={handleBack}
              onDone={()=>navigate('/bookings')}
            />
          </div>
        </div>
      )}

      {/* Cities / Hotels / Rooms use the dark layout */}
      {(step==='cities'||step==='hotels'||step==='rooms')&&(
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Back button */}
          {step!=='cities'&&(
            <button onClick={handleBack} className="back-btn mb-6 slide-in">
              ← {step==='rooms'?'Back to Hotels':'Back to Cities'}
            </button>
          )}

          {/* ── STEP 1: Cities ── */}
          {step==='cities'&&(
            <div className="page-enter">
              <h2 className="text-center mb-8" style={{color:'rgba(255,255,255,.5)',fontSize:13,letterSpacing:'.2em',textTransform:'uppercase'}}>Choose Your Destination</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {TN_CITIES.map((city,i)=>(
                  <div key={city.code} onClick={()=>handleCitySelect(city)} className="city-card"
                    style={{height:260,animationDelay:`${i*.07}s`,boxShadow:'0 4px 24px rgba(0,0,0,.4)'}}>
                    <img src={city.image} alt={city.name} className="city-img absolute inset-0"/>
                    <div className="absolute inset-0" style={{background:'linear-gradient(to bottom,rgba(0,0,0,.1) 0%,rgba(0,0,0,.75) 100%)'}}/>
                    <div className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{background:city.color+'33',color:city.color,border:`1px solid ${city.color}55`,backdropFilter:'blur(8px)'}}>
                      {city.hotels}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold text-lg leading-none mb-0.5" style={{fontFamily:"'Cormorant Garamond',serif"}}>{city.name}</h3>
                      <p className="text-gray-300 text-xs mb-1">{city.tagline}</p>
                      {city.landmark && (
                        <p className="text-xs mb-2.5" style={{color:'rgba(251,191,36,.8)'}}>
                          📍 {city.landmark}
                        </p>
                      )}
                      <div className="city-cta inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{background:'rgba(201,169,110,.2)',color:'#C9A96E',border:'1px solid rgba(201,169,110,.4)'}}>
                        Explore Hotels →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Hotels ── */}
          {step==='hotels'&&(
            <div className="page-enter">
              {/* Date/guest controls */}
              <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-2xl items-end"
                style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)'}}>
                <div className="flex-1 min-w-[140px]">
                  <label style={{color:'rgba(255,255,255,.4)',fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',display:'block',marginBottom:6}}>Check-in</label>
                  <input type="date" value={checkIn} min={todayStr} onChange={e=>setCheckIn(e.target.value)} className="search-input"/>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label style={{color:'rgba(255,255,255,.4)',fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',display:'block',marginBottom:6}}>Check-out</label>
                  <input type="date" value={checkOut} min={checkIn} onChange={e=>setCheckOut(e.target.value)} className="search-input"/>
                </div>
                <div className="min-w-[110px]">
                  <label style={{color:'rgba(255,255,255,.4)',fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',display:'block',marginBottom:6}}>Guests</label>
                  <select value={adults} onChange={e=>setAdults(Number(e.target.value))} className="search-input">
                    {[1,2,3,4].map(n=><option key={n} value={n}>{n} Adult{n>1?'s':''}</option>)}
                  </select>
                </div>
                <div style={{color:'rgba(255,255,255,.3)',fontSize:12,paddingBottom:10}}>{nights} night{nights>1?'s':''}</div>
              </div>

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-white text-xl font-semibold" style={{fontFamily:"'Cormorant Garamond',serif"}}>{selectedCity?.name}</h2>
                  {!loadingHotels&&<p style={{color:'var(--gold)',fontSize:12,marginTop:2}}>{hotels.length} properties found</p>}
                </div>
                <div className="text-xs px-3 py-1.5 rounded-full" style={{background:'rgba(201,169,110,.1)',color:'var(--gold)',border:'1px solid rgba(201,169,110,.2)'}}>📡 Live Amadeus Data</div>
              </div>

              {loadingHotels&&(
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_,i)=>(
                    <div key={i} className="rounded-2xl overflow-hidden" style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
                      <div className="skeleton" style={{height:180}}/>
                      <div className="p-4 space-y-3"><div className="skeleton" style={{height:16,width:'75%'}}/><div className="skeleton" style={{height:12,width:'50%'}}/></div>
                    </div>
                  ))}
                </div>
              )}
              {!loadingHotels&&hotels.length===0&&(
                <div className="text-center py-20"><div className="float-anim text-6xl mb-4">🏨</div><p className="text-gray-400">No hotels found. Try a different city.</p></div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {hotels.map((hotel,i)=>{
                  const img=HOTEL_IMAGES[i%HOTEL_IMAGES.length];
                  return (
                    <div key={hotel.hotelId} onClick={()=>handleHotelSelect(hotel)} className="hotel-card scale-in" style={{animationDelay:`${i*.06}s`}}>
                      <div style={{height:190,overflow:'hidden',position:'relative'}}>
                        <img src={img} alt={hotel.name} className="hotel-img" onError={e=>{e.target.src=HOTEL_IMAGES[0];}}/>
                        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,15,26,.9) 0%,transparent 60%)'}}/>
                        {hotel.rating&&<div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full" style={{background:'rgba(0,0,0,.6)',color:'#f59e0b',backdropFilter:'blur(8px)'}}>⭐ {hotel.rating}</div>}
                        {hotel.distance&&<div className="absolute bottom-3 left-3 text-xs px-2.5 py-1 rounded-full" style={{background:'rgba(0,0,0,.6)',color:'rgba(255,255,255,.7)',backdropFilter:'blur(8px)'}}>📍 {hotel.distance.toFixed(1)} {hotel.distanceUnit} centre</div>}
                        <div className="hotel-reveal absolute inset-0 flex items-center justify-center" style={{background:'rgba(201,169,110,.08)',backdropFilter:'blur(2px)'}}>
                          <span className="text-sm font-semibold px-4 py-2 rounded-full" style={{background:'linear-gradient(135deg,#C9A96E,#a07840)',color:'#000'}}>View Rooms</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-2">{hotel.name}</h3>
                        <p style={{color:'rgba(255,255,255,.35)',fontSize:11,marginBottom:10}}>{hotel.cityName}, India</p>
                        {hotel.amenities?.length>0&&(
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {hotel.amenities.slice(0,4).map(a=><span key={a} className="amenity-pill">{getIcon(a)} {a.replace(/_/g,' ').toLowerCase()}</span>)}
                            {hotel.amenities.length>4&&<span className="amenity-pill">+{hotel.amenities.length-4}</span>}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2" style={{borderTop:'1px solid rgba(255,255,255,.05)'}}>
                          <span style={{color:'var(--gold)',fontSize:12,fontWeight:500}}>Check Availability</span>
                          <span style={{color:'rgba(255,255,255,.2)',fontSize:16}}>→</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: Room List ── */}
          {step==='rooms'&&(
            <div className="page-enter">
              {/* Hotel banner */}
              <div className="rounded-2xl overflow-hidden mb-6 relative" style={{height:160,border:'1px solid rgba(201,169,110,.15)'}}>
                <img src={HOTEL_IMAGES[hotels.findIndex(h=>h.hotelId===selectedHotel?.hotelId)%HOTEL_IMAGES.length]||HOTEL_IMAGES[0]}
                  alt={selectedHotel?.name} className="w-full h-full object-cover" style={{filter:'brightness(.4)'}}/>
                <div className="absolute inset-0 flex flex-col justify-end p-5" style={{background:'linear-gradient(to top,rgba(8,12,20,.95) 0%,transparent 60%)'}}>
                  <p style={{color:'var(--gold)',fontSize:11,letterSpacing:'.15em',textTransform:'uppercase',marginBottom:4}}>
                    {checkIn&&`${dispDate(checkIn)} → ${dispDate(checkOut)} · ${nights} night${nights>1?'s':''} · ${adults} guest${adults>1?'s':''}`}
                  </p>
                  <h2 className="text-white text-2xl font-semibold" style={{fontFamily:"'Cormorant Garamond',serif"}}>{selectedHotel?.name}</h2>
                  {hotelMeta?.phone&&<p style={{color:'rgba(255,255,255,.4)',fontSize:12,marginTop:2}}>📞 {hotelMeta.phone}</p>}
                </div>
              </div>

              {isFallback&&rooms.length>0&&(
                <div className="flex items-start gap-3 mb-5 p-4 rounded-xl scale-in" style={{background:'rgba(251,191,36,.06)',border:'1px solid rgba(251,191,36,.2)'}}>
                  <span style={{fontSize:20,flexShrink:0}}>ℹ️</span>
                  <div>
                    <p style={{color:'#fbbf24',fontSize:13,fontWeight:600,marginBottom:2}}>Showing Demo Room Prices</p>
                    <p style={{color:'rgba(251,191,36,.6)',fontSize:12,lineHeight:1.5}}>This property has limited availability in Amadeus test environment. Showing curated sample rooms.</p>
                  </div>
                </div>
              )}

              {loadingRooms&&<div className="text-center py-20"><div className="loader-ring mx-auto mb-5"/><p style={{color:'rgba(255,255,255,.4)',fontSize:14}}>Searching live room availability…</p></div>}
              {!loadingRooms&&rooms.length===0&&<div className="text-center py-16"><div className="float-anim text-6xl mb-4">😔</div><p className="text-gray-400">No rooms for these dates. Try different dates.</p></div>}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {rooms.map((room,i)=>{
                  const imgSet=getRoomImageSet(room);
                  const heroImg=imgSet.room[0];
                  const bathImg=imgSet.toilet?.[0];
                  return (
                    <div key={room.offerId||i} className="room-card scale-in" style={{animationDelay:`${i*.07}s`}}
                      onClick={()=>handleRoomSelect(room)}>
                      {/* Room image with bathroom thumbnail overlay */}
                      <div style={{height:200,overflow:'hidden',position:'relative'}}>
                        <img src={heroImg} alt={room.roomName} className="room-img"
                          onError={e=>{e.target.src=HOTEL_IMAGES[0];}}/>
                        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,15,26,.85) 0%,transparent 50%)'}}/>
                        {/* Bathroom mini preview */}
                        {bathImg&&(
                          <div className="absolute top-3 right-3 w-14 h-10 rounded-lg overflow-hidden border-2" style={{borderColor:'rgba(201,169,110,.5)'}}>
                            <img src={bathImg} alt="Bathroom" className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30"><span className="text-xs">🚿</span></div>
                          </div>
                        )}
                        {/* Bed info */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                          style={{background:'rgba(0,0,0,.7)',color:'rgba(255,255,255,.8)',backdropFilter:'blur(8px)'}}>
                          🛏 {room.beds||1} {room.bedType?.toLowerCase()||''} bed{(room.beds||1)>1?'s':''}
                        </div>
                        {room.overrideApplied&&<div className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-semibold" style={{background:'#16a34a',color:'#fff'}}>🏷️ Special Rate</div>}
                        {room.isFallback&&<div className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full" style={{background:'rgba(251,191,36,.2)',color:'#fbbf24',border:'1px solid rgba(251,191,36,.3)'}}>Demo</div>}
                        {/* "Click for details" hint */}
                        <div className="hotel-reveal absolute bottom-0 left-0 right-0 flex items-center justify-center pb-10"
                          style={{background:'linear-gradient(to top,rgba(201,169,110,.15),transparent)'}}>
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{background:'rgba(201,169,110,.2)',color:'#C9A96E',border:'1px solid rgba(201,169,110,.4)'}}>View Details & Photos →</span>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 mr-3">
                            <h3 className="text-white font-semibold text-sm leading-tight">{room.roomName}</h3>
                            <p style={{color:'rgba(255,255,255,.35)',fontSize:11,marginTop:2}}>{room.adults||1} guest{(room.adults||1)>1?'s':''} max</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {room.overrideApplied&&<p style={{color:'rgba(255,255,255,.45)',fontSize:11,textDecoration:'line-through'}}>₹{room.originalPrice?.toLocaleString('en-IN')}</p>}
                            <p className="price-tag" style={{color:'#FFD700',fontSize:22,fontWeight:700,lineHeight:1,textShadow:'0 1px 10px rgba(255,215,0,.5)'}}>₹{(room.displayPrice||room.totalPrice)?.toLocaleString('en-IN')}</p>
                            <p style={{color:'rgba(255,215,0,.6)',fontSize:10,marginTop:1,fontWeight:500}}>per night</p>
                          </div>
                        </div>

                        {room.overrideNote&&<p style={{color:'#4ade80',fontSize:11,marginBottom:8}}>✓ {room.overrideNote}</p>}

                        {room.description&&(
                          <p style={{color:'rgba(255,255,255,.4)',fontSize:12,lineHeight:1.5,marginBottom:10}} className="line-clamp-2">{room.description}</p>
                        )}

                        {/* Amenity previews */}
                        {Array.isArray(room.amenities)&&room.amenities.length>0&&(
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {room.amenities.slice(0,4).map(a=><span key={a} className="amenity-pill">{getIcon(a)}</span>)}
                          </div>
                        )}

                        {/* Total for stay */}
                        <div className="flex items-center justify-between p-3 rounded-xl mb-3"
                          style={{background:'rgba(201,169,110,.06)',border:'1px solid rgba(201,169,110,.12)'}}>
                          <span style={{color:'rgba(255,255,255,.4)',fontSize:12}}>{nights} night{nights>1?'s':''} total</span>
                          <span className="price-tag" style={{color:'#FFD700',fontSize:16,fontWeight:600}}>
                            ₹{((room.displayPrice||room.totalPrice)*nights)?.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          onClick={e=>{e.stopPropagation();handleRoomSelect(room);}}
                          className="w-full py-3 text-sm font-bold rounded-xl border-none cursor-pointer"
                          style={{background:'linear-gradient(135deg,#C9A96E,#a07840)',color:'#000'}}>
                          View Details & Book →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
