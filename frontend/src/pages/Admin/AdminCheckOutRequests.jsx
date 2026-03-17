import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { bookingAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCheckOutRequests() {
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

  const approve = async id => {
    setActing(id);
    try { await bookingAPI.update(id,{status:'checked_out'}); toast.success('Check-out approved ✓'); load(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setActing(null); }
  };

  const pending  = bookings.filter(b => b.status==='checked_in');
  const approved = bookings.filter(b => b.status==='checked_out');

  const filterFn = list => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(b => b.bookingReference?.toLowerCase().includes(q) || b.user?.name?.toLowerCase().includes(q) || b.room?.hotelName?.toLowerCase().includes(q));
  };
  const visible = filterFn(tab==='pending' ? pending : approved);

  return (
    <AdminLayout title="Check-Out" subtitle="Approve customer check-out requests">
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
        {[
          {l:'Awaiting Check-Out', v:pending.length, color:'#7c3aed',bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)'},
          {l:'Checked Out',        v:approved.length,color:'#10b981',bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)'},
          {l:'Still Checked In',   v:bookings.filter(b=>b.status==='checked_in').length,color:'#0891b2',bg:'linear-gradient(135deg,#ecfeff,#cffafe)'},
        ].map((s,i)=>(
          <div key={s.l} className={'adm-stat adm-fadein d'+(i+1)} style={{'--stat-c':s.color,background:s.bg}}>
            <p style={{fontSize:28,fontWeight:800,color:'#0f172a'}}>{s.v}</p>
            <p style={{fontSize:11.5,color:'#64748b',marginTop:4}}>{s.l}</p>
          </div>
        ))}
      </div>

      {pending.length>0 && tab==='pending' && (
        <div className="adm-fadein" style={{background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',border:'1.5px solid #ddd6fe',borderRadius:14,padding:'14px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#5b21b6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🏁</div>
          <div>
            <p style={{fontWeight:700,color:'#5b21b6',fontSize:13}}>{pending.length} guest{pending.length>1?'s':''} requesting check-out</p>
            <p style={{fontSize:11.5,color:'#7c3aed',marginTop:1}}>Review and confirm departures below</p>
          </div>
        </div>
      )}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
        <div className="adm-tabs" style={{width:'auto'}}>
          {[{k:'pending',l:'Awaiting'},{k:'approved',l:'Checked Out'}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className={'adm-tab'+(tab===t.k?' active':'')}>
              {t.l} {t.k==='pending'&&pending.length>0&&<span style={{background:'#7c3aed',color:'#fff',borderRadius:99,padding:'0 6px',fontSize:10,fontWeight:800,marginLeft:4}}>{pending.length}</span>}
            </button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="adm-input" style={{width:220}}/>
      </div>

      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
          {[...Array(4)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:180,borderRadius:16}}/>)}
        </div>
      ) : visible.length===0 ? (
        <div className="adm-card" style={{textAlign:'center',padding:'56px',color:'#94a3b8'}}>
          <p style={{fontSize:32,marginBottom:10}}>{tab==='pending'?'🏁':'✅'}</p>
          <p style={{fontSize:13,fontWeight:600}}>{tab==='pending'?'No pending check-out requests':'No checked-out guests yet'}</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
          {visible.map((b,i) => (
            <div key={b._id} className={'adm-card adm-fadein d'+(Math.min(i%6+1,6))}
              style={{padding:18,borderLeft:tab==='pending'?'3px solid #7c3aed':'3px solid #10b981'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                <div>
                  <p style={{fontFamily:'monospace',fontSize:11,color:'#7c3aed',fontWeight:700,marginBottom:3}}>{b.bookingReference}</p>
                  <p style={{fontWeight:700,fontSize:14,color:'#1e293b'}}>{b.user?.name||'Guest'}</p>
                  <p style={{fontSize:11.5,color:'#94a3b8'}}>{b.user?.email}</p>
                </div>
                <span style={{background:tab==='pending'?'#f5f3ff':'#f0fdf4',border:'1px solid '+(tab==='pending'?'#ddd6fe':'#bbf7d0'),color:tab==='pending'?'#5b21b6':'#16a34a',borderRadius:99,padding:'3px 9px',fontSize:10.5,fontWeight:700}}>
                  {tab==='pending'?'Awaiting':'Checked Out'}
                </span>
              </div>
              <hr style={{border:'none',borderTop:'1px solid #f1f5f9',margin:'10px 0'}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12,color:'#64748b',marginBottom:12}}>
                <div><p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>Hotel</p><p style={{fontWeight:600,color:'#1e293b'}}>{b.room?.hotelName||'—'}</p></div>
                <div><p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>Room</p><p style={{fontWeight:600,color:'#1e293b'}}>{b.room?.name||b.room?.type||'—'}</p></div>
                <div><p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>Check-In</p><p style={{fontWeight:600,color:'#1e293b'}}>{b.checkIn?new Date(b.checkIn).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}</p></div>
                <div><p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>Check-Out</p><p style={{fontWeight:600,color:'#1e293b'}}>{b.checkOut?new Date(b.checkOut).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}</p></div>
              </div>
              <div style={{background:'#f8fafc',borderRadius:10,padding:'8px 12px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:11.5,color:'#64748b'}}>Total</span>
                <span style={{fontWeight:800,color:'#1e293b',fontSize:14}}>₹{b.pricing?.totalAmount?.toLocaleString('en-IN')||'—'}</span>
              </div>
              {tab==='pending' && (
                <button onClick={()=>approve(b._id)} disabled={acting===b._id} className="adm-btn" style={{width:'100%',background:'linear-gradient(135deg,#7c3aed,#5b21b6)',color:'#fff'}}>
                  {acting===b._id?'Processing…':'✓ Approve Check-Out'}
                </button>
              )}
              {tab==='approved' && (
                <div style={{background:'#f0fdf4',borderRadius:10,padding:'8px 14px',textAlign:'center',fontSize:12,color:'#16a34a',fontWeight:600}}>
                  ✓ Successfully Checked Out
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
