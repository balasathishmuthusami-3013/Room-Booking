import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { membershipAPI } from '../../services/api';

const LOYALTY_PROGRAMS = [
  { id:'silver', name:'Silver Circle', icon:'🥈', color:'from-gray-400 to-gray-500', minStays:0, benefits:['5% off dining','Welcome drink','Late checkout 1PM'] },
  { id:'gold', name:'Gold Prestige', icon:'🥇', color:'from-amber-400 to-yellow-500', minStays:5, benefits:['10% off all services','Free airport transfer','Room upgrade','Access to exclusive events'] },
  { id:'platinum', name:'Platinum Elite', icon:'💎', color:'from-purple-500 to-indigo-600', minStays:15, benefits:['20% off everything','Personal butler','Guaranteed suite upgrade','Private dining','Unlimited spa access'] },
];

const TODAY_EVENTS = [
  { time:'7:00 PM – 10:00 PM', title:'🎧 DJ Night at Sky Lounge', badge:'TONIGHT', badgeColor:'bg-purple-500',
    image:'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500',
    desc:'International DJ ARYAN spins house & deep tech on the rooftop. Complimentary cocktail for Gold+ members.' },
  { time:'6:00 PM – 8:00 PM', title:'🥂 Members Sunset Get-Together', badge:'MEMBERS ONLY', badgeColor:'bg-amber-500',
    image:'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=500',
    desc:'Exclusive poolside gathering with canapés and live acoustic set overlooking the city.' },
  { time:'9:00 AM – 11:00 AM', title:'🧘 Sunrise Yoga Retreat', badge:'FREE FOR GOLD+', badgeColor:'bg-green-500',
    image:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
    desc:'Guided vinyasa yoga on the rooftop deck. All levels welcome. Mats provided.' },
  { time:'3:00 PM – 5:00 PM', title:'🍳 Celebrity Chef Masterclass', badge:'LIMITED SLOTS', badgeColor:'bg-red-500',
    image:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
    desc:'Chef Marco teaches his famous truffle risotto. Limited to 12 members. Includes tasting and signed cookbook.' },
  { time:'8:00 PM – 12:00 AM', title:'🎭 Live Jazz & Gala Dinner', badge:'GALA', badgeColor:'bg-rose-600',
    image:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
    desc:'5-course dinner with the Amigo Jazz Quartet in the Grand Ballroom. Formal attire required.' },
];

const AMENITIES = [
  { key:'spa', icon:'🌿', name:'Amigo Spa', desc:'5,000 sqm sanctuary with 22 treatment rooms',
    heroImage:'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900',
    gallery:['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600','https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600','https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'],
    highlights:['22 Private Treatment Rooms','25m Indoor Heated Pool','Hammam & Steam Room','Aromatherapy Lounge','Couples Retreat Suites','Ayurvedic Treatments'],
    hours:'6:00 AM – 11:00 PM', tagline:'A sanctuary of total wellbeing',
    details:[{label:'Signature',value:'Amigo Gold Body Wrap (90 min)'},{label:'Hydrotherapy',value:'Jacuzzi, Cold Plunge, Steam'},{label:'Fitness',value:'Open 24 hours'},{label:'Booking',value:'In-app or at reception'}],
    link:'/spa' },
  { key:'dining', icon:'🍽️', name:'Fine Dining', desc:'7 award-winning Michelin-starred restaurants',
    heroImage:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900',
    gallery:['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600','https://images.unsplash.com/photo-1544025162-d76694265947?w=600'],
    highlights:['7 Restaurants & Bars','3 Michelin Stars Combined','Live Cooking Stations','Private Dining Rooms','Wine Cellar (2,000+ labels)','Celebrity Chef Residencies'],
    hours:'6:00 AM – 2:00 AM', tagline:'Culinary art elevated to perfection',
    details:[{label:'Signature',value:'SAFFRON — Modern Indian Fusion'},{label:'Rooftop',value:'SKY LOUNGE — 5PM–2AM'},{label:'Breakfast',value:'The Grand Table — 6–11AM'},{label:'Room Service',value:'24/7 available'}],
    menu:[
      {category:'🥗 Starters', items:['Seared Scallops with Truffle Foam','Wagyu Beef Tartare','Lobster Bisque','Burrata with Heirloom Tomatoes']},
      {category:'🥩 Mains', items:['A5 Wagyu Tenderloin','Pan-Seared Chilean Sea Bass','Lamb Rack Provençal','Lobster Thermidor']},
      {category:'🍰 Desserts', items:['Valrhona Chocolate Sphere','24K Gold Crème Brûlée','Mango Tart Tatin','Cheese Selection']},
    ], link:'/dining' },
  { key:'pools', icon:'🏊', name:'Infinity Pools', desc:'3 temperature-controlled infinity pools',
    heroImage:'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900',
    gallery:['https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600'],
    highlights:['Rooftop Infinity Pool (32°C)','Adults-Only Lap Pool','Family Fun Pool with Slides','Poolside Cabanas','Swim-Up Bar','Towel & Sunscreen Service'],
    hours:'6:00 AM – 10:00 PM', tagline:'Swim above the clouds',
    details:[{label:'Rooftop Pool',value:'Floor 20 — City skyline views'},{label:'Temperature',value:'Heated to 30–32°C year-round'},{label:'Cabana Booking',value:'Reserve via concierge'},{label:'Pool Bar',value:'Open 9AM–9PM'}] },
  { key:'business', icon:'💼', name:'Business Hub', desc:'Facilities for up to 1,200 guests',
    heroImage:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900',
    gallery:['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600','https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600','https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=600'],
    highlights:['Grand Ballroom (1,200 pax)','12 Breakout Rooms','4K Presentation Systems','Simultaneous Translation','Event Catering Team','Dedicated Event Planner'],
    hours:'7:00 AM – 11:00 PM', tagline:'Where world-class deals are made',
    details:[{label:'Grand Ballroom',value:'Up to 1,200 guests, 1,800 sqm'},{label:'Business Center',value:'Print, scan, secretarial'},{label:'WiFi',value:'10 Gbps dedicated fiber'},{label:'AV Support',value:'24/7 technical team'}] },
];

// ── Amenity Modal ─────────────────────────────────────
function AmenityModal({ amenity, onClose }) {
  const [activeImg, setActiveImg] = useState(0);
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative h-52 overflow-hidden rounded-t-3xl">
          <img src={amenity.gallery[activeImg]} alt={amenity.name} className="w-full h-full object-cover" onError={e => { e.target.src='https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600'; }}/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white text-lg hover:bg-white/40 transition">✕</button>
          <div className="absolute bottom-4 left-5 text-white">
            <p className="text-xs text-amber-300 mb-1">{amenity.tagline}</p>
            <h2 className="text-2xl font-bold">{amenity.icon} {amenity.name}</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          {amenity.gallery.map((img,i) => (
            <div key={i} onClick={() => setActiveImg(i)} className={`h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition ${activeImg===i?'border-amber-400':'border-transparent'}`}>
              <img src={img} alt="" className="w-full h-full object-cover" onError={e => { e.target.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'; }}/>
            </div>
          ))}
        </div>
        <div className="px-5 pb-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {amenity.highlights.map(h => (
              <div key={h} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-sm text-gray-700"><span className="text-amber-500">✓</span>{h}</div>
            ))}
          </div>
          <div className="space-y-2">
            {amenity.details.map(d => (
              <div key={d.label} className="flex justify-between text-sm border-b pb-1.5 last:border-0">
                <span className="text-gray-500">{d.label}</span><span className="font-semibold text-gray-800">{d.value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm"><span className="text-gray-500">Hours</span><span className="font-semibold text-gray-800">{amenity.hours}</span></div>
          </div>
          {amenity.menu && (
            <div className="space-y-2">
              {amenity.menu.map(s => (
                <div key={s.category} className="bg-gray-50 rounded-xl p-3">
                  <p className="font-bold text-gray-700 text-sm mb-1">{s.category}</p>
                  <ul className="space-y-0.5">{s.items.map(i => <li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-amber-400">·</span>{i}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">Close</button>
            {amenity.link && (
              <Link to={amenity.link} onClick={onClose} className="flex-1 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 rounded-xl transition text-sm text-center">Explore Full Page →</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loyalty Modal ─────────────────────────────────────
function LoyaltyModal({ onClose }) {
  const [step, setStep] = useState('choose');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', phone:'', dob:'', address:'', joinedAt: new Date().toLocaleString('en-IN') });
  const [submitting, setSubmitting] = useState(false);

  const handleJoin = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setStep('success'); }, 1500);
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', month:'long', day:'numeric' });

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={step === 'success' ? undefined : onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 rounded-t-3xl p-7 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition text-lg">✕</button>
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-1">✨ Amigo Loyalty</p>
          <h2 className="text-2xl font-bold mb-0.5">
            {step==='choose' ? "Today's Events & Programs" : step==='form' ? `Join ${selectedProgram?.name}` : '🎉 Welcome to Amigo Loyalty!'}
          </h2>
          <p className="text-amber-200 text-sm">{today}</p>
        </div>

        <div className="p-5">
          {step === 'choose' && (
            <>
              <h3 className="font-bold text-gray-800 mb-3">🎭 Today's Special Events</h3>
              <div className="space-y-3 mb-6">
                {TODAY_EVENTS.map((event, i) => (
                  <div key={i} className="flex gap-0 border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition group">
                    <div className="w-24 flex-shrink-0 bg-gray-200">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{minHeight:'90px'}}
                        onError={e => { e.target.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'; }}/>
                    </div>
                    <div className="p-3 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-gray-800 text-sm leading-tight">{event.title}</h4>
                        <span className={`${event.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0`}>{event.badge}</span>
                      </div>
                      <p className="text-amber-600 text-xs font-semibold mb-1">🕐 {event.time}</p>
                      <p className="text-gray-500 text-xs">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="font-bold text-gray-800 mb-3">🏆 Choose Your Loyalty Program</h3>
              <div className="space-y-3">
                {LOYALTY_PROGRAMS.map(p => (
                  <div key={p.id} className={`rounded-2xl p-4 bg-gradient-to-r ${p.color} text-white cursor-pointer hover:scale-[1.02] transition-transform`}
                    onClick={() => { setSelectedProgram(p); setForm(f => ({...f, joinedAt: new Date().toLocaleString('en-IN')})); setStep('form'); }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{p.icon}</span>
                        <div>
                          <h4 className="font-bold text-lg">{p.name}</h4>
                          <p className="text-white/70 text-xs">{p.minStays===0?'Open to all guests':`${p.minStays}+ completed stays`}</p>
                        </div>
                      </div>
                      <span className="text-white/80 text-xl">›</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.benefits.map(b => <span key={b} className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{b}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 'form' && selectedProgram && (
            <>
              <div className={`rounded-2xl p-4 bg-gradient-to-r ${selectedProgram.color} text-white mb-5`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedProgram.icon}</span>
                  <div><h3 className="font-bold text-lg">{selectedProgram.name}</h3><p className="text-white/70 text-xs">Fill in your details to join</p></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Full Name *</label>
                    <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Your full name"
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="email@example.com"
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Mobile *</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+91 98765 43210"
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Date of Birth</label>
                    <input type="date" value={form.dob} onChange={e => setForm({...form, dob:e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                  <input value={form.address} onChange={e => setForm({...form, address:e.target.value})} placeholder="Your home address"
                    className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <label className="text-xs font-semibold text-amber-700 uppercase">🕐 Registration Time (Auto-generated)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input value={form.joinedAt} readOnly className="flex-1 border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 cursor-not-allowed font-mono"/>
                    <span className="text-xs text-amber-600 font-bold">Auto ✓</span>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">Your membership starts immediately upon joining.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('choose')} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">← Back</button>
                <button onClick={handleJoin} disabled={!form.name || !form.email || !form.phone || submitting}
                  className="flex-[2] bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 rounded-xl transition disabled:opacity-50 text-sm">
                  {submitting ? 'Joining...' : `Join ${selectedProgram.name} →`}
                </button>
              </div>
            </>
          )}

          {step === 'success' && selectedProgram && (
            <div className="py-6 text-center">
              <div className="text-7xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome to {selectedProgram.name}!</h3>
              <p className="text-gray-500 mb-5">You're now part of the Amigo family. Enjoy exclusive benefits starting today!</p>
              <div className={`bg-gradient-to-r ${selectedProgram.color} text-white rounded-2xl p-5 mb-4 text-left`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{selectedProgram.icon}</span>
                  <div><p className="font-bold text-lg">{form.name}</p><p className="text-white/70 text-sm">{selectedProgram.name} Member</p></div>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-sm">
                  <p className="text-white/70 text-xs mb-0.5">Member Since</p>
                  <p className="font-mono font-semibold">{form.joinedAt}</p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-left space-y-1.5">
                <p className="font-bold text-green-700 text-sm mb-2">✅ Your Benefits Are Active:</p>
                {selectedProgram.benefits.map(b => (
                  <div key={b} className="flex items-center gap-2 text-sm text-green-700"><span className="text-green-500">★</span>{b}</div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mb-4">🎊 A welcome email has been sent to <span className="font-semibold">{form.email}</span></p>
              <button onClick={onClose} className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition">Start Exploring →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Animated section hook ─────────────────────────────── */
function useScrollAnimation() {
  const [visible, setVisible] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── Payment Methods Section ───────────────────────────── */
function PaymentAcceptanceSection() {
  const [ref, visible] = useScrollAnimation();
  const internationalMethods = [
    { icon: '🌍', name: 'Visa', color: 'from-blue-600 to-blue-800', bg: 'bg-blue-50' },
    { icon: '🔵', name: 'Mastercard', color: 'from-red-500 to-orange-500', bg: 'bg-red-50' },
    { icon: '🟦', name: 'Amex', color: 'from-blue-500 to-cyan-600', bg: 'bg-cyan-50' },
    { icon: '🌐', name: 'JCB', color: 'from-green-500 to-emerald-600', bg: 'bg-green-50' },
    { icon: '💎', name: 'Discover', color: 'from-orange-500 to-amber-600', bg: 'bg-orange-50' },
    { icon: '🏦', name: 'Wire Transfer', color: 'from-gray-600 to-gray-800', bg: 'bg-gray-50' },
  ];
  const cryptoCoins = [
    { symbol: '₿', name: 'Bitcoin', abbr: 'BTC', color: 'from-orange-400 to-yellow-500', glow: 'shadow-orange-200' },
    { symbol: 'Ξ', name: 'Ethereum', abbr: 'ETH', color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-200' },
    { symbol: '₮', name: 'USDT', abbr: 'USDT', color: 'from-green-500 to-emerald-600', glow: 'shadow-green-200' },
    { symbol: 'B', name: 'BNB Chain', abbr: 'BNB', color: 'from-yellow-400 to-amber-500', glow: 'shadow-yellow-200' },
  ];

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-gray-950 to-gray-900 text-white overflow-hidden">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .float-anim { animation: float 3s ease-in-out infinite; }
        .shimmer-text { background:linear-gradient(90deg,#F59E0B,#FCD34D,#F59E0B); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 2.5s linear infinite; }
        .slide-in { opacity:0; transform:translateY(40px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
        .slide-in.visible { opacity:1; transform:translateY(0); }
        .card-hover { transition:all 0.3s ease; }
        .card-hover:hover { transform:translateY(-6px) scale(1.04); }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(251,191,36,0.4)} 70%{box-shadow:0 0 0 20px rgba(251,191,36,0)} 100%{box-shadow:0 0 0 0 rgba(251,191,36,0)} }
        .pulse-ring { animation:pulse-ring 2.5s infinite; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 slide-in ${visible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 rounded-full px-5 py-2 mb-6 pulse-ring">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-amber-300 text-sm font-semibold">Globally Trusted Payment Gateway</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia,serif' }}>
            <span className="shimmer-text">Seamless</span> Global Payments
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Book from anywhere in the world using your preferred payment method — we accept them all.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* International Payments Card */}
          <div className={`slide-in ${visible ? 'visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 h-full hover:bg-white/10 transition-all duration-500 hover:border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30 float-anim">
                  🌍
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">International Payments</h3>
                  <p className="text-gray-400 text-sm">150+ countries · 30+ currencies</p>
                </div>
                <div className="ml-auto">
                  <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">LIVE</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {internationalMethods.map((m, i) => (
                  <div key={m.name} className={`card-hover bg-white/5 border border-white/10 rounded-xl p-3 text-center cursor-default`}
                    style={{ transitionDelay: `${i * 0.05}s` }}>
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <p className="text-white text-xs font-semibold">{m.name}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="text-white font-semibold text-sm">256-bit SSL Encrypted</p>
                    <p className="text-gray-400 text-xs">PCI DSS Level 1 · 3D Secure · Bank-grade security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Crypto Payment Card */}
          <div className={`slide-in ${visible ? 'visible' : ''}`} style={{ transitionDelay: '0.3s' }}>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 h-full hover:bg-white/10 transition-all duration-500 hover:border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30 float-anim" style={{ animationDelay: '0.5s' }}>
                  ₿
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Cryptocurrency</h3>
                  <p className="text-gray-400 text-sm">Decentralized · Borderless · Instant</p>
                </div>
                <div className="ml-auto">
                  <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30">NEW</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {cryptoCoins.map((c, i) => (
                  <div key={c.abbr} className={`card-hover bg-gradient-to-br ${c.color} rounded-xl p-4 shadow-lg ${c.glow} cursor-default`}
                    style={{ transitionDelay: `${i * 0.07}s` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-white text-2xl font-bold w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">{c.symbol}</span>
                      <div>
                        <p className="text-white font-bold text-sm">{c.abbr}</p>
                        <p className="text-white/70 text-xs">{c.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-white font-semibold text-sm">Real-time Exchange Rates</p>
                    <p className="text-gray-400 text-xs">Auto-converted · 30-min payment window · TX verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges strip */}
        <div className={`mt-10 slide-in ${visible ? 'visible' : ''}`} style={{ transitionDelay: '0.45s' }}>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: '🔒', text: 'SSL Encrypted' },
              { icon: '🛡️', text: 'PCI DSS Safe' },
              { icon: '🌍', text: '150+ Countries' },
              { icon: '₿', text: 'Crypto Accepted' },
              { icon: '✅', text: 'RBI Compliant' },
              { icon: '⚡', text: 'Instant Confirm' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition">
                <span>{b.icon}</span>
                <span className="text-gray-300 text-xs font-semibold">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Split Screen Section with Parallax Image ──────────── */
function SplitSection({ eyebrow, headingLines, description, ctaLabel, ctaHref, imageSrc, imageAlt, imageLabel, reversed }) {
  const sectionRef = React.useRef(null);
  const [visible,   setVisible]   = React.useState(false);
  const [parallaxY, setParallaxY] = React.useState(0);

  // Entrance reveal
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.14, rootMargin: '0px 0px -50px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Parallax: image drifts up on scroll-down, returns on scroll-up
  React.useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh   = window.innerHeight;
      // progress = -1 (section above view) → 0 (centered) → +1 (section below)
      const progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh * 0.7);
      setParallaxY(Math.max(-1, Math.min(1, progress)) * 52);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // seed on mount
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const textBlock = (
    <div style={{ maxWidth: '500px', marginLeft: reversed ? 'auto' : 0 }}>
      {/* Eyebrow */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(26px)',
        transition: 'opacity 0.75s ease 0.05s, transform 0.75s cubic-bezier(0.22,1,0.36,1) 0.05s',
        willChange: 'opacity, transform',
      }}>
        <span style={{ width: '28px', height: '1px', background: '#A8834A', opacity: 0.65, flexShrink: 0 }}/>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.42em', textTransform: 'uppercase', color: '#A8834A' }}>
          {eyebrow}
        </span>
      </div>

      {/* Heading */}
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2.2rem,3.5vw,3.6rem)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.01em', color: '#1C1A17', marginBottom: 0 }}>
        {headingLines.map((line, i) => (
          <span key={i} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.04em' }}>
            <span style={{
              display: 'block',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(46px)',
              transition: `opacity 0.78s cubic-bezier(0.22,1,0.36,1) ${120 + i * 95}ms, transform 0.78s cubic-bezier(0.22,1,0.36,1) ${120 + i * 95}ms`,
              willChange: 'opacity, transform',
            }}>
              {typeof line === 'string' ? line : (
                <>{line.before}<em style={{ fontStyle: 'italic', color: '#C9A96E', fontWeight: 300 }}>{line.italic}</em>{line.after||''}</>
              )}
            </span>
          </span>
        ))}
      </h2>

      {/* Rule */}
      <div style={{
        width: '48px', height: '1px',
        background: 'linear-gradient(90deg, #A8834A, transparent)',
        margin: '1.8rem 0',
        transform: visible ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease 0.42s, transform 0.72s cubic-bezier(0.22,1,0.36,1) 0.42s',
        willChange: 'transform',
      }}/>

      {/* Description */}
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem', fontWeight: 400,
        lineHeight: 1.85, color: '#6B6560', letterSpacing: '0.015em',
        maxWidth: '380px', marginBottom: '2.4rem',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.76s ease 0.50s, transform 0.76s ease 0.50s',
        willChange: 'opacity, transform',
      }}>
        {description}
      </p>

      {/* CTA */}
      <CrackButton href={ctaHref || '#'} label={ctaLabel} visible={visible} delay={600} />
    </div>
  );

  const imageBlock = (
    <div style={{ position: 'relative' }}>
      <div style={{
        overflow: 'hidden', borderRadius: '10px', position: 'relative',
        clipPath: visible ? 'inset(0 0% 0 0 round 10px)' : 'inset(0 100% 0 0 round 10px)',
        boxShadow: visible ? '0 22px 60px rgba(30,26,20,0.10), 0 4px 16px rgba(30,26,20,0.06)' : 'none',
        transition: 'clip-path 1.06s cubic-bezier(0.76,0,0.24,1) 0.18s, box-shadow 1.1s ease 0.18s',
        willChange: 'clip-path',
      }}>
        <img src={imageSrc} alt={imageAlt}
          style={{
            display: 'block', width: '100%', aspectRatio: '4/5', objectFit: 'cover',
            // Parallax: scale slightly > 1 so drift never shows edges; translateY drives the drift
            transform: visible
              ? `scale(1.13) translateY(${parallaxY * 0.5}px)`
              : 'scale(1.18) translateY(0px)',
            transition: visible
              ? 'transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)'   // smooth continuous scroll
              : 'transform 1.16s cubic-bezier(0.22,1,0.36,1) 0.22s',  // entrance animation
            willChange: 'transform',
          }}
        />
        <div style={{
          position: 'absolute', top: '1.3rem', left: '1.5rem',
          fontFamily: "'Cinzel', serif", fontSize: '0.44rem', letterSpacing: '0.36em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.7)', background: 'rgba(20,18,16,0.3)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)', padding: '0.4rem 0.75rem', border: '1px solid rgba(255,255,255,0.1)',
          opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 1.08s', pointerEvents: 'none', zIndex: 2,
        }}>{imageLabel}</div>
      </div>
      {/* Gold hairlines */}
      <div style={{ position:'absolute', top:'-1.2rem', right:'-1.2rem', width:'1px', height:'42%', background:'linear-gradient(to bottom,transparent,rgba(168,131,74,0.3),transparent)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-1.2rem', left:'-1.2rem', height:'1px', width:'30%', background:'linear-gradient(to right,transparent,rgba(168,131,74,0.3),transparent)', pointerEvents:'none' }}/>
      {/* Ground shadow */}
      <div style={{ position:'absolute', left:'8%', right:'8%', bottom:'-14px', height:'20px', background:'radial-gradient(ellipse,rgba(30,26,20,0.07) 0%,transparent 70%)', filter:'blur(5px)', pointerEvents:'none', opacity: visible ? 1 : 0, transition: 'opacity 0.9s ease 0.85s' }}/>
    </div>
  );

  return (
    <section ref={sectionRef} style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6vw',
      alignItems: 'center', maxWidth: '1320px', margin: '0 auto', padding: '7rem 5vw',
    }}>
      <div style={{ order: reversed ? 2 : 1 }}>{textBlock}</div>
      <div style={{ order: reversed ? 1 : 2 }}>{imageBlock}</div>
    </section>
  );
}

/* ─── Crack / Glass-shatter Button ──────────────────────── */
function CrackButton({ href, label, visible, delay = 600 }) {
  const [cracking, setCracking] = React.useState(false);
  const btnRef = React.useRef(null);

  const triggerCrack = (e) => {
    if (cracking) return;
    setCracking(true);
    const rect = btnRef.current?.getBoundingClientRect();
    const cx = e.clientX - (rect?.left || 0);
    const cy = e.clientY - (rect?.top  || 0);
    spawnCracks(e.clientX, e.clientY, cx, cy);
    setTimeout(() => setCracking(false), 900);
  };

  const spawnCracks = (pageX, pageY, cx, cy) => {
    // Shard fragments — spread from click point
    const colors = ['#F59E0B','#FCD34D','#FBBF24','#FDE68A','#ffffff','#F97316'];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const shard = document.createElement('div');
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const dist  = 30 + Math.random() * 90;
      const size  = 4 + Math.random() * 10;
      const rot   = Math.random() * 720 - 360;
      shard.style.cssText = `
        position:fixed; pointer-events:none; z-index:99999;
        left:${pageX}px; top:${pageY}px;
        width:${size}px; height:${size * (0.3 + Math.random() * 0.5)}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        transform-origin:center;
        border-radius:${Math.random() > 0.5 ? '2px' : '50%'};
        animation: crackShard 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
        --tx:${Math.cos(angle) * dist}px;
        --ty:${Math.sin(angle) * dist}px;
        --rot:${rot}deg;
        animation-delay:${Math.random() * 80}ms;
      `;
      document.body.appendChild(shard);
      setTimeout(() => shard.remove(), 1000);
    }
    // Crack-line rays (SVG)
    const rays = 8;
    for (let r = 0; r < rays; r++) {
      const ray = document.createElement('div');
      const angle = (r / rays) * Math.PI * 2 + Math.random() * 0.4;
      const len   = 20 + Math.random() * 60;
      ray.style.cssText = `
        position:fixed; pointer-events:none; z-index:99998;
        left:${pageX}px; top:${pageY}px;
        width:${len}px; height:1.5px;
        background:linear-gradient(to right,rgba(251,191,36,0.9),transparent);
        transform-origin:left center;
        transform:rotate(${angle}rad);
        animation: crackRay 0.5s ease forwards;
        animation-delay:${r * 20}ms;
      `;
      document.body.appendChild(ray);
      setTimeout(() => ray.remove(), 700);
    }
  };

  return (
    <>
      <style>{`
        @keyframes crackShard {
          0%   { transform:translate(0,0) rotate(0deg) scale(1); opacity:1; }
          100% { transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(0); opacity:0; }
        }
        @keyframes crackRay {
          0%   { opacity:0.9; width:0; }
          40%  { opacity:0.8; }
          100% { opacity:0; }
        }
        @keyframes btnShake {
          0%,100%{transform:translateX(0) scale(1)}
          20%{transform:translateX(-3px) scale(0.98)}
          40%{transform:translateX(3px) scale(1.01)}
          60%{transform:translateX(-2px)}
          80%{transform:translateX(2px)}
        }
        .crack-btn-inner { transition: all 0.35s ease; }
        .crack-btn-inner:hover { transform: translateY(-2px); }
        .crack-btn-inner:active { transform: scale(0.96); }
      `}</style>
      <a
        ref={btnRef}
        href={href}
        className="crack-btn-inner"
        onClick={triggerCrack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.9rem',
          textDecoration: 'none',
          fontFamily: "'Cinzel', serif", fontSize: '0.54rem',
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: cracking ? '#A8834A' : '#1C1A17',
          paddingBottom: '0.5rem',
          borderBottom: `1px solid ${cracking ? '#C9A96E' : 'rgba(28,26,23,0.22)'}`,
          transition: 'all 0.35s ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(14px)',
          transitionProperty: 'color, border-color, opacity, transform',
          transitionDuration: `0.35s, 0.35s, 0.70s, 0.70s`,
          transitionDelay: `0s, 0s, ${delay}ms, ${delay}ms`,
          animation: cracking ? 'btnShake 0.4s ease' : 'none',
          willChange: 'opacity, transform',
        }}
        onMouseEnter={e => { e.currentTarget.style.color='#A8834A'; e.currentTarget.style.borderBottomColor='#C9A96E'; }}
        onMouseLeave={e => { if (!cracking) { e.currentTarget.style.color='#1C1A17'; e.currentTarget.style.borderBottomColor='rgba(28,26,23,0.22)'; }}}
      >
        {label}
        <span style={{ transition: 'transform 0.35s ease', display:'inline-block' }} className="cta-arr">→</span>
      </a>
    </>
  );
}

/* ─── Pop-out Review Card ────────────────────────────────── */
const REVIEW_EMOJIS = ['🌟','✨','💫','🎉','🥂','🏆','💎','🌺','🎊','👑','🌈','🎭'];

function ReviewCard({ t, i, visible }) {
  const [popped, setPopped] = React.useState(false);
  const [emojiBurst, setEmojiBurst] = React.useState([]);

  const handleTouch = (e) => {
    setPopped(true);
    // Spawn floating emojis
    const rect = e.currentTarget.getBoundingClientRect();
    const burst = Array.from({ length: 8 }, (_, k) => ({
      id: Date.now() + k,
      emoji: REVIEW_EMOJIS[Math.floor(Math.random() * REVIEW_EMOJIS.length)],
      x: rect.left + rect.width  * 0.5 + (Math.random() - 0.5) * rect.width,
      y: rect.top  + rect.height * 0.3,
      vx: (Math.random() - 0.5) * 60,
      vy: -(40 + Math.random() * 60),
      size: 18 + Math.random() * 16,
    }));
    setEmojiBurst(burst);
    burst.forEach(b => {
      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed; left:${b.x}px; top:${b.y}px;
        font-size:${b.size}px; pointer-events:none; z-index:99999;
        animation: emojiFloat 1.1s cubic-bezier(0.16,1,0.3,1) forwards;
        --vx:${b.vx}px; --vy:${b.vy}px;
      `;
      el.textContent = b.emoji;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    });
    setTimeout(() => setPopped(false), 600);
  };

  return (
    <>
      <style>{`
        @keyframes emojiFloat {
          0%   { transform:translate(0,0) scale(0.5) rotate(0deg); opacity:1; }
          60%  { opacity:1; }
          100% { transform:translate(var(--vx),var(--vy,-80px)) scale(1.2) rotate(${Math.random()>0.5?'':'-'}20deg); opacity:0; }
        }
        @keyframes cardPop {
          0%   { transform:scale(1) translateY(0) rotate(0deg); }
          30%  { transform:scale(1.06) translateY(-14px) rotate(${i%2===0?'-':'+'}1.5deg); }
          65%  { transform:scale(1.04) translateY(-10px) rotate(${i%2===0?'+':'-'}0.8deg); }
          100% { transform:scale(1) translateY(0) rotate(0deg); }
        }
        .review-card-${i} { transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease; }
        .review-card-${i}:hover { transform:translateY(-8px) scale(1.02); box-shadow:0 24px 48px rgba(0,0,0,0.14); }
        .review-card-${i}.popped { animation: cardPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; box-shadow:0 32px 64px rgba(251,191,36,0.22),0 0 0 2px rgba(251,191,36,0.3); }
      `}</style>
      <div
        className={`review-card-${i} bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer select-none ${popped ? 'popped' : ''}`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? '' : 'translateY(40px)',
          transition: `opacity 0.7s ease ${i * 0.12}s, transform 0.7s ease ${i * 0.12}s, box-shadow 0.35s ease`,
        }}
        onMouseEnter={handleTouch}
        onTouchStart={handleTouch}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">{t.avatar}</div>
          <div>
            <p className="font-semibold text-gray-800 text-sm" style={{fontFamily:"'Playfair Display',Georgia,serif"}}>{t.name}</p>
            <p className="text-gray-400 text-xs">{t.country}</p>
          </div>
          <div className="ml-auto text-xl opacity-0 group-hover:opacity-100 transition-opacity">{REVIEW_EMOJIS[i % REVIEW_EMOJIS.length]}</div>
        </div>
        <div className="flex gap-0.5 mb-3">
          {[...Array(t.rating)].map((_, j) => (
            <span key={j} className="text-amber-400 text-sm" style={{ transition:`transform 0.2s ease ${j*40}ms`, display:'inline-block' }}>★</span>
          ))}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed italic">"{t.text}"</p>
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-1 text-xs text-gray-300">
          <span>Touch to celebrate</span>
          <span className="text-base">✨</span>
        </div>
      </div>
    </>
  );
}

/* ─── Membership Packages Section (replaces Honeymoon) ──── */
function MembershipSection() {
  const [ref, visible] = useScrollAnimation();
  const [packages, setPackages] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    membershipAPI.getPackages()
      .then(r => setPackages(r.data.data.packages || []))
      .catch(() => {});
  }, []);

  const sorted = [...packages].sort((a,b) => ({silver:0,gold:1,platinum:2}[a.tier]||0) - ({silver:0,gold:1,platinum:2}[b.tier]||0));

  const gradients = {
    silver:   'linear-gradient(135deg,#8a9bb0 0%,#64748b 100%)',
    gold:     'linear-gradient(135deg,#f6d365 0%,#f0a800 100%)',
    platinum: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%)',
  };
  const fallback = [
    {tier:'silver', name:'Silver Circle', icon:'🥈', price:10000, freeBookings:5, benefits:['5 free room bookings','5% off dining','Welcome drink','Late checkout 1PM']},
    {tier:'gold', name:'Gold Prestige', icon:'🥇', price:25000, freeBookings:15, benefits:['15 free room bookings','10% off all services','Free airport transfer','Room upgrade','Personal concierge']},
    {tier:'platinum', name:'Platinum Elite', icon:'💎', price:60000, freeBookings:40, benefits:['40 free room bookings','20% off everything','Personal butler','Suite upgrade','Unlimited spa access']},
  ];
  const display = sorted.length > 0 ? sorted : fallback;

  return (
    <section ref={ref} className="py-24 relative overflow-hidden" style={{background:'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)'}}>
      <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 50%,#f59e0b 0%,transparent 50%),radial-gradient(circle at 80% 50%,#8b5cf6 0%,transparent 50%)'}}/>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{opacity:visible?1:0,transform:visible?'none':'translateY(32px)',transition:'all .9s cubic-bezier(.16,1,.3,1)'}} className="text-center mb-16">
          <p className="text-amber-400 text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{fontFamily:"'Cinzel',serif"}}>✨ Exclusive Membership</p>
          <h2 className="text-5xl font-light text-white mb-4" style={{fontFamily:"'Playfair Display',Georgia,serif"}}>
            Amigo <em className="text-amber-400 italic">Memberships</em>
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-5"/>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">Purchase a membership and enjoy free room bookings, exclusive discounts, and premium privileges year-round.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {display.map((pkg, i) => (
            <div key={pkg.tier}
              style={{opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(48px)',transition:`opacity .85s cubic-bezier(.16,1,.3,1) ${.15+i*.12}s,transform .85s cubic-bezier(.16,1,.3,1) ${.15+i*.12}s`}}
              className="group relative bg-white/5 backdrop-blur border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
              <div className="p-6 text-white" style={{background:gradients[pkg.tier]}}>
                <div className="flex items-center justify-between mb-3">
                  <span style={{fontSize:'2.5rem'}}>{pkg.icon}</span>
                  {pkg.tier==='gold'&&<span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">POPULAR</span>}
                  {pkg.tier==='platinum'&&<span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">BEST VALUE</span>}
                </div>
                <h3 className="font-bold text-xl mb-1">{pkg.name}</h3>
                <p className="text-white/75 text-sm">{pkg.freeBookings} free room bookings</p>
                <div className="mt-3"><span className="text-3xl font-bold">₹{(pkg.price||0).toLocaleString('en-IN')}</span><span className="text-white/60 text-sm">/year</span></div>
              </div>
              <div className="p-5">
                <div className="space-y-2 mb-5">
                  {(pkg.benefits||[]).slice(0,4).map(b=>(
                    <div key={b} className="flex items-center gap-2 text-sm text-gray-300"><span className="text-amber-400 text-xs">✓</span>{b}</div>
                  ))}
                </div>
                <button onClick={()=>navigate(`/membership?tier=${pkg.tier}`)}
                  className="block w-full text-center font-bold py-3 rounded-xl transition-all duration-300 hover:shadow-lg text-white"
                  style={{background:gradients[pkg.tier]}}>
                  Get {pkg.name} →
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{opacity:visible?1:0,transition:'opacity .8s ease .6s'}} className="text-center mt-12">
          <Link to="/membership" className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-3 hover:bg-white/10 transition text-gray-300 text-sm">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"/>
            View all membership benefits & purchase online →
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ─── Testimonials Section (with Write-a-Review) ────────── */
const TESTIMONIALS = [
  { name: 'Sarah Mitchell', country: '🇬🇧 London', text: 'The international payment was seamless — paid in GBP and everything processed instantly. Extraordinary hospitality!', rating: 5, avatar: 'SM' },
  { name: 'Raj Krishnamurthy', country: '🇸🇬 Singapore', text: 'Used crypto to pay for our penthouse stay. The BTC payment was confirmed within minutes. Truly a hotel of the future!', rating: 5, avatar: 'RK' },
  { name: 'Emma Beaumont', country: '🇫🇷 Paris', text: 'Paid with my Amex card — no issues whatsoever. The suite was beyond our expectations. Will return every year!', rating: 5, avatar: 'EB' },
  { name: 'Chen Wei', country: '🇨🇳 Shanghai', text: 'The USDT payment option was perfect for our corporate booking. Instant confirmation and the service was flawless.', rating: 5, avatar: 'CW' },
];

const REVIEWS_KEY = 'amigo_guest_reviews';
function getStoredReviews() {
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]'); } catch { return []; }
}

function TestimonialsSection() {
  const [ref, visible] = useScrollAnimation();
  const [userReviews, setUserReviews] = React.useState(() => getStoredReviews());
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', location: '', rating: 5, text: '' });
  const [submitting, setSubmitting] = React.useState(false);
  const [justSubmitted, setJustSubmitted] = React.useState(false);

  const allReviews = [
    ...userReviews.map(r => ({ ...r, _isNew: true })),
    ...TESTIMONIALS,
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const newReview = {
        name: form.name.trim(),
        country: form.location.trim() || '🌍 Guest',
        rating: form.rating,
        text: form.text.trim(),
        avatar: form.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      };
      const updated = [newReview, ...getStoredReviews()];
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
      setUserReviews(updated);
      setForm({ name: '', location: '', rating: 5, text: '' });
      setSubmitting(false);
      setShowForm(false);
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 4000);
    }, 900);
  };

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.7s ease' }} className="text-center mb-10">
          <p style={{ fontFamily:"'Cinzel',serif" }} className="text-amber-600 text-xs font-semibold tracking-[0.3em] uppercase mb-3">✦ Guest Reviews ✦</p>
          <h2 className="text-4xl font-light text-gray-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            What Our <em className="text-amber-500 italic">Guests Say</em>
          </h2>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4 mb-4"/>
          {/* Write review CTA */}
          <button
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-7 py-2.5 rounded-full text-sm transition-all duration-300 hover:scale-105 shadow-md shadow-amber-200 mt-2"
          >
            ✍️ {showForm ? 'Cancel Review' : 'Write a Review'}
          </button>
          {justSubmitted && (
            <p className="text-green-600 font-semibold text-sm mt-3 animate-pulse">🎉 Thank you! Your review is now live on the homepage.</p>
          )}
        </div>

        {/* Write Review Form */}
        {showForm && (
          <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}
            className="max-w-2xl mx-auto mb-12 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily:"'Playfair Display',Georgia,serif" }}>Share Your Experience</h3>
            <p className="text-gray-400 text-sm mb-6">Your review appears instantly below for all visitors to see.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Full name" required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Location</label>
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                    placeholder="🇮🇳 Mumbai, India"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rating *</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button"
                      onClick={() => setForm({...form, rating: star})}
                      className="text-3xl transition-transform hover:scale-125 focus:outline-none"
                      style={{ color: star <= form.rating ? '#F59E0B' : '#D1D5DB' }}>
                      ★
                    </button>
                  ))}
                  <span className="text-sm text-gray-400 self-center ml-2">{form.rating}/5</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Review *</label>
                <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})}
                  placeholder="Tell future guests about your stay at Amigo..."
                  rows={4} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"/>
              </div>
              <button type="submit" disabled={!form.name.trim() || !form.text.trim() || submitting}
                className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"/>Publishing...</>
                  : '🌟 Publish My Review'
                }
              </button>
            </form>
          </div>
        )}

        {/* Review Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {allReviews.map((t, i) => (
            <div key={`${t.name}-${i}`} className="relative">
              {t._isNew && (
                <div className="absolute -top-2 -right-2 z-10 bg-green-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-md">✓ New</div>
              )}
              <ReviewCard t={t} i={i} visible={visible} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 3D Card Tilt Hook ─────────────────────────────── */
function use3DTilt() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -18;
      el.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) scale3d(1.04,1.04,1.04)`;
    };
    const handleLeave = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => { el.removeEventListener('mousemove', handleMove); el.removeEventListener('mouseleave', handleLeave); };
  }, []);
  return ref;
}

/* ─── Animated Counter ──────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = React.useState(0);
  const [ref, visible] = useScrollAnimation();
  React.useEffect(() => {
    if (!visible) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    const dur = 1800;
    const steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * num * 10) / 10);
      if (step >= steps) clearInterval(timer);
    }, dur / steps);
    return () => clearInterval(timer);
  }, [visible, target]);
  const prefix = target.startsWith('₹') ? '₹' : '';
  const displayTarget = target.replace(/[^0-9.+★]/g, '');
  return <span ref={ref}>{visible ? `${prefix}${count}${suffix || displayTarget.replace(/[0-9.]/g, '')}` : '0'}</span>;
}

/* ─── Particle Background ───────────────────────────── */
function ParticleField({ count = 18 }) {
  const particles = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${4 + Math.random() * 8}px`,
    duration: `${8 + Math.random() * 14}s`,
    delay: `${Math.random() * 10}s`,
    color: i % 3 === 0 ? 'rgba(251,191,36,0.6)' : i % 3 === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(251,191,36,0.2)',
  })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, bottom: '-20px', width: p.size, height: p.size,
          background: p.color, animationDuration: p.duration, animationDelay: p.delay,
        }}/>
      ))}
    </div>
  );
}

/* ─── Typewriter Effect ─────────────────────────────── */
function Typewriter({ words, speed = 80, pause = 2000 }) {
  const [text, setText] = React.useState('');
  const [wordIdx, setWordIdx] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);
  React.useEffect(() => {
    const current = words[wordIdx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, text.length + 1));
        if (text.length + 1 === current.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setText(current.slice(0, text.length - 1));
        if (text.length - 1 === 0) { setDeleting(false); setWordIdx((wordIdx + 1) % words.length); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, wordIdx, words, speed, pause]);
  return <span>{text}<span className="cursor-blink text-amber-400">|</span></span>;
}

// ── Main HomePage ─────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState({ checkIn:'', checkOut:'', adults:'2' });
  const [activeAmenity, setActiveAmenity] = useState(null);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [heroVisible, setHeroVisible] = React.useState(false);
  const [scrollY, setScrollY] = React.useState(0);
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  React.useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 100); return () => clearTimeout(t); }, []);

  // Scroll reveal observer (handles both .reveal and .flow-reveal classes)
  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); } });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));

    // Flow-reveal: slower, flowing entrance animation
    const flowEls = document.querySelectorAll('.flow-reveal');
    const flowObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('flow-in'); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    flowEls.forEach(el => flowObs.observe(el));

    return () => { obs.disconnect(); flowObs.disconnect(); };
  }, []);

  // Parallax scroll + back-to-top trigger
  React.useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      setShowBackToTop(window.scrollY > 480);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSearch = e => { e.preventDefault(); navigate(`/rooms?${new URLSearchParams(search).toString()}`); };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes bounce-once { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(251,191,36,0.3)} 50%{box-shadow:0 0 40px rgba(251,191,36,0.7),0 0 80px rgba(251,191,36,0.2)} }
        @keyframes floatUpDown { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes scanLine { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
        .animate-fade-in    { animation:fadeIn 0.5s ease forwards; }
        .animate-bounce-once { animation:bounce-once 0.6s ease; }
        .hero-title  { animation:fadeInUp 1s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .hero-sub    { animation:fadeInUp 1s cubic-bezier(0.16,1,0.3,1) 0.5s both; }
        .hero-form   { animation:fadeInUp 1s cubic-bezier(0.16,1,0.3,1) 0.7s both; }
        .hero-badges { animation:fadeInUp 1s cubic-bezier(0.16,1,0.3,1) 0.6s both; }
        .btn-glow { transition: all 0.3s ease; }
        .btn-glow:hover { box-shadow:0 0 30px rgba(251,191,36,0.6); transform: scale(1.03); }
        .btn-glow:active { transform: scale(0.98); }
        .slide-in { opacity:0; transform:translateY(40px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
        .slide-in.visible { opacity:1; transform:none; }
        .amenity-card { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .amenity-card:hover { transform: translateY(-10px) scale(1.03); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .amenity-icon { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .amenity-card:hover .amenity-icon { transform: scale(1.3) rotate(-5deg); }
        .room-card { transition: all 0.5s cubic-bezier(0.16,1,0.3,1); }
        .room-card:hover { transform: translateY(-8px); }
        .room-card:hover img { transform: scale(1.08); }
        .room-card img { transition: transform 0.6s ease; }
        .stat-card { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .stat-card:hover { transform: translateY(-8px) rotate(-1deg) scale(1.05); box-shadow: 0 20px 40px rgba(251,191,36,0.2); }
        .loyalty-btn { animation: glowPulse 2.5s ease-in-out infinite; transition: all 0.3s ease; }
        .loyalty-btn:hover { transform: scale(1.08); }
        .cta-link { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .cta-link:hover { transform: scale(1.08) translateY(-3px); box-shadow: 0 15px 30px rgba(251,191,36,0.4); }
        .badge-pill { transition: all 0.3s ease; animation: floatUpDown ease-in-out infinite; }
        .badge-pill:nth-child(1) { animation-duration: 3s; animation-delay: 0s; }
        .badge-pill:nth-child(2) { animation-duration: 3.5s; animation-delay: 0.5s; }
        .badge-pill:nth-child(3) { animation-duration: 4s; animation-delay: 1s; }
        .badge-pill:hover { background: rgba(251,191,36,0.3); transform: scale(1.1) !important; }
        .gradient-animate {
          background: linear-gradient(270deg, #1f2937, #78350f, #1f2937, #1c1917);
          background-size: 400% 400%;
          animation: gradientShift 10s ease infinite;
        }
        .scan-line {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent);
          animation: scanLine 4s linear infinite;
          pointer-events: none;
        }

        /* ── ELITE LIGHT BACKGROUND ── */
        html { scroll-behavior: smooth; }
        body {
          background:
            radial-gradient(ellipse 80% 40% at 15% 0%,   rgba(212,175,100,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 100%, rgba(196,160,100,0.08) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 50% 50%,  rgba(245,230,190,0.06) 0%, transparent 70%),
            linear-gradient(160deg,
              #fdf8ef 0%,
              #faf3e4 12%,
              #f7f0e8 25%,
              #f9f4ec 38%,
              #faf5ed 52%,
              #f6f0e6 65%,
              #faf4ea 78%,
              #fdf9f2 100%
            ) !important;
          background-attachment: fixed !important;
        }

        /* ── SLOW FLOWING SECTION ENTRANCE ── */
        .flow-reveal {
          opacity: 0;
          transform: translateY(48px);
          transition:
            opacity  1.1s cubic-bezier(0.16,1,0.3,1),
            transform 1.1s cubic-bezier(0.16,1,0.3,1);
          will-change: opacity, transform;
        }
        .flow-reveal.flow-in {
          opacity: 1;
          transform: translateY(0);
        }
        .flow-reveal-delay-1 { transition-delay: 0.12s !important; }
        .flow-reveal-delay-2 { transition-delay: 0.24s !important; }
        .flow-reveal-delay-3 { transition-delay: 0.36s !important; }

        /* ── BACK TO TOP BUTTON ── */
        .btt-btn {
          position: fixed;
          bottom: 2.2rem; right: 2.2rem;
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #C9A84C 0%, #F0C040 55%, #B8920A 100%);
          border-radius: 50%;
          border: none; outline: none; cursor: pointer;
          z-index: 9998;
          display: flex; align-items: center; justify-content: center;
          color: #1a1000; font-size: 18px; font-weight: 900;
          box-shadow: 0 4px 24px rgba(180,140,30,0.45), 0 1px 4px rgba(0,0,0,0.12);
          transition:
            opacity  0.45s cubic-bezier(0.34,1.56,0.64,1),
            transform 0.45s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.3s ease;
          animation: bttPulse 3s ease-in-out infinite;
        }
        .btt-btn.btt-hidden  { opacity:0; transform:scale(0.35) translateY(24px); pointer-events:none; }
        .btt-btn.btt-visible { opacity:1; transform:scale(1)    translateY(0);    pointer-events:all;  }
        .btt-btn:hover {
          transform: scale(1.16) translateY(-5px) !important;
          box-shadow: 0 10px 36px rgba(180,140,30,0.6), 0 0 0 8px rgba(201,168,76,0.12) !important;
        }
        .btt-btn:active { transform: scale(0.92) !important; }
        @keyframes bttPulse {
          0%,100% { box-shadow: 0 4px 24px rgba(180,140,30,0.40), 0 0 0 0   rgba(201,168,76,0); }
          50%      { box-shadow: 0 4px 24px rgba(180,140,30,0.55), 0 0 0 10px rgba(201,168,76,0.10); }
        }
        .btt-label {
          position: absolute;
          right: 58px; top: 50%; transform: translateY(-50%);
          background: rgba(28,22,8,0.88); color: #D4AF37;
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 6px; white-space: nowrap;
          border: 1px solid rgba(201,168,76,0.30);
          opacity: 0; pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .btt-btn:hover .btt-label { opacity: 1; }
      `}</style>

      {/* ── Hero ── */}
      <div className="relative bg-gray-900 text-white overflow-hidden" style={{minHeight:'88vh'}}>
        {/* Parallax background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920)',
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
            transition: 'transform 0.1s linear',
          }}
        />
        {/* Scan line effect */}
        <div className="scan-line"/>
        {/* Particles */}
        <ParticleField count={22} />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50"/>

        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center" style={{minHeight:'88vh'}}>
          <div className="hero-title inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">Est. 1924 · Five Stars · Chennai</span>
          </div>
          <h1 className="hero-title text-5xl sm:text-7xl font-light mb-4" style={{fontFamily:"'DM Serif Display',Georgia,serif"}}>
            Where <em className="gold-shimmer not-italic">Luxury</em> Begins
          </h1>
          <p className="hero-sub text-gray-300 text-lg mb-3 max-w-xl">
            <Typewriter words={[
              'An icon of unparalleled elegance.',
              'Where every detail is perfected.',
              'Your five-star sanctuary awaits.',
              'Redefining luxury since 1924.',
            ]} />
          </p>
          <div className="hero-badges flex flex-wrap gap-2 justify-center mb-8">
            <span className="badge-pill bg-white/10 backdrop-blur border border-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold cursor-default">🌍 International Payments</span>
            <span className="badge-pill bg-white/10 backdrop-blur border border-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold cursor-default">₿ Crypto Accepted</span>
            <span className="badge-pill bg-white/10 backdrop-blur border border-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold cursor-default">🔒 100% Secure</span>
          </div>
          <form onSubmit={handleSearch} className="hero-form bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-white/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-In</label>
                <input type="date" value={search.checkIn} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSearch({...search,checkIn:e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all focus:scale-[1.02]"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-Out</label>
                <input type="date" value={search.checkOut} min={search.checkIn||new Date().toISOString().split('T')[0]}
                  onChange={e => setSearch({...search,checkOut:e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all focus:scale-[1.02]"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Guests</label>
                <select value={search.adults} onChange={e => setSearch({...search,adults:e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all focus:scale-[1.02]">
                  {[1,2,3,4].map(n=><option key={n} value={n}>{n} Adult{n>1?'s':''}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-lg btn-magnetic btn-glow btn-elastic relative overflow-hidden">
              Search Available Rooms →
            </button>
          </form>
        </div>
      </div>

      {/* ── Amenities ── */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <p className="text-amber-500 text-xs font-bold tracking-[0.25em] uppercase mb-3">✦ World-Class Amenities ✦</p>
            <h2 className="text-5xl font-light text-gray-900 mb-3" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>An Experience <em className="text-amber-500 italic">Beyond Compare</em></h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4"/>
            <p className="text-gray-400 text-sm mt-4">Click any amenity to explore in detail</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {AMENITIES.map((amenity, i) => (
              <button key={amenity.key} onClick={() => setActiveAmenity(amenity)}
                className="amenity-card group text-center p-8 rounded-3xl bg-gradient-to-b from-white to-amber-50/30 hover:from-amber-50 hover:to-amber-100/50 border border-gray-100 hover:border-amber-200 cursor-pointer shadow-sm hover:shadow-xl reveal reveal-scale"
                style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="amenity-icon text-6xl mb-5 block">{amenity.icon}</div>
                <h3 className="font-bold text-gray-800 text-lg mb-2" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>{amenity.name}</h3>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">{amenity.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 border border-amber-300 rounded-full px-4 py-1.5 group-hover:bg-amber-400 group-hover:text-gray-900 group-hover:border-amber-400 transition-all duration-300">
                  Explore <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Marquee Strip ── */}
      <div className="bg-amber-400 py-3 overflow-hidden relative">
        <style>{`
          @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
          .marquee-track { display:flex; animation:marquee 28s linear infinite; width:max-content; }
          .marquee-track:hover { animation-play-state:paused; }
        `}</style>
        <div className="marquee-track text-gray-900 text-xs font-bold tracking-widest uppercase">
          {Array(8).fill('✦ Five Star Luxury  ✦ Award Winning Dining  ✦ Rooftop Infinity Pool  ✦ Luxury Spa  ✦ Chennai\'s Finest Hotel  ✦ Crypto Payments Accepted  ✦ Personal Butler Service  ✦ Michelin Starred Cuisine  ').map((t,i)=><span key={i} className="px-4">{t}</span>)}
        </div>
      </div>

      {/* ── AWARDS & ROOM SHOWCASE ── */}
      <section className="py-24 bg-gray-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 20% 50%, #F59E0B 0%, transparent 50%), radial-gradient(circle at 80% 50%, #F59E0B 0%, transparent 50%)'}}/>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Awards strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {[
              {num:'100+', label:'Years of Legacy', icon:'🏛️', suffix:'+'},
              {num:'5 ★', label:'Forbes Star Rating', icon:'⭐', suffix:' ★'},
              {num:'3', label:'Michelin Stars', icon:'🍽️', suffix:''},
              {num:'₹1.25L', label:'Penthouse / Night', icon:'👑', suffix:'L'},
            ].map((s, i) => (
              <div key={s.label}
                className="stat-card relative rounded-2xl p-6 text-center border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 hover:border-amber-400/50 reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-400/5 to-transparent"/>
                <span className="text-5xl block mb-3 magnet-hover inline-block">{s.icon}</span>
                <p className="text-3xl font-bold text-amber-400 mb-1" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>
                  <AnimatedCounter target={s.num} suffix={s.suffix} />
                </p>
                <p className="text-gray-400 text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Room category cards */}
          <div className="text-center mb-12 reveal">
            <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">✦ Accommodations ✦</p>
            <h2 className="text-5xl font-light mb-3" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>Rooms &amp; <em className="text-amber-400">Suites</em></h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {img:'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', title:'Deluxe Rooms', desc:'Elegantly appointed rooms with city or garden views, premium bedding and modern amenities.', tag:'Deluxe', filter:'deluxe', from:'from-blue-900/80'},
              {img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', title:'Executive Suites', desc:'Spacious suites with a separate living area, jacuzzi bath, and personalised butler service.', tag:'Suite', filter:'suite', from:'from-purple-900/80'},
              {img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', title:'Royal Penthouse', desc:'Full-floor penthouse with private terrace, panoramic views, and an in-suite plunge pool.', tag:'Penthouse', filter:'penthouse', from:'from-amber-900/80'},
            ].map((r, i) => (
              <div key={r.title} className="room-card group relative rounded-3xl overflow-hidden shadow-2xl cursor-pointer reveal"
                style={{ transitionDelay: `${i * 0.15}s`, height: '420px' }}>
                <img src={r.img} alt={r.title} className="absolute inset-0 w-full h-full object-cover img-popout"/>
                <div className={`absolute inset-0 bg-gradient-to-t ${r.from} via-black/20 to-transparent`}/>
                <div className="absolute inset-0 spotlight opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                {/* Tag */}
                <div className="absolute top-5 left-5">
                  <span className="bg-amber-400 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow">{r.tag}</span>
                </div>
                {/* Content slides up on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-7 text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-400">
                  <h3 className="font-bold text-2xl mb-2" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>{r.title}</h3>
                  <p className="text-gray-300 text-sm mb-5 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{r.desc}</p>
                  <Link to={`/rooms?type=${r.filter}`} className="inline-flex items-center gap-2 bg-amber-400 hover:bg-white text-gray-900 text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105">
                    Explore <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-24 bg-amber-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <p className="text-amber-500 text-xs font-bold tracking-[0.25em] uppercase mb-3">✦ The Amigo Difference ✦</p>
            <h2 className="text-5xl font-light text-gray-900" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>Why <em className="text-amber-500 italic">Guests Love</em> Us</h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
            {[
              { icon:'🌅', title:'Breathtaking Views', desc:'Panoramic vistas of Chennai\'s skyline from every floor, including our rooftop infinity pool on the 20th floor.', color:'from-orange-100 to-amber-50' },
              { icon:'🍽️', title:'Culinary Excellence', desc:'7 award-winning restaurants including 3 Michelin-starred dining experiences crafted by celebrity chefs.', color:'from-rose-100 to-pink-50' },
              { icon:'🌿', title:'Award-Winning Spa', desc:'5,000 sqm sanctuary with 22 private treatment rooms, Ayurvedic therapies, and a heated infinity pool.', color:'from-green-100 to-emerald-50' },
              { icon:'₿', title:'Crypto Payments', desc:'Be the first to experience seamless blockchain payments. Book with Bitcoin, Ethereum, USDT, and more.', color:'from-orange-100 to-yellow-50' },
              { icon:'🛎️', title:'24/7 Butler Service', desc:'Your dedicated personal butler anticipates every need — from private dining to bespoke city experiences.', color:'from-purple-100 to-violet-50' },
              { icon:'🏆', title:'Award-Winning Legacy', desc:'Over 100 years of five-star hospitality, Forbes Travel Guide award winner for 12 consecutive years.', color:'from-blue-100 to-cyan-50' },
            ].map((f, i) => (
              <div key={f.title}
                className={`reveal group bg-gradient-to-br ${f.color} rounded-3xl p-8 border border-white hover:shadow-xl transition-all duration-500 hover:-translate-y-2`}
                style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="text-5xl mb-5 group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
                <h3 className="font-bold text-gray-800 text-xl mb-3" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Acceptance Section */}
      <PaymentAcceptanceSection />

      {/* ── Split Screen Sections ── */}
      <div className="wave-bg-section" style={{ borderTop: '1px solid rgba(168,131,74,0.08)' }}>
        {/* Section separator */}
        <div style={{ display:'flex', alignItems:'center', maxWidth:'1320px', margin:'0 auto', padding:'0 5vw 0' }}>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(168,131,74,0.12),transparent)' }}/>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:'0.5rem', letterSpacing:'0.3em', color:'rgba(168,131,74,0.4)', padding:'0 1.5rem' }}>✦</span>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(168,131,74,0.12),transparent)' }}/>
        </div>

        <SplitSection
          eyebrow="The Suites"
          headingLines={["Rooms Composed", { before:"as Works ", italic:"of Art" }]}
          description="Each of our 92 suites is individually appointed with rare textiles, antiquarian furnishings, and hand-selected artwork — creating a private world that exists nowhere else on earth."
          ctaLabel="Explore Suites"
          ctaHref="/rooms"
          imageSrc="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=85"
          imageAlt="Palace Suite"
          imageLabel="Palace Suite Collection"
        />

        <div style={{ display:'flex', alignItems:'center', maxWidth:'1320px', margin:'0 auto', padding:'0 5vw' }}>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(168,131,74,0.12),transparent)' }}/>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:'0.5rem', letterSpacing:'0.3em', color:'rgba(168,131,74,0.4)', padding:'0 1.5rem' }}>✦</span>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(168,131,74,0.12),transparent)' }}/>
        </div>

        <SplitSection
          reversed
          eyebrow="Romance & Honeymoon"
          headingLines={["Love Stories", { before:"Written in ", italic:"Luxury" }]}
          description="Begin your forever in a setting of timeless romance. Our honeymoon suites are adorned with fresh florals, candlelit baths, and private terrace views — every detail crafted to make your first chapter unforgettable."
          ctaLabel="Discover Honeymoon Offers"
          ctaHref="/rooms"
          imageSrc="https://images.unsplash.com/photo-1529636798458-92182e662485?w=900&q=85"
          imageAlt="Romantic couple at luxury hotel"
          imageLabel="Honeymoon Collection · Est. 1924"
        />

        <div style={{ display:'flex', alignItems:'center', maxWidth:'1320px', margin:'0 auto', padding:'0 5vw' }}>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(168,131,74,0.12),transparent)' }}/>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:'0.5rem', letterSpacing:'0.3em', color:'rgba(168,131,74,0.4)', padding:'0 1.5rem' }}>✦</span>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(168,131,74,0.12),transparent)' }}/>
        </div>

        <SplitSection
          eyebrow="Spa & Wellness"
          headingLines={["Silence Has", { before:"Its Own ", italic:"Luxury" }]}
          description="5,000 square metres of pure restoration. Ancient Vedic rituals, European hydrotherapy, and the only cold-spring soaking pool in South India — all within the original palace annexe."
          ctaLabel="Discover the Spa"
          ctaHref="/spa"
          imageSrc="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=85"
          imageAlt="Aurelian Spa"
          imageLabel="Aurelian Spa · Est. 1924"
        />
      </div>

      {/* ── Honeymoon Offers ── */}
      <MembershipSection />

      {/* Testimonials + Write Review */}
      <TestimonialsSection />

      {/* ── Loyalty Banner ── */}
      <section className="py-24 gradient-animate text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'repeating-linear-gradient(45deg,#C9A96E 0,#C9A96E 1px,transparent 0,transparent 50%)',backgroundSize:'20px 20px'}}/>
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-80 h-80 bg-amber-400/10 blob"/>
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-60 h-60 bg-amber-600/10 blob" style={{animationDelay:'4s'}}/>
        <ParticleField count={14} />
        <div className="relative max-w-4xl mx-auto px-4 text-center reveal">
          <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-4">✨ Exclusive Benefits ✨</p>
          <h2 className="text-5xl font-light mb-5" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>
            Amigo <em className="gold-shimmer not-italic">Loyalty</em> Program
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-6"/>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto text-lg">Silver, Gold &amp; Platinum tiers with exclusive perks, priority upgrades, and today's special events.</p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {['🥈 Silver Circle','🥇 Gold Prestige','💎 Platinum Elite'].map(t => (
              <div key={t} className="bg-white/10 border border-white/20 rounded-full px-5 py-2 text-sm font-semibold backdrop-blur hover:bg-white/20 transition hover:scale-105 cursor-default">{t}</div>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            <span className="text-amber-300 text-sm font-semibold">5 Special Events Happening Today in Chennai!</span>
          </div>
          <div className="flex justify-center">
            <button onClick={() => setShowLoyalty(true)} className="loyalty-btn btn-magnetic bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-10 py-4 rounded-full text-base">
              View Events &amp; Join Program 🎉
            </button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-white text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at center top, rgba(251,191,36,0.08) 0%, transparent 70%)'}}/>
        <div className="relative max-w-3xl mx-auto px-4 reveal">
          <p className="text-amber-500 text-xs font-bold tracking-[0.25em] uppercase mb-4">✦ Book Your Stay ✦</p>
          <h2 className="text-5xl font-light mb-5 text-gray-900" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>
            Ready to Experience <em className="text-amber-500 italic">True Luxury?</em>
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-6"/>
          <p className="text-gray-400 mb-10 text-lg">Join thousands of guests who've discovered Chennai's finest hotel. Your extraordinary stay awaits.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/rooms" className="cta-link btn-magnetic btn-elastic inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-10 py-4 rounded-full text-lg shadow-lg shadow-amber-200">
              🛏️ Browse Rooms
            </Link>
            <Link to="/spa" className="cta-link btn-magnetic btn-elastic inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-10 py-4 rounded-full text-lg">
              🌿 Explore Spa
            </Link>
          </div>
          {/* Trust logos strip */}
          <div className="flex flex-wrap justify-center gap-6 mt-14 opacity-40">
            {['🏆 Forbes 5★','⭐ TripAdvisor Excellence','🍽️ Michelin Guide','🌍 Condé Nast','🏅 World Travel Awards'].map(t => (
              <span key={t} className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {activeAmenity && <AmenityModal amenity={activeAmenity} onClose={() => setActiveAmenity(null)}/>}
      {showLoyalty && <LoyaltyModal onClose={() => setShowLoyalty(false)}/>}

      {/* ── Back to Top Button ── */}
      <button
        className={`btt-btn ${showBackToTop ? 'btt-visible' : 'btt-hidden'}`}
        onClick={scrollToTop}
        aria-label="Scroll back to top"
      >
        <span className="btt-label">Top</span>
        ↑
      </button>
    </div>
  );
}
