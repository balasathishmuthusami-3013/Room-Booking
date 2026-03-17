import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { spaBookingAPI } from '../../services/api';
import toast from 'react-hot-toast';

function statusStyle(s) {
  const m = {
    Confirmed:{bg:'#dcfce7',color:'#15803d',border:'#bbf7d0'},
    Pending:{bg:'#fef9c3',color:'#854d0e',border:'#fef08a'},
    Cancelled:{bg:'#fee2e2',color:'#b91c1c',border:'#fecaca'},
    AttendRequested:{bg:'#dbeafe',color:'#1d4ed8',border:'#bfdbfe'},
  };
  return m[s] || m.Pending;
}

function AttendModal({ booking, onClose, onDone }) {
  const [note, setNote]     = useState('');
  const [saving, setSaving] = useState(false);
  const act = async (action) => {
    setSaving(true);
    try { await spaBookingAPI.approveAttend(booking._id, { action, note }); toast.success(action==='approve'?'Confirmed!':'Rejected'); onDone(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
        <div style={{padding:'20px 22px',borderBottom:'1px solid #f1f5f9'}}>
          <h2 className="adm-serif" style={{fontSize:18,fontWeight:700}}>Review Attend Request</h2>
          <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>{booking.ref}</p>
        </div>
        <div style={{padding:22}}>
          <div style={{background:'#f8fafc',borderRadius:12,padding:14,marginBottom:16,fontSize:12.5,color:'#475569',lineHeight:1.7}}>
            <p><strong>{booking.fullName}</strong> wants to check-in for <strong>{booking.treatment}</strong></p>
            <p style={{marginTop:4}}>Scheduled: {new Date(booking.date).toLocaleDateString('en-IN',{day:'numeric',month:'long'})} at {booking.time}</p>
          </div>
          <div style={{marginBottom:14}}>
            <label className="adm-label">Admin Note (optional)</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} className="adm-input" rows={2} placeholder="Add a note for the guest..."/>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>act('approve')} disabled={saving} className="adm-btn adm-btn-success" style={{flex:1}}>✓ Approve &amp; Confirm</button>
            <button onClick={()=>act('reject')}  disabled={saving} className="adm-btn adm-btn-danger"  style={{flex:1}}>✗ Reject</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CancelModal({ booking, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const cancel = async () => {
    if (!reason.trim()) { toast.error('Enter a reason'); return; }
    setSaving(true);
    try { await spaBookingAPI.cancel(booking._id, { cancelReason: reason }); toast.success('Booking cancelled'); onDone(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
        <div style={{padding:'20px 22px',borderBottom:'1px solid #f1f5f9'}}>
          <h2 className="adm-serif" style={{fontSize:18,fontWeight:700,color:'#dc2626'}}>Cancel Spa Booking</h2>
        </div>
        <div style={{padding:22}}>
          <p style={{fontSize:13,color:'#475569',marginBottom:14}}>You're about to cancel <strong>{booking.fullName}</strong>'s booking for <strong>{booking.treatment}</strong>.</p>
          <label className="adm-label">Cancellation Reason</label>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} className="adm-input" rows={3} placeholder="Reason for cancellation..."/>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={cancel} disabled={saving} className="adm-btn adm-btn-danger" style={{flex:1}}>{saving?'Cancelling…':'Cancel Booking'}</button>
            <button onClick={onClose} className="adm-btn adm-btn-ghost">Back</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSpaBookings() {
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState('all');
  const [expanded,  setExpanded]  = useState(null);
  const [attending, setAttending] = useState(null);
  const [cancelling,setCancelling]= useState(null);

  const load = async () => {
    setLoading(true);
    try { const {data} = await spaBookingAPI.getAll({}); setBookings(data.data.bookings||[]); }
    catch { toast.error('Failed to load spa bookings'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const pendingAttend = bookings.filter(b=>b.status==='AttendRequested').length;
  const totalRev = bookings.filter(b=>!['Cancelled'].includes(b.status)).reduce((s,b)=>s+(b.amount||0),0);

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || b.ref?.toLowerCase().includes(q) || b.fullName?.toLowerCase().includes(q) || b.treatment?.toLowerCase().includes(q);
    const matchS = statusF==='all' || b.status===statusF;
    return matchQ && matchS;
  });

  return (
    <AdminLayout title="Spa Booking" subtitle="Manage spa reservations and attendance">
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:24}}>
        {[
          {l:'Total Bookings',     v:bookings.length,     color:'#c9a84c',bg:'linear-gradient(135deg,#fffbeb,#fef3c7)'},
          {l:'Revenue',            v:'₹'+(totalRev/1000).toFixed(0)+'K', color:'#10b981',bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)'},
          {l:'Attend Requests',    v:pendingAttend,       color:'#1d4ed8',bg:'linear-gradient(135deg,#eff6ff,#dbeafe)'},
          {l:'Confirmed',          v:bookings.filter(b=>b.status==='Confirmed').length, color:'#7c3aed',bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)'},
          {l:'Cancelled',          v:bookings.filter(b=>b.status==='Cancelled').length, color:'#dc2626',bg:'linear-gradient(135deg,#fff1f2,#fee2e2)'},
        ].map((s,i)=>(
          <div key={s.l} className={'adm-stat adm-fadein d'+(i+1)} style={{'--stat-c':s.color,background:s.bg,position:'relative'}}>
            {s.l==='Attend Requests'&&pendingAttend>0&&(
              <span style={{position:'absolute',top:10,right:10,background:'#1d4ed8',color:'#fff',borderRadius:99,fontSize:10,fontWeight:800,padding:'1px 6px',minWidth:18,textAlign:'center'}}>{pendingAttend}</span>
            )}
            <p style={{fontSize:24,fontWeight:800,color:'#0f172a',fontVariantNumeric:'tabular-nums'}}>{s.v}</p>
            <p style={{fontSize:11,color:'#64748b',marginTop:4}}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Attend Requests Banner */}
      {pendingAttend > 0 && (
        <div className="adm-fadein" style={{background:'linear-gradient(135deg,#eff6ff,#dbeafe)',border:'1.5px solid #bfdbfe',borderRadius:14,padding:'14px 18px',marginBottom:18,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:24}}>🔔</span>
            <div>
              <p style={{fontWeight:700,color:'#1d4ed8',fontSize:13}}>{pendingAttend} Attend Request{pendingAttend>1?'s':''} Pending</p>
              <p style={{fontSize:11.5,color:'#3b82f6',marginTop:1}}>Guests waiting for your approval to check in</p>
            </div>
          </div>
          <button onClick={()=>setStatusF('AttendRequested')} className="adm-btn" style={{background:'#1d4ed8',color:'#fff',fontSize:12,padding:'7px 14px'}}>
            Review Now
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bookings…" className="adm-input" style={{flex:'1 1 220px',maxWidth:320}}/>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)} className="adm-input" style={{width:180}}>
          <option value="all">All Statuses</option>
          {['Pending','AttendRequested','Confirmed','Cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={()=>setStatusF('all')} className="adm-btn adm-btn-ghost" style={{fontSize:11.5}}>Reset</button>
        <span style={{fontSize:12,color:'#94a3b8'}}>{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="adm-card" style={{overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:20,display:'flex',flexDirection:'column',gap:10}}>
            {[...Array(5)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:48,borderRadius:10}}/>)}
          </div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:'center',padding:'56px',color:'#94a3b8'}}>
            <p style={{fontSize:32,marginBottom:10}}>💆</p>
            <p style={{fontSize:13}}>No spa bookings found</p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="adm-table">
              <thead>
                <tr>{['Ref / Date','Guest','Treatment','Date & Time','Amount','Status','Actions'].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((b,i) => {
                  const st = statusStyle(b.status);
                  const isOpen = expanded===b._id;
                  return (
                    <React.Fragment key={b._id}>
                      <tr className={'adm-fadein d'+(Math.min(i%8+1,8))} style={{cursor:'pointer'}} onClick={()=>setExpanded(isOpen?null:b._id)}>
                        <td>
                          <p style={{fontFamily:'monospace',fontSize:11,color:'#c9a84c',fontWeight:700}}>{b.ref}</p>
                          <p style={{fontSize:10.5,color:'#94a3b8',marginTop:1}}>{new Date(b.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
                        </td>
                        <td>
                          <p style={{fontWeight:600,color:'#1e293b',fontSize:13}}>{b.fullName}</p>
                          <p style={{fontSize:10.5,color:'#94a3b8'}}>{b.email}</p>
                        </td>
                        <td>
                          <p style={{fontWeight:600,color:'#475569',fontSize:12}}>{b.treatment}</p>
                          <p style={{fontSize:10.5,color:'#94a3b8'}}>{b.duration} min · {b.guests} guest{b.guests>1?'s':''}</p>
                        </td>
                        <td style={{fontSize:12,color:'#475569',whiteSpace:'nowrap'}}>
                          <p>{new Date(b.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                          <p style={{color:'#94a3b8',fontSize:10.5}}>{b.time}</p>
                        </td>
                        <td style={{fontWeight:700,color:'#1e293b'}}>₹{(b.amount||0).toLocaleString('en-IN')}</td>
                        <td><span style={{background:st.bg,color:st.color,border:'1px solid '+st.border,borderRadius:99,padding:'3px 9px',fontSize:10.5,fontWeight:700}}>{b.status}</span></td>
                        <td onClick={e=>e.stopPropagation()}>
                          <div style={{display:'flex',gap:5}}>
                            {b.status==='AttendRequested' && (
                              <button onClick={()=>setAttending(b)} className="adm-btn" style={{background:'#1d4ed8',color:'#fff',padding:'4px 9px',fontSize:11,borderRadius:7}}>Review</button>
                            )}
                            {!['Cancelled'].includes(b.status) && (
                              <button onClick={()=>setCancelling(b)} className="adm-btn adm-btn-danger" style={{padding:'4px 9px',fontSize:11,borderRadius:7}}>Cancel</button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={7} style={{padding:0,background:'#fafbfc'}}>
                            <div className="adm-fadein" style={{padding:'16px 22px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,borderTop:'1px solid #f1f5f9'}}>
                              {[
                                {l:'Reference',   v:b.ref},
                                {l:'Phone',       v:b.phone||'—'},
                                {l:'Category',    v:b.category||'—'},
                                {l:'Payment',     v:b.paymentMethod||'—'},
                                {l:'Price',       v:'₹'+(b.price||0).toLocaleString('en-IN')},
                                {l:'Guests',      v:b.guests},
                              ].map(({l,v})=>(
                                <div key={l} style={{background:'#fff',borderRadius:10,padding:'10px 13px',border:'1px solid #f1f5f9'}}>
                                  <p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>{l}</p>
                                  <p style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>{v}</p>
                                </div>
                              ))}
                              {b.notes && (
                                <div style={{background:'#fff',borderRadius:10,padding:'10px 13px',border:'1px solid #f1f5f9',gridColumn:'1/-1'}}>
                                  <p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:2}}>Notes</p>
                                  <p style={{fontSize:12.5,color:'#475569'}}>{b.notes}</p>
                                </div>
                              )}
                              {b.status==='Cancelled' && b.cancelReason && (
                                <div style={{background:'#fff1f2',borderRadius:10,padding:'10px 13px',border:'1px solid #fecaca',gridColumn:'1/-1'}}>
                                  <p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#dc2626',marginBottom:2}}>Cancellation Reason</p>
                                  <p style={{fontSize:12.5,color:'#b91c1c'}}>{b.cancelReason}</p>
                                  {b.cancelledAt && <p style={{fontSize:10.5,color:'#f87171',marginTop:2}}>Cancelled: {new Date(b.cancelledAt).toLocaleString('en-IN')}</p>}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {attending  && <AttendModal  booking={attending}  onClose={()=>setAttending(null)}  onDone={()=>{setAttending(null);load();}}/>}
      {cancelling && <CancelModal  booking={cancelling} onClose={()=>setCancelling(null)} onDone={()=>{setCancelling(null);load();}}/>}
    </AdminLayout>
  );
}
