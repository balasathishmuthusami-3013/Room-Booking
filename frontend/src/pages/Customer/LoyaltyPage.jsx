/**
 * LoyaltyPage.jsx — /loyalty
 * Shows today's events + allows joining Silver / Gold / Platinum
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TODAY_EVENTS = [
  { time:'7:00 PM – 10:00 PM', title:'🎧 DJ Night at Sky Lounge', badge:'TONIGHT', badgeColor:'bg-purple-500',
    image:'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
    desc:'International DJ ARYAN spins house & deep tech on the rooftop. Complimentary cocktail for Gold+ members.' },
  { time:'6:00 PM – 8:00 PM', title:'🥂 Members Sunset Get-Together', badge:'MEMBERS ONLY', badgeColor:'bg-amber-500',
    image:'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600',
    desc:'Exclusive poolside gathering with canapés and live acoustic set overlooking the city.' },
  { time:'9:00 AM – 11:00 AM', title:'🧘 Sunrise Yoga Retreat', badge:'FREE FOR GOLD+', badgeColor:'bg-green-500',
    image:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
    desc:'Guided vinyasa yoga on the rooftop deck. All levels welcome. Mats provided.' },
  { time:'3:00 PM – 5:00 PM', title:'🍳 Celebrity Chef Masterclass', badge:'LIMITED SLOTS', badgeColor:'bg-red-500',
    image:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
    desc:'Chef Marco teaches his famous truffle risotto. Limited to 12 members.' },
  { time:'8:00 PM – 12:00 AM', title:'🎭 Live Jazz & Gala Dinner', badge:'GALA', badgeColor:'bg-rose-600',
    image:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    desc:'5-course dinner with the Amigo Jazz Quartet. Formal attire required.' },
];

const PROGRAMS = [
  { id:'silver', name:'Silver Circle', icon:'🥈', grad:'from-gray-400 to-gray-500',
    minStays:0, tag:'Open to All',
    benefits:['5% off dining','Welcome drink on arrival','Late checkout until 1 PM','Access to member events'] },
  { id:'gold', name:'Gold Prestige', icon:'🥇', grad:'from-amber-400 to-yellow-500',
    minStays:5, tag:'5+ Stays',
    benefits:['10% off all services','Free airport transfer','Room upgrade (on availability)','All Silver benefits','Priority booking'] },
  { id:'platinum', name:'Platinum Elite', icon:'💎', grad:'from-purple-500 to-indigo-600',
    minStays:15, tag:'15+ Stays',
    benefits:['20% off everything','Personal butler service','Guaranteed suite upgrade','Private dining experience','Unlimited spa access','All Gold benefits'] },
];

function JoinModal({ program, onClose }) {
  const [step, setStep] = useState('form'); // form | success
  const [form, setForm] = useState({
    name:'', email:'', phone:'', dob:'',
    joinedAt: new Date().toLocaleString('en-IN'),
  });
  const [loading, setLoading] = useState(false);
  const valid = form.name && form.email && form.phone;

  const handleJoin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('success'); }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={step==='form'?onClose:undefined}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>

        {/* Header gradient */}
        <div className={`bg-gradient-to-r ${program.grad} p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{program.icon}</span>
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{step==='form'?'Join Program':'Welcome!'}</p>
                <h3 className="font-bold text-2xl">{program.name}</h3>
              </div>
            </div>
            {step==='form' && <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition">✕</button>}
          </div>
        </div>

        {step==='form' ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Full Name *</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your full name"
                  className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email *</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@email.com"
                  className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Mobile *</label>
                <input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 98765 43210"
                  className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Date of Birth</label>
                <input type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})}
                  className="w-full border rounded-xl px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
            </div>
            {/* Auto-generated time */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <label className="text-xs font-semibold text-amber-700 uppercase">🕐 Registration Time (Auto-generated)</label>
              <div className="flex items-center gap-2 mt-1.5">
                <input value={form.joinedAt} readOnly
                  className="flex-1 border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed font-mono"/>
                <span className="text-xs bg-amber-400 text-gray-900 font-bold px-2 py-1 rounded-lg">AUTO ✓</span>
              </div>
            </div>
            <button onClick={handleJoin} disabled={!valid||loading}
              className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"/>Joining...</>
                : `Join ${program.name} →`
              }
            </button>
          </div>
        ) : (
          <div className="p-7 text-center">
            <div className="text-7xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {form.name.split(' ')[0]}!</h3>
            <p className="text-gray-500 text-sm mb-5">You're now a <strong>{program.name}</strong> member. Your benefits are active immediately!</p>

            {/* Member card */}
            <div className={`bg-gradient-to-r ${program.grad} text-white rounded-2xl p-5 mb-4 text-left`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{program.icon}</span>
                <div><p className="font-bold text-lg">{form.name}</p><p className="text-white/70 text-sm">{program.name} Member</p></div>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white/70 text-xs mb-0.5">Member Since</p>
                <p className="font-mono text-sm font-semibold">{form.joinedAt}</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-1.5 mb-4">
              <p className="font-bold text-green-700 text-sm">✅ Active Benefits:</p>
              {program.benefits.map(b=>(
                <div key={b} className="flex items-center gap-2 text-sm text-green-700">
                  <span className="text-green-400">★</span>{b}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-4">📧 Welcome email sent to <strong>{form.email}</strong></p>
            <button onClick={onClose} className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition">
              Start Exploring →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const [joinProgram, setJoinProgram] = useState(null);
  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'repeating-linear-gradient(45deg,#C9A96E 0,#C9A96E 1px,transparent 0,transparent 50%)',backgroundSize:'20px 20px'}}/>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-3">✨ Exclusive Membership</p>
          <h1 className="text-5xl font-light mb-3" style={{fontFamily:'Georgia,serif'}}>Amigo <em className="text-amber-400">Loyalty</em></h1>
          <p className="text-gray-300 mb-2">Three tiers of privilege — Silver, Gold & Platinum</p>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm text-amber-200 font-semibold">5 Special Events Today · {today}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14 space-y-16">

        {/* Today's Events */}
        <section>
          <div className="text-center mb-8">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-2">Live Now</p>
            <h2 className="text-3xl font-bold text-gray-800" style={{fontFamily:'Georgia,serif'}}>Today's Special Events</h2>
            <p className="text-gray-400 text-sm mt-1">Exclusive for Amigo Loyalty members</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TODAY_EVENTS.map((ev,i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition group border border-gray-100">
                <div className="relative h-44 overflow-hidden">
                  <img src={ev.image} alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e=>{e.target.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';}}/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                  <span className={`absolute top-3 right-3 ${ev.badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>{ev.badge}</span>
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="font-bold text-sm leading-tight">{ev.title}</p>
                    <p className="text-amber-300 text-xs">🕐 {ev.time}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm">{ev.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Programs */}
        <section>
          <div className="text-center mb-8">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-2">Choose Your Tier</p>
            <h2 className="text-3xl font-bold text-gray-800" style={{fontFamily:'Georgia,serif'}}>Loyalty Programs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROGRAMS.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border hover:shadow-xl transition overflow-hidden group">
                {/* Card top */}
                <div className={`bg-gradient-to-r ${p.grad} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-5xl">{p.icon}</span>
                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{p.tag}</span>
                  </div>
                  <h3 className="font-bold text-2xl">{p.name}</h3>
                  <p className="text-white/70 text-sm mt-1">{p.minStays===0?'Available for all guests':`Requires ${p.minStays}+ completed stays`}</p>
                </div>
                {/* Benefits */}
                <div className="p-5 space-y-2">
                  {p.benefits.map(b=>(
                    <div key={b} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                      {b}
                    </div>
                  ))}
                  <button onClick={()=>setJoinProgram(p)}
                    className={`w-full mt-4 bg-gradient-to-r ${p.grad} text-white font-bold py-3 rounded-xl transition hover:opacity-90 hover:shadow-lg`}>
                    Join {p.name} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ strip */}
        <section className="bg-white rounded-2xl border p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {q:'How do I earn points?',a:'Every ₹100 spent on rooms, dining, or spa earns 10 loyalty points.'},
              {q:'Can I upgrade my tier?',a:'Yes! Your tier upgrades automatically when you hit the required number of stays.'},
              {q:'Do points expire?',a:'Points are valid for 24 months from the date of earning.'},
              {q:'Can I combine member discounts?',a:'Member discounts can be combined with seasonal offers, up to a maximum of 30%.'},
            ].map(({q,a})=>(
              <div key={q} className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 text-sm mb-1">{q}</p>
                <p className="text-gray-500 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {joinProgram && <JoinModal program={joinProgram} onClose={()=>setJoinProgram(null)}/>}
    </div>
  );
}
