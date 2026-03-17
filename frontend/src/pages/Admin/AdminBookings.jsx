import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { bookingAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending','confirmed','cancelled','checked_in','checked_out'];
const PAY_OPTIONS    = ['pending','paid','failed','refunded'];

function statusStyle(s) {
  const m = {confirmed:{bg:'#dcfce7',color:'#15803d',border:'#bbf7d0'},pending:{bg:'#fef9c3',color:'#854d0e',border:'#fef08a'},cancelled:{bg:'#fee2e2',color:'#b91c1c',border:'#fecaca'},checked_in:{bg:'#dbeafe',color:'#1d4ed8',border:'#bfdbfe'},checked_out:{bg:'#f3f4f6',color:'#6b7280',border:'#e5e7eb'}};
  return m[s] || m.pending;
}

function Modal({ booking, onClose, onSave }) {
  const [form, setForm] = useState({ status: booking.status, paymentStatus: booking.paymentStatus, checkIn: booking.checkIn?.slice(0,10)||'', checkOut: booking.checkOut?.slice(0,10)||'', specialRequests: booking.specialRequests||'' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await bookingAPI.update(booking._id, form);
      toast.success('Booking updated'); onSave();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 22px',borderBottom:'1px solid #f1f5f9'}}>
          <div>
            <h2 className="adm-serif" style={{fontSize:19,fontWeight:700,color:'#0f172a'}}>Edit Booking</h2>
            <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>{booking.bookingReference}</p>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',background:'#f8fafc',border:'1px solid #e2e8f0',cursor:'pointer',color:'#64748b',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <div style={{padding:22,display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <label className="adm-label">Booking Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="adm-input">
                {STATUS_OPTIONS.map(s=><option key={s} value={s} style={{textTransform:'capitalize'}}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="adm-label">Payment Status</label>
              <select value={form.paymentStatus} onChange={e=>setForm({...form,paymentStatus:e.target.value})} className="adm-input">
                {PAY_OPTIONS.map(s=><option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="adm-label">Check-In Date</label>
              <input type="date" value={form.checkIn} onChange={e=>setForm({...form,checkIn:e.target.value})} className="adm-input"/>
            </div>
            <div>
              <label className="adm-label">Check-Out Date</label>
              <input type="date" value={form.checkOut} onChange={e=>setForm({...form,checkOut:e.target.value})} className="adm-input"/>
            </div>
          </div>
          <div>
            <label className="adm-label">Special Requests</label>
            <textarea value={form.specialRequests} onChange={e=>setForm({...form,specialRequests:e.target.value})} className="adm-input" rows={3} placeholder="Guest notes..."/>
          </div>
          <div style={{display:'flex',gap:10,marginTop:4}}>
            <button onClick={save} disabled={saving} className="adm-btn adm-btn-gold" style={{flex:1}}>
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
            <button onClick={onClose} className="adm-btn adm-btn-ghost">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [editing,  setEditing]  = useState(null);

  const load = async () => {
    setLoading(true);
    try { const {data} = await bookingAPI.getAll({}); setBookings(data.data.bookings||[]); }
    catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || b.bookingReference?.toLowerCase().includes(q) || b.user?.name?.toLowerCase().includes(q) || b.user?.email?.toLowerCase().includes(q) || b.room?.hotelName?.toLowerCase().includes(q);
    const matchS = statusF==='all' || b.status===statusF;
    return matchQ && matchS;
  });

  const totalRev = bookings.filter(b=>b.paymentStatus==='paid').reduce((s,b)=>s+(b.pricing?.totalAmount||0),0);

  return (
    <AdminLayout title="Room Booking" subtitle="All reservation details and management">
      {/* Stats Row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:24}}>
        {[
          {l:'Total Bookings', v:bookings.length,          color:'#c9a84c',bg:'linear-gradient(135deg,#fffbeb,#fef3c7)'},
          {l:'Total Revenue',  v:'₹'+(totalRev/1000).toFixed(0)+'K', color:'#10b981',bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)'},
          {l:'Confirmed',      v:bookings.filter(b=>b.status==='confirmed').length, color:'#6366f1',bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)'},
          {l:'Pending',        v:bookings.filter(b=>b.status==='pending').length,   color:'#f59e0b',bg:'linear-gradient(135deg,#fffbeb,#fef9c3)'},
          {l:'Checked In',     v:bookings.filter(b=>b.status==='checked_in').length,color:'#0891b2',bg:'linear-gradient(135deg,#ecfeff,#cffafe)'},
        ].map((s,i)=>(
          <div key={s.l} className={'adm-stat adm-fadein d'+(i+1)} style={{'--stat-c':s.color,background:s.bg}}>
            <p style={{fontSize:24,fontWeight:800,color:'#0f172a',fontVariantNumeric:'tabular-nums'}}>{s.v}</p>
            <p style={{fontSize:11,color:'#64748b',marginTop:4}}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by reference, guest, hotel…" className="adm-input" style={{flex:'1 1 240px',maxWidth:360}}/>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)} className="adm-input" style={{width:160}}>
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s=><option key={s} value={s} style={{textTransform:'capitalize'}}>{s.replace('_',' ')}</option>)}
        </select>
        <span style={{fontSize:12,color:'#94a3b8',fontWeight:500}}>{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="adm-card" style={{overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:20,display:'flex',flexDirection:'column',gap:10}}>
            {[...Array(6)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:48,borderRadius:10}}/>)}
          </div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:'center',padding:'56px',color:'#94a3b8'}}>
            <p style={{fontSize:32,marginBottom:10}}>📋</p>
            <p style={{fontSize:13}}>{search||statusF!=='all'?'No matching bookings':'No bookings yet'}</p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="adm-table">
              <thead>
                <tr>{['Ref / Date','Guest','City → Hotel → Room','Check-In','Check-Out','Amount','Status',''].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((b,i) => {
                  const st = statusStyle(b.status);
                  const isOpen = expanded===b._id;
                  return (
                    <React.Fragment key={b._id}>
                      <tr className={'adm-fadein d'+(Math.min(i%8+1,8))} style={{cursor:'pointer'}} onClick={()=>setExpanded(isOpen?null:b._id)}>
                        <td>
                          <p style={{fontFamily:'monospace',fontSize:11,color:'#c9a84c',fontWeight:700}}>{b.bookingReference}</p>
                          <p style={{fontSize:10.5,color:'#94a3b8',marginTop:1}}>{new Date(b.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                        </td>
                        <td>
                          <p style={{fontWeight:600,color:'#1e293b',fontSize:13}}>{b.user?.name||'—'}</p>
                          <p style={{fontSize:10.5,color:'#94a3b8'}}>{b.user?.email}</p>
                        </td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                            {b.room?.cityName&&<span style={{fontSize:11,background:'#f1f5f9',color:'#475569',padding:'1px 7px',borderRadius:99}}>{b.room.cityName}</span>}
                            {b.room?.cityName&&<span style={{fontSize:9,color:'#d1d5db'}}>→</span>}
                            {b.room?.hotelName&&<span style={{fontSize:11,background:'#fffbeb',color:'#92400e',padding:'1px 7px',borderRadius:99}}>{b.room.hotelName}</span>}
                            {b.room?.hotelName&&<span style={{fontSize:9,color:'#d1d5db'}}>→</span>}
                            <span style={{fontSize:11,color:'#475569'}}>{b.room?.name||b.room?.type||'—'}</span>
                          </div>
                        </td>
                        <td style={{fontSize:12,whiteSpace:'nowrap',color:'#475569'}}>{b.checkIn?new Date(b.checkIn).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                        <td style={{fontSize:12,whiteSpace:'nowrap',color:'#475569'}}>{b.checkOut?new Date(b.checkOut).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                        <td style={{fontWeight:700,color:'#1e293b'}}>₹{b.pricing?.totalAmount?.toLocaleString('en-IN')||'—'}</td>
                        <td><span style={{background:st.bg,color:st.color,border:'1px solid '+st.border,borderRadius:99,padding:'3px 9px',fontSize:10.5,fontWeight:700,textTransform:'capitalize',whiteSpace:'nowrap'}}>{(b.status||'—').replace('_',' ')}</span></td>
                        <td>
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            <button onClick={e=>{e.stopPropagation();setEditing(b);}} className="adm-btn adm-btn-ghost" style={{padding:'4px 10px',fontSize:11,borderRadius:7}}>Edit</button>
                            <span style={{fontSize:11,color:'#94a3b8'}}>{isOpen?'▲':'▼'}</span>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={8} style={{padding:0,background:'#fafbfc'}}>
                            <div className="adm-fadein" style={{padding:'16px 22px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,borderTop:'1px solid #f1f5f9'}}>
                              {[
                                {l:'Booking Reference',v:b.bookingReference},
                                {l:'Booked On',        v:new Date(b.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})},
                                {l:'City',             v:b.room?.cityName||'—'},
                                {l:'Hotel',            v:b.room?.hotelName||'—'},
                                {l:'Room Type',        v:b.room?.type||'—'},
                                {l:'Price / Night',    v:'₹'+(b.room?.pricePerNight||0).toLocaleString('en-IN')},
                                {l:'Payment',          v:b.paymentStatus||'—'},
                                {l:'Nights',           v:b.pricing?.nights||'—'},
                              ].map(({l,v}) => (
                                <div key={l} style={{background:'#fff',borderRadius:10,padding:'10px 13px',border:'1px solid #f1f5f9'}}>
                                  <p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:3}}>{l}</p>
                                  <p style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>{v}</p>
                                </div>
                              ))}
                              {b.specialRequests && (
                                <div style={{background:'#fff',borderRadius:10,padding:'10px 13px',border:'1px solid #f1f5f9',gridColumn:'1/-1'}}>
                                  <p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94a3b8',marginBottom:3}}>Special Requests</p>
                                  <p style={{fontSize:12.5,color:'#475569'}}>{b.specialRequests}</p>
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

      {editing && <Modal booking={editing} onClose={()=>setEditing(null)} onSave={()=>{setEditing(null);load();}}/>}
    </AdminLayout>
  );
}
