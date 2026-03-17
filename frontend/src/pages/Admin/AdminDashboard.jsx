import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { adminAPI, bookingAPI } from '../../services/api';
import AdminLayout from '../../components/common/AdminLayout';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const GOLD = '#c9a84c';
const COLORS = [GOLD,'#10b981','#6366f1','#f43f5e','#06b6d4','#8b5cf6'];

function AnimNum({ val, prefix='', suffix='', dur=1400 }) {
  const [disp, setDisp] = useState(0);
  const n = parseFloat(String(val).replace(/[^0-9.]/g,'')) || 0;
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisp(Math.floor(ease * n));
      if (p < 1) requestAnimationFrame(step);
      else setDisp(n);
    };
    requestAnimationFrame(step);
  }, [n]);
  const formatted = typeof val === 'string' && val.includes('L')
    ? prefix + (disp/100000).toFixed(1) + 'L' + suffix
    : prefix + disp.toLocaleString('en-IN') + suffix;
  return <span>{formatted}</span>;
}

function Ring({ pct, color, size=80 }) {
  const r = 34; const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(100, pct) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7"/>
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={off}
        style={{transform:'rotate(-90deg)',transformOrigin:'50% 50%',transition:'stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1) .4s'}}/>
      <text x="40" y="45" textAnchor="middle" fill={color} fontSize="13" fontWeight="800" fontFamily="'DM Sans',sans-serif">{pct}%</text>
    </svg>
  );
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#0f172a',color:'#f8fafc',borderRadius:11,padding:'9px 14px',fontSize:11.5,boxShadow:'0 10px 28px rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.07)',fontFamily:"'DM Sans',sans-serif"}}>
      <p style={{color:'#94a3b8',marginBottom:5,fontSize:10}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color,fontWeight:600}}>
          {p.name}: {p.name==='Revenue'?'₹'+Number(p.value).toLocaleString('en-IN'):p.value}
        </p>
      ))}
    </div>
  );
};

const STATS = [
  { k:'bookings', l:'Total Bookings',  icon:'📋', color:'#c9a84c', bg:'linear-gradient(135deg,#fffbeb,#fef3c7)', link:'/admin/bookings' },
  { k:'revenue',  l:'Total Revenue',   icon:'💰', color:'#10b981', bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', link:'/admin/bookings' },
  { k:'occupied', l:'Occupied Rooms',  icon:'🛏', color:'#6366f1', bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)', link:'/admin/rooms'    },
  { k:'users',    l:'Total Customers', icon:'👥', color:'#f43f5e', bg:'linear-gradient(135deg,#fff1f2,#ffe4e6)', link:'/admin/users'    },
];

export default function AdminDashboard() {
  const [bks, setBks]         = useState([]);
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getDashboard().catch(() => ({ data:{ data:{} } })),
      bookingAPI.getAll({}).catch(() => ({ data:{ data:{ bookings:[] } } })),
    ]).then(([dRes, bRes]) => {
      setStats(dRes.data.data || {});
      setBks(bRes.data.data.bookings || []);
    }).finally(() => setLoading(false));
  }, []);

  const paidBks   = bks.filter(b => b.paymentStatus === 'paid');
  const totalRev  = paidBks.reduce((s,b) => s + (b.pricing?.totalAmount||0), 0);
  const occupied  = bks.filter(b => b.status === 'checked_in').length;
  const confirmed = bks.filter(b => ['confirmed','checked_in'].includes(b.status)).length;

  const monthly = MONTHS.map((m,i) => ({
    month: m,
    Revenue:  bks.filter(b=>new Date(b.createdAt).getMonth()===i&&b.paymentStatus==='paid').reduce((s,b)=>s+(b.pricing?.totalAmount||0),0),
    Bookings: bks.filter(b=>new Date(b.createdAt).getMonth()===i).length,
  }));

  const statusData = (() => {
    const c = {};
    bks.forEach(b => { c[b.status] = (c[b.status]||0)+1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  })();

  const recent = [...bks].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8);

  const vals = {
    bookings: bks.length,
    revenue:  totalRev,
    occupied,
    users:    stats.totalUsers || 0,
  };

  const fmtRev = v => v >= 100000 ? '₹'+(v/100000).toFixed(1)+'L' : '₹'+(v/1000).toFixed(0)+'K';

  if (loading) return (
    <AdminLayout title="Dashboard" subtitle="Hotel operations overview">
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[...Array(4)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:110,borderRadius:18}}/>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        {[...Array(2)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:280,borderRadius:18}}/>)}
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Dashboard" subtitle="Real-time hotel operations overview">

      {/* KPI Stat Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:24}}>
        {STATS.map((s,i) => (
          <Link key={s.k} to={s.link} className={'adm-stat adm-card-gold adm-countup d'+(i+1)}
            style={{'--stat-c':s.color, textDecoration:'none', background:s.bg}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,255,255,.65)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 2px 8px rgba(0,0,0,.07)'}}>
                {s.icon}
              </div>
              <div style={{background:'rgba(255,255,255,.6)',borderRadius:99,padding:'3px 9px',fontSize:10.5,fontWeight:700,color:s.color}}>↗</div>
            </div>
            <p style={{fontSize:28,fontWeight:800,color:'#0f172a',fontFamily:"'DM Sans',sans-serif",fontVariantNumeric:'tabular-nums',lineHeight:1}}>
              {s.k==='revenue' ? fmtRev(vals[s.k]) : <AnimNum val={vals[s.k]}/>}
            </p>
            <p style={{fontSize:12,color:'#64748b',marginTop:5,fontWeight:500}}>{s.l}</p>
          </Link>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:16}}>
        {/* Revenue Area Chart */}
        <div className="adm-card adm-fadein d1" style={{padding:22}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:18}}>
            <div>
              <h3 className="adm-serif" style={{fontSize:18,fontWeight:700,color:'#0f172a'}}>Revenue Trend</h3>
              <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>Monthly performance this year</p>
            </div>
            <span style={{background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#16a34a',fontSize:11.5,fontWeight:700,padding:'5px 12px',borderRadius:99}}>
              {fmtRev(totalRev)} total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{top:4,right:4,left:0,bottom:0}}>
              <defs>
                <linearGradient id="gRevGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.22}/>
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>v>0?'₹'+(v/1000).toFixed(0)+'K':'0'}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="Revenue" name="Revenue" stroke={GOLD} strokeWidth={2.5} fill="url(#gRevGold)" dot={false} activeDot={{r:5,fill:GOLD}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy Rings */}
        <div className="adm-card adm-fadein d2" style={{padding:22}}>
          <h3 className="adm-serif" style={{fontSize:18,fontWeight:700,color:'#0f172a',marginBottom:4}}>Occupancy</h3>
          <p style={{fontSize:11.5,color:'#94a3b8',marginBottom:20}}>Live metrics</p>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            {[
              { pct: bks.length ? Math.round((occupied/Math.max(bks.length,1))*100) : 0, color:'#6366f1', label:'Occupied' },
              { pct: bks.length ? Math.round((confirmed/Math.max(bks.length,1))*100) : 0, color:GOLD,      label:'Confirmed' },
              { pct: Math.min(100,Math.round((totalRev/3000000)*100)),                    color:'#10b981',  label:'Revenue Goal' },
            ].map(({ pct, color, label }) => (
              <div key={label} style={{display:'flex',alignItems:'center',gap:14}}>
                <Ring pct={pct} color={color} size={72}/>
                <div>
                  <p style={{fontWeight:700,color:'#0f172a',fontSize:14}}>{pct}%</p>
                  <p style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:20}}>
        {/* Booking Bar Chart */}
        <div className="adm-card adm-fadein d2" style={{padding:22}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div>
              <h3 className="adm-serif" style={{fontSize:18,fontWeight:700,color:'#0f172a'}}>Booking Trends</h3>
              <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>Monthly reservations this year</p>
            </div>
            <span style={{background:'#fffbeb',border:'1px solid #fde68a',color:'#92400e',fontSize:11.5,fontWeight:700,padding:'5px 12px',borderRadius:99}}>
              {bks.length} total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={monthly} barSize={16} margin={{top:4,right:4,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="Bookings" fill={GOLD} radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Donut */}
        <div className="adm-card adm-fadein d3" style={{padding:22}}>
          <h3 className="adm-serif" style={{fontSize:18,fontWeight:700,color:'#0f172a',marginBottom:4}}>By Status</h3>
          <p style={{fontSize:11.5,color:'#94a3b8',marginBottom:12}}>Distribution</p>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={34} outerRadius={58} paddingAngle={4} dataKey="value">
                    {statusData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={<ChartTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:5}}>
                {statusData.slice(0,5).map((p,i) => (
                  <div key={p.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:11.5}}>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <span style={{width:7,height:7,borderRadius:'50%',background:COLORS[i%COLORS.length],flexShrink:0}}/>
                      <span style={{color:'#64748b',textTransform:'capitalize'}}>{p.name.replace('_',' ')}</span>
                    </div>
                    <span style={{fontWeight:700,color:'#1e293b'}}>{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{textAlign:'center',padding:'32px 0',color:'#94a3b8',fontSize:12}}>No bookings yet</div>
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="adm-card adm-fadein d3" style={{overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:'1px solid #f8fafc'}}>
          <div>
            <h3 className="adm-serif" style={{fontSize:18,fontWeight:700,color:'#0f172a'}}>Recent Bookings</h3>
            <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>Latest {recent.length} reservations</p>
          </div>
          <Link to="/admin/bookings" className="adm-btn adm-btn-gold" style={{fontSize:12,padding:'7px 16px'}}>View All →</Link>
        </div>
        {recent.length === 0 ? (
          <div style={{textAlign:'center',padding:'56px 0',color:'#94a3b8'}}>
            <p style={{fontSize:32,marginBottom:10}}>📋</p>
            <p style={{fontSize:13}}>No bookings yet</p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="adm-table">
              <thead>
                <tr>{['Reference','Guest','Hotel / Room','Check-In','Amount','Status'].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {recent.map((b,i) => (
                  <tr key={b._id} className={'adm-fadein d'+(Math.min(i+1,8))}>
                    <td><span style={{fontFamily:'monospace',fontSize:11,color:'#64748b'}}>{b.bookingReference}</span></td>
                    <td>
                      <p style={{fontWeight:600,color:'#1e293b'}}>{b.user?.name||'—'}</p>
                      <p style={{fontSize:10.5,color:'#94a3b8'}}>{b.user?.email}</p>
                    </td>
                    <td style={{fontSize:12,color:'#64748b'}}>{b.room?.hotelName||b.room?.name||'—'}</td>
                    <td style={{fontSize:12,color:'#64748b',whiteSpace:'nowrap'}}>{b.checkIn?new Date(b.checkIn).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}</td>
                    <td style={{fontWeight:700,color:'#1e293b'}}>₹{b.pricing?.totalAmount?.toLocaleString('en-IN')||'—'}</td>
                    <td><span className={'tag tag-'+(b.status||'pending')} style={{textTransform:'capitalize'}}>{(b.status||'pending').replace('_',' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
