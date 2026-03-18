/**
 * MembershipPage.jsx — /membership
 * Step-based membership purchase: Browse → Details → Payment → Card
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { membershipAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Membership Card (ID-card style) ──────────────────── */
function MembershipCard({ membership, onClose }) {
  const snap = membership.packageSnapshot || {};
  const expiry = membership.expiresAt
    ? new Date(membership.expiresAt).toLocaleDateString('en-IN', { month:'short', year:'numeric' })
    : '—';
  const issued = membership.createdAt
    ? new Date(membership.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : '—';

  const gradMap = {
    silver:   'linear-gradient(135deg,#8a9bb0 0%,#64748b 40%,#475569 100%)',
    gold:     'linear-gradient(135deg,#f6d365 0%,#f0a800 40%,#c97d00 100%)',
    platinum: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 40%,#4c1d95 100%)',
  };
  const gradient = gradMap[membership.tier] || gradMap.silver;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <style>{`
          @keyframes cardFlip { 0%{transform:perspective(800px) rotateY(-90deg) scale(0.8);opacity:0} 100%{transform:perspective(800px) rotateY(0deg) scale(1);opacity:1} }
          @keyframes shine { 0%{left:-80%} 100%{left:130%} }
          .membership-card-anim { animation: cardFlip 0.65s cubic-bezier(0.16,1,0.3,1) forwards; }
          .shine-overlay { position:absolute;inset:0;overflow:hidden;border-radius:20px;pointer-events:none; }
          .shine-overlay::after { content:'';position:absolute;top:-50%;width:40%;height:200%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);animation:shine 2.5s ease 0.8s forwards; }
        `}</style>

        {/* THE CARD */}
        <div className="membership-card-anim relative rounded-2xl overflow-hidden shadow-2xl mb-4" style={{background:gradient,minHeight:'220px',fontFamily:"'DM Sans',sans-serif"}}>
          <div className="shine-overlay"/>
          {/* Decorative circles */}
          <div style={{position:'absolute',top:'-40px',right:'-40px',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(255,255,255,0.07)'}}/>
          <div style={{position:'absolute',bottom:'-30px',left:'-30px',width:'140px',height:'140px',borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>

          <div className="relative p-7">
            {/* Header row */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/60 text-xs tracking-[0.25em] uppercase mb-1">Amigo Hotels</p>
                <p className="text-white font-bold text-xl tracking-wide">{snap.name || 'Membership'}</p>
              </div>
              <span style={{fontSize:'2.5rem',lineHeight:1}}>{snap.icon || '🥈'}</span>
            </div>

            {/* Member name */}
            <div className="mb-5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Card Holder</p>
              <p className="text-white text-lg font-semibold tracking-wide">{membership.fullName}</p>
            </div>

            {/* Bottom row */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Member Since</p>
                <p className="text-white font-mono text-sm">{issued}</p>
              </div>
              <div className="text-center">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Free Bookings</p>
                <p className="text-white font-bold text-xl">{membership.freeBookingsRemaining}</p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Valid Till</p>
                <p className="text-white font-mono text-sm">{expiry}</p>
              </div>
            </div>
          </div>

          {/* Card ID strip */}
          <div className="bg-black/30 px-7 py-2.5 flex items-center justify-between">
            <p className="text-white/70 font-mono text-xs tracking-widest">{membership.membershipId}</p>
            <div className="flex gap-0.5">{[...Array(8)].map((_,i)=><div key={i} style={{width:3,height:18,background:'rgba(255,255,255,0.18)',borderRadius:2}}/>)}</div>
          </div>
        </div>

        {/* Benefits list */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-lg">
          <p className="font-bold text-gray-800 mb-3">✅ Your Active Benefits</p>
          <div className="grid grid-cols-1 gap-1.5">
            {(snap.benefits || []).map(b => (
              <div key={b} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500 flex-shrink-0">✓</span>{b}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-3 text-sm">
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-amber-600 font-bold text-xl">{membership.freeBookingsRemaining}</p>
              <p className="text-gray-500 text-xs">Free Bookings Left</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-green-600 font-bold text-sm">₹{(snap.price||0).toLocaleString('en-IN')}</p>
              <p className="text-gray-500 text-xs">Amount Paid</p>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded-xl transition text-sm">
          Start Exploring →
        </button>
      </div>
    </div>
  );
}

/* ─── Payment sim ──────────────────────────────────────── */
function PaymentSim({ amount, onSuccess, onBack }) {
  const [method, setMethod] = useState('card');
  const [paying, setPaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePay = () => {
    setPaying(true);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) { clearInterval(iv); setProgress(100); setTimeout(onSuccess, 400); return; }
      setProgress(p);
    }, 200);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <h3 className="font-bold text-gray-800 text-lg mb-4">💳 Secure Payment</h3>

      <div className="flex gap-3 mb-5">
        {[{k:'card',l:'💳 Card'},{k:'upi',l:'📱 UPI'},{k:'netbanking',l:'🏦 Net Banking'}].map(m=>(
          <button key={m.k} onClick={()=>setMethod(m.k)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${method===m.k?'bg-amber-400 border-amber-400 text-gray-900':'border-gray-200 text-gray-600 hover:border-amber-300'}`}>
            {m.l}
          </button>
        ))}
      </div>

      {method === 'card' && (
        <div className="space-y-3 mb-4">
          <input className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="1234 5678 9012 3456" defaultValue="4111 1111 1111 1111"/>
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="MM / YY" defaultValue="12/27"/>
            <input className="border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="CVV" defaultValue="123"/>
          </div>
        </div>
      )}
      {method === 'upi' && (
        <div className="mb-4">
          <input className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="yourname@upi" defaultValue="demo@oksbi"/>
        </div>
      )}
      {method === 'netbanking' && (
        <div className="mb-4">
          <select className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none">
            <option>SBI — State Bank of India</option>
            <option>HDFC Bank</option>
            <option>ICICI Bank</option>
            <option>Axis Bank</option>
          </select>
        </div>
      )}

      {paying && (
        <div className="mb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-200" style={{width:`${progress}%`}}/>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 text-center">{progress < 100 ? 'Processing payment…' : '✅ Payment Confirmed!'}</p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-700">
        <p className="font-bold">Amount to pay: ₹{amount.toLocaleString('en-IN')}</p>
        <p className="text-xs text-amber-600 mt-0.5">🔒 256-bit SSL encrypted · Demo mode</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">← Back</button>
        <button onClick={handlePay} disabled={paying}
          className="flex-[2] bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 rounded-xl transition disabled:opacity-60 text-sm">
          {paying ? `Processing ${Math.floor(progress)}%…` : `Pay ₹${amount.toLocaleString('en-IN')} →`}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function MembershipPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [packages, setPackages]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [step, setStep]             = useState('browse'); // browse | details | payment | card
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [form, setForm]             = useState({ fullName:'', email:'', phone:'', dob:'', address:'' });
  const [membership, setMembership] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from user if available
  useEffect(() => {
    if (user) setForm(f => ({ ...f, fullName: user.name || '', email: user.email || '' }));
  }, [user]);

  useEffect(() => {
    membershipAPI.getPackages()
      .then(r => setPackages(r.data.data.packages || []))
      .catch(() => toast.error('Could not load membership packages'))
      .finally(() => setLoading(false));

    // If redirected with ?tier=gold etc
    const params = new URLSearchParams(location.search);
    const t = params.get('tier');
    if (t) {
      // Will be applied once packages load
      const timer = setTimeout(() => {
        setPackages(prev => {
          const pkg = prev.find(p => p.tier === t);
          if (pkg) { setSelectedPkg(pkg); setStep('details'); }
          return prev;
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  const handleSelectPkg = (pkg) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setSelectedPkg(pkg);
    setStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDetailsNext = () => {
    if (!form.fullName || !form.email || !form.phone) { toast.error('Please fill in all required fields'); return; }
    setStep('payment');
  };

  const handlePaymentSuccess = async () => {
    setSubmitting(true);
    try {
      const { data } = await membershipAPI.purchase({
        tier: selectedPkg.tier,
        fullName: form.fullName, email: form.email,
        phone: form.phone, dob: form.dob, address: form.address,
        paymentRef: `DEMO-${Date.now()}`,
      });
      setMembership(data.data.membership);
      setStep('card');
      toast.success('🎉 Membership activated!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Purchase failed');
    } finally { setSubmitting(false); }
  };

  const tierOrder = { silver: 0, gold: 1, platinum: 2 };
  const sorted = [...packages].sort((a,b) => tierOrder[a.tier] - tierOrder[b.tier]);

  const gradients = {
    silver:   'linear-gradient(135deg,#8a9bb0,#64748b)',
    gold:     'linear-gradient(135deg,#f6d365,#f0a800)',
    platinum: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4" style={{background:'linear-gradient(135deg,#fdf8ef 0%,#faf3e4 100%)'}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes shimmer-pkg{0%{background-position:-300% 0}100%{background-position:300% 0}}
        @keyframes glow-silver{0%,100%{box-shadow:0 0 0 0 rgba(148,163,184,.4)}50%{box-shadow:0 0 24px 4px rgba(148,163,184,.25)}}
        @keyframes glow-gold{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,.4)}50%{box-shadow:0 0 28px 6px rgba(251,191,36,.3)}}
        @keyframes glow-platinum{0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,.4)}50%{box-shadow:0 0 32px 8px rgba(167,139,250,.3)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes popBadge{from{opacity:0;transform:scale(0.6) rotate(-8deg)}60%{transform:scale(1.12) rotate(2deg)}to{opacity:1;transform:scale(1) rotate(0)}}
        @keyframes headerReveal{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        .pkg-card{animation:fadeUp 0.52s cubic-bezier(0.16,1,0.3,1) both}
        .pkg-card:nth-child(1){animation-delay:.04s}.pkg-card:nth-child(2){animation-delay:.13s}.pkg-card:nth-child(3){animation-delay:.22s}
        .pkg-card{transition:transform .38s cubic-bezier(.34,1.56,.64,1),box-shadow .38s ease,border-color .25s}
        .pkg-card:hover{transform:translateY(-10px) scale(1.025)}
        .pkg-card.silver:hover{box-shadow:0 28px 56px rgba(148,163,184,.25)}
        .pkg-card.gold:hover{box-shadow:0 28px 56px rgba(251,191,36,.3)}
        .pkg-card.platinum:hover{box-shadow:0 28px 56px rgba(167,139,250,.35)}
        .pkg-card.gold{animation:glow-gold 3s ease-in-out 0.6s infinite,fadeUp 0.52s cubic-bezier(0.16,1,0.3,1) .13s both}
        .pkg-card.popular-badge{animation:popBadge .5s cubic-bezier(.34,1.56,.64,1) .4s both}
        .pkg-icon{animation:float 3s ease-in-out infinite}
        .pkg-header{animation:headerReveal .5s cubic-bezier(.16,1,.3,1) both}
        .benefit-item{transition:all .2s ease}
        .benefit-item:hover{transform:translateX(4px)}
        .select-btn{transition:all .25s cubic-bezier(.34,1.56,.64,1)}
        .select-btn:hover{transform:translateY(-3px) scale(1.05)}
        .select-btn:active{transform:scale(.97)}
      `}</style>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{fontFamily:"'Cinzel',serif"}}>✨ Exclusive Privileges</p>
          <h1 className="text-4xl font-light text-gray-900 mb-3" style={{fontFamily:"'Playfair Display',Georgia,serif"}}>
            Amigo <em className="text-amber-500 italic">Membership</em>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">Choose your tier and unlock exclusive free bookings, dining discounts, and premium benefits.</p>
        </div>

        {/* Breadcrumb steps */}
        <div className="flex items-center justify-center gap-2 mb-8 text-xs font-semibold">
          {[{k:'browse',l:'Choose Plan'},{k:'details',l:'Your Details'},{k:'payment',l:'Payment'},{k:'card',l:'Your Card'}].map((s,i,arr)=>(
            <React.Fragment key={s.k}>
              <span className={step===s.k?'text-amber-600 font-bold':'text-gray-400'}>{s.l}</span>
              {i<arr.length-1 && <span className="text-gray-300">›</span>}
            </React.Fragment>
          ))}
        </div>

        {/* STEP: Browse packages */}
        {step === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sorted.map(pkg => (
              <div key={pkg.tier} className={`pkg-card ${pkg.tier} bg-white rounded-2xl overflow-hidden border shadow-sm cursor-pointer ${pkg.tier==="gold"?"border-amber-200":"border-gray-100"}`}>
                {/* Card header with gradient */}
                <div className="p-6 text-white" style={{background:gradients[pkg.tier]}}>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{fontSize:'2.5rem'}}>{pkg.icon}</span>
                    {pkg.tier === 'gold' && <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">POPULAR</span>}
                    {pkg.tier === 'platinum' && <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">BEST VALUE</span>}
                  </div>
                  <h3 className="font-bold text-xl mb-1">{pkg.name}</h3>
                  <p className="text-white/75 text-sm">{pkg.freeBookings} free room bookings</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">₹{(pkg.price||0).toLocaleString('en-IN')}</span>
                    <span className="text-white/60 text-sm"> /year</span>
                  </div>
                </div>
                {/* Benefits */}
                <div className="p-5">
                  <div className="space-y-2 mb-5">
                    {(pkg.benefits || []).map(b => (
                      <div key={b} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>{b}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleSelectPkg(pkg)}
                    className="w-full py-3 rounded-xl font-bold text-sm transition"
                    style={{background:gradients[pkg.tier],color:'#fff'}}>
                    Get {pkg.name} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP: Personal details */}
        {step === 'details' && selectedPkg && (
          <div className="max-w-lg mx-auto">
            {/* Selected package mini preview */}
            <div className="rounded-2xl p-5 text-white mb-6 flex items-center gap-4" style={{background:gradients[selectedPkg.tier]}}>
              <span style={{fontSize:'2.5rem'}}>{selectedPkg.icon}</span>
              <div>
                <h3 className="font-bold text-lg">{selectedPkg.name}</h3>
                <p className="text-white/75 text-sm">{selectedPkg.freeBookings} free bookings · ₹{(selectedPkg.price||0).toLocaleString('en-IN')}/year</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border shadow-sm">
              <h3 className="font-bold text-gray-800 text-lg mb-4">📋 Personal Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                    <input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="Your full name"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                    <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="you@example.com"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone *</label>
                    <input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="+91 98765 43210"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                    <input type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                  <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="Your home address"/>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={()=>setStep('browse')} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">← Back</button>
                <button onClick={handleDetailsNext}
                  disabled={!form.fullName||!form.email||!form.phone}
                  className="flex-[2] bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 rounded-xl transition disabled:opacity-50 text-sm">
                  Continue to Payment →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP: Payment */}
        {step === 'payment' && selectedPkg && (
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-5 text-white mb-6 flex items-center gap-4" style={{background:gradients[selectedPkg.tier]}}>
              <span style={{fontSize:'2.5rem'}}>{selectedPkg.icon}</span>
              <div>
                <h3 className="font-bold text-lg">{selectedPkg.name}</h3>
                <p className="text-white/75 text-sm">For {form.fullName}</p>
              </div>
            </div>
            <PaymentSim amount={selectedPkg.price} onSuccess={handlePaymentSuccess} onBack={()=>setStep('details')}/>
          </div>
        )}

        {/* STEP: Membership Card */}
        {step === 'card' && membership && (
          <MembershipCard membership={membership} onClose={() => navigate('/')} />
        )}
      </div>
    </div>
  );
}
