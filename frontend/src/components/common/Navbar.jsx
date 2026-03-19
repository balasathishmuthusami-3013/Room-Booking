/**
 * Navbar.jsx — Logo left · Search center · Menu right
 * Search dropdown is position:absolute under input, same width, no shift.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI } from '../../services/api';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TN_CITIES = [
  { code:'MAA', name:'Chennai',    tagline:'Gateway of South India',    emoji:'🌆' },
  { code:'CJB', name:'Coimbatore', tagline:'Manchester of South India', emoji:'🏙️' },
  { code:'IXM', name:'Madurai',    tagline:'City of Temples',           emoji:'🕌' },
  { code:'TRZ', name:'Trichy',     tagline:'Rock Fort City',            emoji:'🏛️' },
  { code:'SXV', name:'Salem',      tagline:'City of Mango & Steel',     emoji:'🌃' },
];

/* ─── Inline Search Bar (self-contained) ─────────────────── */
function NavSearch() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const wrapRef   = useRef(null);
  const inputRef  = useRef(null);

  const [q,        setQ]        = useState('');
  const [sugg,     setSugg]     = useState([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [hotels,   setHotels]   = useState([]);
  const [activeIdx,setActive]   = useState(-1);

  // Close on route change
  useEffect(() => { setOpen(false); setQ(''); }, [location.pathname]);

  // Load hotels once — public endpoint, no auth
  useEffect(() => {
    axios.get(`${BASE_URL}/cities/hotels/all`)
      .then(r => setHotels(r.data?.data?.hotels || []))
      .catch(() => {
        Promise.allSettled(
          TN_CITIES.map(c =>
            axios.get(`${BASE_URL}/hotels`, { params:{ city:c.code } })
              .then(r => (r.data?.data?.hotels||[]).map(h=>({...h,cityName:c.name,cityCode:c.code})))
              .catch(()=>[])
          )
        ).then(res => setHotels(res.flatMap(r=>r.status==='fulfilled'?r.value:[])));
      });
  }, []);

  // Search
  const search = useCallback((val) => {
    const t = val.trim().toLowerCase();
    if (!t) { setSugg([]); setOpen(false); return; }
    setLoading(true);
    const cities = TN_CITIES
      .filter(c => c.name.toLowerCase().includes(t) || c.code.toLowerCase()===t)
      .map(c => ({ type:'city', label:c.name, sub:c.tagline, emoji:c.emoji, data:c }));
    const hs = hotels
      .filter(h => (h.name||'').toLowerCase().includes(t) || (h.cityName||'').toLowerCase().includes(t))
      .slice(0, 5)
      .map(h => ({
        type:'hotel', label:h.name, sub:h.cityName||'', emoji:'🏨', data:h,
        exact:(h.name||'').toLowerCase()===t,
      }));
    const sorted = [...hs.filter(x=>x.exact), ...hs.filter(x=>!x.exact), ...cities].slice(0,7);
    setSugg(sorted);
    setOpen(sorted.length > 0);
    setLoading(false);
  }, [hotels]);

  useEffect(() => {
    const t = setTimeout(() => search(q), 180);
    return () => clearTimeout(t);
  }, [q, search]);

  // Close on outside click
  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setActive(-1); }};
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (item) => {
    setOpen(false); setQ(''); setActive(-1);
    if (item.type === 'city') navigate(`/hotels?city=${item.data.code}&cityName=${encodeURIComponent(item.data.name)}`);
    else { const code = item.data.cityCode||'MAA'; navigate(`/hotels?city=${code}&hotel=${encodeURIComponent(item.label)}`); }
  };

  const onKey = e => {
    if (!open) return;
    if (e.key==='ArrowDown')  { e.preventDefault(); setActive(i=>Math.min(i+1,sugg.length-1)); }
    else if (e.key==='ArrowUp') { e.preventDefault(); setActive(i=>Math.max(i-1,-1)); }
    else if (e.key==='Enter') {
      e.preventDefault();
      if (activeIdx>=0 && sugg[activeIdx]) pick(sugg[activeIdx]);
      else if (q.trim()) { navigate(`/hotels?search=${encodeURIComponent(q.trim())}`); setOpen(false); setQ(''); }
    }
    else if (e.key==='Escape') { setOpen(false); setActive(-1); }
  };

  const hl = (text, query) => {
    const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
    if (!query.trim() || i===-1) return text;
    return <>{text.slice(0,i)}<mark style={{background:'rgba(245,158,11,0.4)',color:'inherit',borderRadius:2,padding:'0 1px'}}>{text.slice(i,i+query.trim().length)}</mark>{text.slice(i+query.trim().length)}</>;
  };

  return (
    /* position:relative on wrapper is CRITICAL for dropdown alignment */
    <div ref={wrapRef} style={{ position:'relative', width:'100%' }}>

      {/* Input row */}
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        {/* Search icon — left */}
        <span style={{
          position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
          fontSize:14, color:'rgba(255,255,255,0.35)', pointerEvents:'none', zIndex:1,
        }}>🔍</span>

        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); setActive(-1); }}
          onKeyDown={onKey}
          onFocus={() => q.trim() && sugg.length>0 && setOpen(true)}
          placeholder="Search hotels or cities..."
          autoComplete="off"
          spellCheck="false"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10,
            padding: '8px 36px 8px 36px',
            fontSize: 13,
            color: '#fff',
            outline: 'none',
            transition: 'border-color .2s, box-shadow .2s',
          }}
          onFocus={e => { e.target.style.borderColor='#F59E0B'; e.target.style.boxShadow='0 0 0 2px rgba(245,158,11,0.2)'; if(q.trim()&&sugg.length>0)setOpen(true); }}
          onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.14)'; e.target.style.boxShadow='none'; }}
        />

        {/* Spinner / Clear — right */}
        {loading ? (
          <span style={{
            position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
            width:12, height:12, borderRadius:'50%',
            border:'2px solid transparent', borderTopColor:'#F59E0B',
            animation:'navSpin .7s linear infinite',
          }}/>
        ) : q ? (
          <button
            onClick={() => { setQ(''); setSugg([]); setOpen(false); inputRef.current?.focus(); }}
            style={{
              position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer',
              color:'rgba(255,255,255,0.4)', fontSize:13, lineHeight:1,
              padding:'2px 4px',
            }}
          >✕</button>
        ) : null}
      </div>

      {/* Dropdown — perfectly aligned under input */}
      {open && sugg.length>0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          width: '100%',       /* exact same width as input */
          zIndex: 99999,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          maxHeight: 380,
          overflowY: 'auto',
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}>

          {/* Hotels section */}
          {sugg.some(s=>s.type==='hotel') && (<>
            <div style={{ padding:'7px 14px 4px', background:'#f9fafb', borderBottom:'1px solid #f3f4f6' }}>
              <span style={{ fontSize:10, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>🏨 Hotels</span>
            </div>
            {sugg.filter(s=>s.type==='hotel').map((item,i) => (
              <button key={`h${i}`}
                onClick={() => pick(item)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  width:'100%', padding:'9px 14px',
                  background: activeIdx===sugg.indexOf(item) ? '#FEF3C7' : 'transparent',
                  border:'none', cursor:'pointer', textAlign:'left',
                  transition:'background .12s',
                }}
                onMouseEnter={e=>e.currentTarget.style.background='#FEF3C7'}
                onMouseLeave={e=>e.currentTarget.style.background=activeIdx===sugg.indexOf(item)?'#FEF3C7':'transparent'}
              >
                {/* Hotel icon */}
                <div style={{
                  width:30, height:30, borderRadius:8, flexShrink:0,
                  background:'linear-gradient(135deg,#F59E0B,#D97706)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
                }}>🏨</div>
                {/* Text */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {hl(item.label, q)}
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:1 }}>📍 {item.sub||'Hotel'}</div>
                </div>
                {item.exact && (
                  <span style={{ fontSize:9, color:'#059669', fontWeight:700, background:'#d1fae5', padding:'2px 6px', borderRadius:100, flexShrink:0 }}>
                    Exact
                  </span>
                )}
              </button>
            ))}
          </>)}

          {/* Cities section */}
          {sugg.some(s=>s.type==='city') && (<>
            <div style={{ padding:'7px 14px 4px', background:'#f9fafb', borderTop: sugg.some(s=>s.type==='hotel')?'1px solid #f3f4f6':'none' }}>
              <span style={{ fontSize:10, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>📍 Locations</span>
            </div>
            {sugg.filter(s=>s.type==='city').map((item,i) => (
              <button key={`c${i}`}
                onClick={() => pick(item)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  width:'100%', padding:'9px 14px',
                  background: activeIdx===sugg.indexOf(item) ? '#FEF3C7' : 'transparent',
                  border:'none', cursor:'pointer', textAlign:'left',
                  transition:'background .12s',
                }}
                onMouseEnter={e=>e.currentTarget.style.background='#FEF3C7'}
                onMouseLeave={e=>e.currentTarget.style.background=activeIdx===sugg.indexOf(item)?'#FEF3C7':'transparent'}
              >
                {/* City emoji in circle */}
                <div style={{
                  width:30, height:30, borderRadius:'50%', flexShrink:0,
                  background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:15,
                }}>{item.emoji}</div>
                {/* Text */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{hl(item.label, q)}</div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:1 }}>{item.sub}</div>
                </div>
                <span style={{ fontSize:11, color:'#F59E0B', fontWeight:600, flexShrink:0 }}>All Hotels →</span>
              </button>
            ))}
          </>)}

          {/* Footer */}
          <div style={{ padding:'5px 14px', borderTop:'1px solid #f3f4f6', background:'#fafafa' }}>
            <span style={{ fontSize:9, color:'#d1d5db' }}>↑↓ navigate · ↵ select · Esc close</span>
          </div>
        </div>
      )}

      {/* No results */}
      {open && q.trim() && sugg.length===0 && !loading && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, width:'100%', zIndex:99999,
          background:'#fff', border:'1px solid #e5e7eb', borderRadius:12,
          boxShadow:'0 16px 48px rgba(0,0,0,0.12)', padding:'16px 14px', textAlign:'center',
          fontFamily:"'DM Sans',sans-serif",
        }}>
          <p style={{ fontSize:13, color:'#6b7280', fontWeight:600, margin:'0 0 3px' }}>No results for "{q}"</p>
          <p style={{ fontSize:11, color:'#9ca3af', margin:'0 0 8px' }}>Try: Chennai, Madurai, Grand…</p>
          <div style={{ display:'flex', gap:5, justifyContent:'center', flexWrap:'wrap' }}>
            {TN_CITIES.slice(0,4).map(c=>(
              <button key={c.code} onClick={()=>{setQ(c.name);search(c.name);}}
                style={{ fontSize:11, padding:'3px 8px', borderRadius:100, background:'#FEF3C7', border:'1px solid #FDE68A', color:'#92400E', cursor:'pointer' }}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Navbar ────────────────────────────────────────── */
export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [open,         setOpen]        = useState(false);
  const [pendingCount, setPendingCount]= useState(0);
  const [scrolled,     setScrolled]    = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      bookingAPI.getMyBookings({ status:'pending', limit:10 })
        .then(({ data }) => setPendingCount(data.data.total || data.data.bookings?.length || 0))
        .catch(() => {});
    }
  }, [isAuthenticated, isAdmin, location.pathname]);

  const handleLogout  = async () => { await logout(); navigate('/'); };
  const isActive      = path => location.pathname === path;
  const handleHomeClick = e => { if (location.pathname === '/') { e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); }};

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled?'bg-gray-900/97 backdrop-blur shadow-2xl shadow-black/30':'bg-gray-900'}`}>
      <style>{`
        @keyframes navSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes mobileSlide{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .nav-link-anim{position:relative;transition:color .2s ease}
        .nav-link-anim::after{content:'';position:absolute;bottom:-2px;left:50%;right:50%;height:2px;background:#F59E0B;border-radius:2px;transition:left .35s cubic-bezier(.16,1,.3,1),right .35s cubic-bezier(.16,1,.3,1)}
        .nav-link-anim:hover::after,.nav-link-anim.is-active::after{left:8px;right:8px}
        .nav-cta{position:relative;overflow:hidden;transition:all .3s cubic-bezier(.34,1.56,.64,1)}
        .nav-cta:hover{transform:scale(1.05) translateY(-1px);box-shadow:0 6px 18px rgba(251,191,36,.3)}
        .nav-logo-em{transition:transform .4s cubic-bezier(.34,1.56,.64,1)}
        .nav-logo-em:hover{transform:scale(1.12) rotate(-4deg)}
        .nav-avatar{transition:transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease}
        .nav-avatar:hover{transform:scale(1.2) rotate(6deg);box-shadow:0 0 0 3px rgba(251,191,36,.55)}
        .pending-badge{animation:badgePing 1.5s ease-in-out infinite}
        @keyframes badgePing{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
        .mobile-slide{animation:mobileSlide .35s cubic-bezier(.16,1,.3,1) both}
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/*
          Three-column layout:
          [Logo — fixed width] [Search — flex grows] [Nav + Auth — fixed width]
        */}
        <div style={{ display:'flex', alignItems:'center', height:64, gap:16 }}>

          {/* ── Col 1: Logo ─────────────────────────── */}
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, textDecoration:'none' }}>
            <span className="nav-logo-em" style={{ fontSize:22, display:'inline-block' }}>🏨</span>
            <span style={{
              fontWeight:700, fontSize:18, color:'#FBBF24',
              fontFamily:"'Playfair Display','Cormorant Garamond',Georgia,serif",
              letterSpacing:'.06em', fontStyle:'italic', whiteSpace:'nowrap',
            }}>Hoto.tours</span>
          </Link>

          {/* ── Col 2: Search (center, grows) ────────── */}
          {!isAdmin && (
            <div className="hidden md:block" style={{ flex:1, maxWidth:340, minWidth:0 }}>
              <NavSearch />
            </div>
          )}

          {/* ── Col 3: Nav links + Auth ───────────────── */}
          <div className="hidden md:flex items-center gap-1" style={{ flexShrink:0 }}>

            <NavLink to="/" active={isActive('/')} onClick={handleHomeClick}>Home</NavLink>

            {!isAdmin && (
              <NavLink to="/hotels" active={isActive('/hotels')||isActive('/rooms')}>Hotels</NavLink>
            )}

            {isAuthenticated && !isAdmin && (
              <>
                <Link to="/bookings"
                  className={`nav-cta relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${isActive('/bookings')?'bg-amber-400 text-gray-900':'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30'}`}>
                  📋 Bookings
                  {pendingCount>0 && (
                    <span className="pending-badge absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center" style={{fontSize:9}}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
                <Link to="/spa/bookings"
                  className={`nav-cta flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${isActive('/spa/bookings')?'bg-green-500 text-white':'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30'}`}>
                  🌿 Spa
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link to="/admin" className="nav-cta flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30 transition">
                  📊 Admin
                </Link>
                <Link to="/admin/loyalty" className="nav-cta flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30 transition">
                  🏆 Loyalty
                </Link>
              </>
            )}

            {/* Auth */}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:4, paddingLeft:8, borderLeft:'1px solid rgba(255,255,255,0.1)' }}>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:8, textDecoration:'none', transition:'background .2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div className="nav-avatar" style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'#1f2937', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12 }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize:12, color:'#d1d5db', maxWidth:70, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {user?.name?.split(' ')[0]}
                    </span>
                  </Link>
                  <button onClick={handleLogout}
                    style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#d1d5db', padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#EF4444';e.currentTarget.style.borderColor='#EF4444';e.currentTarget.style.color='#fff';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.color='#d1d5db';}}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link-anim" style={{ fontSize:13, fontWeight:500, color:'#d1d5db', padding:'4px 8px', textDecoration:'none', transition:'color .2s' }}
                    onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                    onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}>
                    Login
                  </Link>
                  <Link to="/register" className="nav-cta"
                    style={{ background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'#1f2937', padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none', transition:'all .2s' }}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setOpen(!open)}
            style={{ marginLeft:'auto', background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer', padding:6 }}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mobile-slide" style={{ background:'#1f2937', borderTop:'1px solid rgba(255,255,255,0.08)', padding:'12px 16px 16px' }}>
          {/* Mobile Search */}
          {!isAdmin && (
            <div style={{ marginBottom:12 }}>
              <NavSearch />
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <MobLink to="/" onClick={e=>{setOpen(false);handleHomeClick(e);}}>🏠 Home</MobLink>
            {!isAdmin && <MobLink to="/hotels" onClick={()=>setOpen(false)}>🏨 Hotels & Rooms</MobLink>}
            {isAuthenticated && !isAdmin && (
              <>
                <MobLink to="/bookings" onClick={()=>setOpen(false)}>
                  📋 My Bookings
                  {pendingCount>0 && <span style={{marginLeft:8,background:'#EF4444',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:100}}>{pendingCount}</span>}
                </MobLink>
                <MobLink to="/spa/bookings" onClick={()=>setOpen(false)}>🌿 Spa Bookings</MobLink>
              </>
            )}
            {isAdmin && <MobLink to="/admin" onClick={()=>setOpen(false)}>📊 Admin Dashboard</MobLink>}
            {isAdmin && <MobLink to="/admin/loyalty" onClick={()=>setOpen(false)}>🏆 Loyalty Program</MobLink>}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', marginTop:8, paddingTop:8 }}>
              {isAuthenticated ? (
                <>
                  <MobLink to="/profile" onClick={()=>setOpen(false)}>👤 My Profile</MobLink>
                  <button onClick={()=>{handleLogout();setOpen(false);}}
                    style={{ width:'100%', textAlign:'left', padding:'10px 14px', fontSize:13, color:'#f87171', background:'none', border:'none', cursor:'pointer', borderRadius:8, transition:'background .2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                    onMouseLeave={e=>e.currentTarget.style.background='none'}>
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <MobLink to="/login"    onClick={()=>setOpen(false)}>Login</MobLink>
                  <MobLink to="/register" onClick={()=>setOpen(false)}>Register</MobLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

const NavLink = ({ to, active, onClick, children }) => (
  <Link to={to} onClick={onClick}
    className={`nav-link-anim px-3 py-2 rounded-lg text-sm font-medium transition ${active?'bg-gray-700 text-white is-active':'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
    {children}
  </Link>
);

const MobLink = ({ to, onClick, children }) => (
  <Link to={to} onClick={onClick}
    style={{ display:'flex', alignItems:'center', padding:'10px 14px', fontSize:13, color:'#d1d5db', textDecoration:'none', borderRadius:8, transition:'background .15s' }}
    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
    {children}
  </Link>
);
