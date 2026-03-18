import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { bookingAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCheckInRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('pending');
  const [acting,   setActing]   = useState(null);
  const [search,   setSearch]   = useState('');

  const load = async () => {
    setLoading(true);
    try { const {data} = await bookingAPI.getAll({}); setBookings(data.data.bookings||[]); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    setActing(id);
    try { await bookingAPI.update(id, { status:'checked_in' }); toast.success('Check-in approved ✓'); load(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setActing(null); }
  };
  const reject = async (id) => {
    setActing(id);
    try { await bookingAPI.update(id, { status:'confirmed' }); toast.success('Request returned to confirmed'); load(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setActing(null); }
  };

  const pending  = bookings.filter(b => b.status==='confirmed');
  const approved = bookings.filter(b => b.status==='checked_in');

  const filterFn = list => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(b => b.bookingReference?.toLowerCase().includes(q) || b.user?.name?.toLowerCase().includes(q) || b.room?.hotelName?.toLowerCase().includes(q));
  };

  const visible = filterFn(tab==='pending' ? pending : approved);

  return (
    <AdminLayout title="Check-In" subtitle="Approve customer check-in requests">
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
        {[
          {l:'Pending Requests',v:pending.length, color:'#f59e0b',bg:'linear-gradient(135deg,#fffbeb,#fef3c7)'},
          {l:'Checked In',      v:approved.length,color:'#10b981',bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)'},
          {l:'Total Bookings',  v:bookings.length,color:'#6366f1',bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)'},
        ].map((s,i)=>(
          <div key={s.l} className={'adm-stat adm-fadein d'+(i+1)} style={{'--stat-c':s.color,background:s.bg}}>
            <p style={{fontSize:28,fontWeight:800,color:'#0f172a'}}>{s.v}</p>
            <p style={{fontSize:11.5,color:'#64748b',marginTop:4}}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Pending banner */}
      {pending.length > 0 && tab==='pending' && (
        <div className="adm-fadein" style={{background:'linear-gradient(135deg,#fffbeb,#fef3c7)',border:'1.5px solid #fde68a',borderRadius:14,padding:'14px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#c9a84c,#9b7a2e)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🚪</div>
          <div>
            <p style={{fontWeight:700,color:'#92400e',fontSize:13}}>{pending.length} guest{pending.length>1?'s':''} waiting for check-in approval</p>
            <p style={{fontSize:11.5,color:'#b45309',marginTop:1}}>Review and approve requests below</p>
          </div>
        </div>
      )}

      {/* Tabs + Search */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
        <div className="adm-tabs" style={{width:'auto'}}>
          {[{k:'pending',l:'Pending'},{ k:'approved',l:'Checked In'}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className={'adm-tab'+(tab===t.k?' active':'')}>
              {t.l} {t.k==='pending'&&pending.length>0&&<span style={{background:'#f59e0b',color:'#fff',borderRadius:99,padding:'0 6px',fontSize:10,fontWeight:800,marginLeft:4}}>{pending.length}</span>}
            </button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="adm-input" style={{width:220}}/>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
          {[...Array(4)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:180,borderRadius:16}}/>)}
        </div>
      ) : visible.length===0 ? (
        <div className="adm-card" style={{textAlign:'center',padding:'56px',color:'#94a3b8'}}>
          <p style={{fontSize:32,marginBottom:10}}>{tab==='pending'?'🚪':'✅'}</p>
          <p style={{fontSize:13,fontWeight:600}}>{tab==='pending'?'No pending check-in requests':'No checked-in guests yet'}</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
          {visible.map((b,i) => (
            <div key={b._id} className={'adm-card adm-card-gold adm-fadein d'+(Math.min(i%6+1,6))}
              style={{padding:18,borderLeft:tab==='pending'?'3px solid #c9a84c':'3px solid #10b981'}}>
              {/* Header */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                <div>
                  <p style={{fontFamily:'monospace',fontSize:11,color:'#c9a84c',fontWeight:700,marginBottom:3}}>{b.bookingReference}</p>
                  <p style={{fontWeight:700,fontSize:14,color:'#1e293b'}}>{b.user?.name||'Guest'}</p>
                  <p style={{fontSize:11.5,color:'#94a3b8'}}>{b.user?.email}</p>
                </div>
                <span style={{background:tab==='pending'?'#fffbeb':'#f0fdf4',border:'1px solid '+(tab==='pending'?'#fde68a':'#bbf7d0'),color:tab==='pending'?'#92400e':'#16a34a',borderRadius:99,padding:'3px 9px',fontSize:10.5,fontWeight:700}}>
                  {tab==='pending'?'Awaiting':'Checked In'}
                </span>
              </div>
              <hr style={{border:'none',borderTop:'1px solid #f1f5f9',margin:'10px 0'}}/>
              {/* Details */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12,color:'#64748b',marginBottom:12}}>
                <div><p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>Hotel</p><p style={{fontWeight:600,color:'#1e293b'}}>{b.room?.hotelName||'—'}</p></div>
                <div><p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>Room</p><p style={{fontWeight:600,color:'#1e293b'}}>{b.room?.name||b.room?.type||'—'}</p></div>
                <div><p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>Check-In</p><p style={{fontWeight:600,color:'#1e293b'}}>{b.checkIn?new Date(b.checkIn).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}</p></div>
                <div><p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>Check-Out</p><p style={{fontWeight:600,color:'#1e293b'}}>{b.checkOut?new Date(b.checkOut).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}</p></div>
              </div>
              {/* Amount */}
              <div style={{background:'#f8fafc',borderRadius:10,padding:'8px 12px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:11.5,color:'#64748b'}}>Total Amount</span>
                <span style={{fontWeight:800,color:'#1e293b',fontSize:14}}>₹{b.pricing?.totalAmount?.toLocaleString('en-IN')||'—'}</span>
              </div>
              {/* Actions */}
              {tab==='pending' && (
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>approve(b._id)} disabled={acting===b._id} className="adm-btn adm-btn-success" style={{flex:1}}>
                    {acting===b._id?'…':'✓ Approve Check-In'}
                  </button>
                  <button onClick={()=>reject(b._id)} disabled={acting===b._id} className="adm-btn adm-btn-ghost" style={{padding:'9px 12px'}}>✗</button>
                </div>
              )}
              {tab==='approved' && (
                <div style={{background:'#f0fdf4',borderRadius:10,padding:'8px 14px',textAlign:'center',fontSize:12,color:'#16a34a',fontWeight:600}}>
                  ✓ Successfully Checked In
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
