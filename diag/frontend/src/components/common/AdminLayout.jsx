/**
 * AdminLayout.jsx — Obsidian & Champagne Gold luxury admin shell
 * Aesthetic: Deep dark sidebar with liquid gold accents, glass morphism header
 * Font: Cormorant Garamond (display) + DM Sans (UI)
 */
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin',                   icon: 'dashboard', label: 'Dashboard'        },
  { to: '/admin/rooms',             icon: 'rooms',     label: 'Rooms'            },
  { to: '/admin/bookings',          icon: 'booking',   label: 'Room Booking'     },
  { to: '/admin/spa-bookings',      icon: 'spa',       label: 'Spa Booking'      },
  { to: '/admin/cities',            icon: 'city',      label: 'Cities & Hotels'  },
  { to: '/admin/checkin-requests',  icon: 'checkin',   label: 'Check-In'         },
  { to: '/admin/checkout-requests', icon: 'checkout',  label: 'Check-Out'        },
  { to: '/admin/membership',        icon: 'member',    label: 'Membership'       },
  { to: '/admin/loyalty',           icon: 'loyalty',   label: 'Loyalty Programs' },
  { to: '/admin/rate-overrides',    icon: 'rates',     label: 'Rate Overrides'   },
  { to: '/admin/users',             icon: 'users',     label: 'Users'            },
];

const NAV_GROUPS = [
  { label: 'Operations', icons: ['dashboard','rooms','booking','spa'] },
  { label: 'Management', icons: ['city','checkin','checkout'] },
  { label: 'Programs',   icons: ['member','loyalty','rates'] },
  { label: 'System',     icons: ['users'] },
];

const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8"/></>,
  rooms:     <><path d="M3 22V8l9-5 9 5v14"/><path d="M9 22V14h6v8"/><path d="M3 10h18"/></>,
  booking:   <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></>,
  spa:       <path d="M12 22c-4 0-8-4.5-8-9 0-3 1.8-5.7 4.5-7.2a.5.5 0 01.7.6C9 8 10 10 12 12c2-2 3-4 3.3-5.6a.5.5 0 01.7-.6C19.2 7.3 21 10 21 13c0 4.5-4 9-9 9z"/>,
  city:      <><path d="M3 22V9l7-7h4l7 7v13"/><path d="M9 22v-7h6v7"/><path d="M9 11h6"/></>,
  checkin:   <><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></>,
  checkout:  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
  member:    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>,
  loyalty:   <path d="M20.8 4.6a5.5 5.5 0 00-7.7 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21.2l7.7-7.7 1.1-1.1a5.5 5.5 0 000-7.8z"/>,
  rates:     <><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
  users:     <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
};

function NavIcon({ icon }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {ICONS[icon]}
    </svg>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#c9a84c;--gold-l:#e8c97a;--gold-d:#9b7a2e;--gold-glow:rgba(201,168,76,.22);
  --ob:#0c0f16;--ink:#111827;--ink-s:#1e293b;--slate:#94a3b8;
  --mist:#f5f6fa;--border:#edf0f4;--card:#ffffff;
  --em:#10b981;--er:#f43f5e;--ei:#6366f1;--ea:#f59e0b;
}
.adm{font-family:'DM Sans',sans-serif;min-height:100vh;background:var(--mist);color:var(--ink)}
.adm-serif{font-family:'Cormorant Garamond',serif}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-thumb{background:rgba(148,163,184,.2);border-radius:99px}
@keyframes sideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes pageIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
@keyframes popIn{from{opacity:0;transform:scale(.88) translateY(10px)}to{opacity:1;transform:none}}
@keyframes slidePop{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}
@keyframes shimmer{0%{background-position:-700px 0}100%{background-position:700px 0}}
@keyframes goldPulse{0%,100%{box-shadow:0 0 0 0 var(--gold-glow)}60%{box-shadow:0 0 0 9px transparent}}
@keyframes statFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes ringFill{from{stroke-dashoffset:283}to{stroke-dashoffset:var(--ring-d,50)}}
@keyframes barUp{from{transform:scaleY(0);transform-origin:bottom}to{transform:scaleY(1)}}
@keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes progressFill{from{width:0}to{width:var(--pw,50%)}}
.adm-page{animation:pageIn .42s cubic-bezier(.16,1,.3,1) both}
.adm-fadein{animation:fadeUp .36s cubic-bezier(.16,1,.3,1) both}
.adm-scalein{animation:scaleIn .28s cubic-bezier(.16,1,.3,1) both}
.adm-popin{animation:popIn .3s cubic-bezier(.16,1,.3,1) both}
.adm-slideright{animation:slidePop .3s cubic-bezier(.16,1,.3,1) both}
.adm-countup{animation:countUp .44s cubic-bezier(.16,1,.3,1) both}
.adm-shimmer{background:linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%);background-size:700px 100%;animation:shimmer 1.6s ease infinite}
.adm-gold-dot{animation:goldPulse 2.8s ease infinite}
.d1{animation-delay:.04s}.d2{animation-delay:.08s}.d3{animation-delay:.13s}.d4{animation-delay:.17s}
.d5{animation-delay:.21s}.d6{animation-delay:.25s}.d7{animation-delay:.30s}.d8{animation-delay:.34s}
.adm-card{background:var(--card);border:1px solid var(--border);border-radius:18px;box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 10px rgba(0,0,0,.03);transition:box-shadow .22s,transform .22s,border-color .22s}
.adm-card:hover{box-shadow:0 6px 28px rgba(0,0,0,.09);transform:translateY(-2px)}
.adm-card-gold:hover{border-color:rgba(201,168,76,.3);box-shadow:0 6px 28px rgba(201,168,76,.1)}
.adm-stat{position:relative;overflow:hidden;cursor:pointer;background:var(--card);border-radius:18px;border:1px solid var(--border);padding:22px 20px;transition:all .24s cubic-bezier(.16,1,.3,1);box-shadow:0 2px 8px rgba(0,0,0,.04)}
.adm-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--stat-c,var(--gold));border-radius:18px 18px 0 0;opacity:0;transition:opacity .2s}
.adm-stat:hover::before{opacity:1}
.adm-stat:hover{transform:translateY(-3px);box-shadow:0 14px 36px rgba(0,0,0,.1)}
.adm-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-family:'DM Sans',sans-serif;font-weight:600;border-radius:11px;cursor:pointer;transition:all .18s;border:none;font-size:13px;padding:9px 18px;white-space:nowrap}
.adm-btn-gold{background:linear-gradient(135deg,#c9a84c,#9b7a2e);color:#fff8e7;box-shadow:0 3px 12px rgba(201,168,76,.3)}
.adm-btn-gold:hover{transform:translateY(-1.5px);box-shadow:0 6px 20px rgba(201,168,76,.42);filter:brightness(1.06)}
.adm-btn-ghost{background:#f8fafc;color:#475569;border:1px solid #e2e8f0}
.adm-btn-ghost:hover{background:#f1f5f9;color:#1e293b;border-color:#d1d9e6}
.adm-btn-danger{background:#fff1f2;color:#dc2626;border:1px solid #fecaca}
.adm-btn-danger:hover{background:#ffe4e6;transform:translateY(-1px)}
.adm-btn-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.adm-btn-success:hover{background:#dcfce7;transform:translateY(-1px)}
.adm-btn-dark{background:var(--ink);color:#fff}
.adm-btn-dark:hover{background:#1e293b;transform:translateY(-1px)}
.adm-input{font-family:'DM Sans',sans-serif;font-size:13.5px;color:var(--ink);background:#fff;border:1.5px solid #e2e8f0;border-radius:11px;padding:9.5px 13px;width:100%;transition:border-color .18s,box-shadow .18s;outline:none}
.adm-input:focus{border-color:var(--gold);box-shadow:0 0 0 3.5px rgba(201,168,76,.13)}
.adm-input::placeholder{color:#bec8d5}
textarea.adm-input{resize:vertical;min-height:76px}
select.adm-input{cursor:pointer}
.adm-label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#94a3b8;margin-bottom:5px}
.tag{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px}
.tag-confirmed{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0}
.tag-pending{background:#fef9c3;color:#854d0e;border:1px solid #fef08a}
.tag-cancelled{background:#fee2e2;color:#b91c1c;border:1px solid #fecaca}
.tag-checked_in{background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe}
.tag-checked_out{background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb}
.tag-silver{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
.tag-gold{background:#fffbeb;color:#92400e;border:1px solid #fde68a}
.tag-platinum{background:#f5f3ff;color:#5b21b6;border:1px solid #ddd6fe}
.adm-overlay{position:fixed;inset:0;background:rgba(10,13,18,.72);backdrop-filter:blur(6px);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px}
.adm-modal{background:#fff;border-radius:22px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.28),0 0 0 1px rgba(201,168,76,.15);animation:popIn .3s cubic-bezier(.16,1,.3,1) both}
.adm-modal-lg{max-width:820px}
.adm-table{width:100%;border-collapse:collapse;font-size:12.5px}
.adm-table th{padding:10px 16px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.09em;background:#fafbfc;border-bottom:1px solid #f1f5f9}
.adm-table td{padding:11px 16px;border-bottom:1px solid #f8fafc;color:var(--ink-s);vertical-align:middle}
.adm-table tr:last-child td{border-bottom:none}
.adm-table tr:hover td{background:#fafbfc}
.adm-tabs{display:flex;gap:4px;background:#f1f5f9;border-radius:13px;padding:4px}
.adm-tab{flex:1;padding:8px 16px;border-radius:9px;font-size:12.5px;font-weight:600;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;color:#64748b;background:transparent}
.adm-tab.active{background:#fff;color:var(--ink);box-shadow:0 2px 8px rgba(0,0,0,.09)}
.adm-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.28),transparent);border:none;margin:8px 0}
`;

export default function AdminLayout({ children, title, subtitle }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isActive = p => p === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(p);
  const timeStr = time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  const dateStr = time.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });

  const SBW = collapsed ? 62 : 228;

  const grouped = NAV_GROUPS.map(g => ({
    label: g.label,
    items: NAV.filter(n => g.icons.includes(n.icon)),
  }));

  const sidebar = (
    <aside style={{position:'fixed',top:0,bottom:0,left:open?0:undefined,width:SBW,background:'linear-gradient(180deg,#0c0f16 0%,#101520 50%,#0a0e17 100%)',display:'flex',flexDirection:'column',zIndex:40,borderRight:'1px solid rgba(255,255,255,.04)',transition:'width .28s cubic-bezier(.16,1,.3,1)',boxShadow:'4px 0 30px rgba(0,0,0,.2)'}} className="adm-sidebar-inner">
      {/* Brand */}
      <div style={{padding:collapsed?'18px 0 14px':'18px 16px 14px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',alignItems:'center',justifyContent:collapsed?'center':'flex-start',gap:10,overflow:'hidden'}}>
        <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:'linear-gradient(135deg,#c9a84c,#7a5c20)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(201,168,76,.35)',fontSize:17}}>🏨</div>
        {!collapsed && (
          <div style={{overflow:'hidden'}}>
            <p style={{color:'#c9a84c',fontSize:13.5,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:'.06em',lineHeight:1.1}}>AMIGO</p>
            <p style={{color:'#2d3748',fontSize:9,letterSpacing:'.18em',textTransform:'uppercase',marginTop:1}}>Admin Console</p>
          </div>
        )}
      </div>
      {/* Clock */}
      {!collapsed && (
        <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,.035)'}}>
          <p style={{color:'rgba(255,255,255,.85)',fontSize:17,fontWeight:600,fontVariantNumeric:'tabular-nums',letterSpacing:'.03em'}}>{timeStr}</p>
          <p style={{color:'#374151',fontSize:10,marginTop:1}}>{dateStr}</p>
        </div>
      )}
      {/* Nav */}
      <nav style={{flex:1,padding:'8px 0 6px',overflowY:'auto',overflowX:'hidden'}}>
        {grouped.map(({ label, items }) => (
          <div key={label} style={{marginBottom:2}}>
            {!collapsed && <p style={{color:'#2a3241',fontSize:8.5,fontWeight:800,letterSpacing:'.22em',textTransform:'uppercase',padding:'8px 16px 4px'}}>{label}</p>}
            {items.map(({ to, icon, label: lbl }, i) => {
              const active = isActive(to);
              return (
                <Link key={to} to={to} title={collapsed ? lbl : undefined}
                  style={{display:'flex',alignItems:'center',gap:9,padding:collapsed?'9px 0':'8.5px 12px',justifyContent:collapsed?'center':'flex-start',margin:collapsed?'1px 5px':'1px 7px',borderRadius:10,fontSize:12.5,fontWeight:active?600:500,textDecoration:'none',borderLeft:active&&!collapsed?'2px solid #c9a84c':'2px solid transparent',background:active?'linear-gradient(90deg,rgba(201,168,76,.17),rgba(201,168,76,.03))':'transparent',color:active?'#e8c97a':'#4e5a68',transition:'all .16s ease',animation:`sideIn .28s cubic-bezier(.16,1,.3,1) ${i*.03}s both`}}
                  onMouseEnter={e=>{ if(!active){e.currentTarget.style.background='rgba(255,255,255,.04)';e.currentTarget.style.color='#9ca3af';}}}
                  onMouseLeave={e=>{ if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#4e5a68';}}}>
                  <NavIcon icon={icon}/>
                  {!collapsed && <span style={{flex:1,whiteSpace:'nowrap'}}>{lbl}</span>}
                  {active && !collapsed && <span style={{width:5,height:5,borderRadius:'50%',background:'#c9a84c',flexShrink:0}} className="adm-gold-dot"/>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {/* Footer */}
      <div style={{padding:'6px',borderTop:'1px solid rgba(255,255,255,.04)'}}>
        {!collapsed && (
          <div style={{display:'flex',alignItems:'center',gap:9,padding:'7px 10px',marginBottom:3}}>
            <div style={{width:28,height:28,borderRadius:99,background:'linear-gradient(135deg,#c9a84c,#7a5c20)',color:'#fff8e7',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:11,flexShrink:0}}>{user?.name?.[0]?.toUpperCase()||'A'}</div>
            <div style={{minWidth:0}}>
              <p style={{color:'rgba(255,255,255,.78)',fontSize:11.5,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||'Admin'}</p>
              <p style={{color:'#374151',fontSize:9.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</p>
            </div>
          </div>
        )}
        <button onClick={()=>setCollapsed(c=>!c)} style={{display:'flex',alignItems:'center',justifyContent:collapsed?'center':'flex-start',gap:7,padding:'6px 10px',width:'100%',borderRadius:8,fontSize:11,color:'#4b5563',background:'none',border:'none',cursor:'pointer',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.05)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{collapsed?<path d="M9 18l6-6-6-6"/>:<path d="M15 18l-6-6 6-6"/>}</svg>
          {!collapsed && <span>Collapse</span>}
        </button>
        <button onClick={async()=>{await logout();navigate('/');}} style={{display:'flex',alignItems:'center',justifyContent:collapsed?'center':'flex-start',gap:7,padding:'6px 10px',borderRadius:8,fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer',width:'100%',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,.08)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="adm">
      <style>{CSS}</style>
      <style>{`
        @media(min-width:1024px){.adm-sidebar-inner{transform:none!important;left:0!important}}
        @media(max-width:1023px){.adm-sidebar-inner{left:0;transform:translateX(-100%);width:228px!important}.adm-sidebar-inner.sidebar-open{transform:translateX(0)}.adm-main-shell{margin-left:0!important}.adm-hamburger{display:flex!important}}
      `}</style>
      {open && <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:39}}/>}
      {sidebar}
      <div className="adm-main-shell" style={{marginLeft:SBW,display:'flex',flexDirection:'column',minHeight:'100vh',transition:'margin-left .28s cubic-bezier(.16,1,.3,1)'}}>
        <header style={{position:'sticky',top:0,zIndex:20,background:'rgba(245,246,250,.95)',backdropFilter:'blur(20px)',borderBottom:'1px solid #edf0f4',padding:'12px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 1px 0 rgba(0,0,0,.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button className="adm-hamburger" onClick={()=>setOpen(true)} style={{display:'none',padding:8,background:'none',border:'none',cursor:'pointer',borderRadius:9,color:'#64748b'}} onMouseEnter={e=>{e.currentTarget.style.background='#f1f5f9'}} onMouseLeave={e=>{e.currentTarget.style.background=''}}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </button>
            <div>
              {title && <h1 className="adm-serif" style={{fontSize:21,fontWeight:700,color:'#0f172a',lineHeight:1.15}}>{title}</h1>}
              {subtitle && <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>{subtitle}</p>}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:6,background:'#fff',border:'1px solid #e8edf3',borderRadius:99,padding:'5px 14px',fontSize:11,color:'#94a3b8'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',flexShrink:0}}/>
              <span style={{color:'#c9a84c',fontWeight:700}}>{location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())||'Dashboard'}</span>
            </div>
            <Link to="/" style={{display:'flex',alignItems:'center',gap:5,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:99,padding:'5px 12px',fontSize:11,color:'#64748b',textDecoration:'none',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.background='#f1f5f9'}} onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc'}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Site
            </Link>
            <div style={{width:34,height:34,borderRadius:99,background:'linear-gradient(135deg,#c9a84c,#7a5c20)',color:'#fff8e7',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,boxShadow:'0 2px 8px rgba(201,168,76,.28)'}}>{user?.name?.[0]?.toUpperCase()||'A'}</div>
          </div>
        </header>
        <main style={{flex:1,padding:'24px 28px'}}>
          <div className="adm-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
