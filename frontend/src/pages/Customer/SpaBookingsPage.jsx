/**
 * SpaBookingsPage.jsx — /spa/bookings
 * Shows customer's spa bookings from backend.
 * Attend button → sends request to admin → admin approves → Confirmed
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { spaBookingAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ANIM = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(245,158,11,.5)}70%{box-shadow:0 0 0 10px rgba(245,158,11,0)}100%{box-shadow:0 0 0 0 rgba(245,158,11,0)}}
  .spa-card{animation:fadeUp .35s cubic-bezier(.16,1,.3,1) both}
  .attend-btn{animation:pulse-ring 2.5s ease infinite;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
  .attend-btn:hover{transform:scale(1.06) translateY(-1px)}
`;

const STATUS_CFG = {
  Pending:         { color:'bg-yellow-100 text-yellow-700 border-yellow-200', icon:'⏳', label:'Pending' },
  AttendRequested: { color:'bg-orange-100 text-orange-700 border-orange-200', icon:'🔔', label:'Attend Requested' },
  Confirmed:       { color:'bg-green-100 text-green-700 border-green-200',   icon:'✅', label:'Confirmed' },
  Cancelled:       { color:'bg-red-100 text-red-700 border-red-200',         icon:'❌', label:'Cancelled' },
};
const METHOD = { card:'💳 Card', upi:'📱 UPI', netbanking:'🏦 Net Banking' };
const fmt = d => d ? new Date(d).toLocaleDateString('en-IN',{weekday:'short',month:'long',day:'numeric'}) : '—';

export default function SpaBookingsPage() {
  const [bookings,setBookings]   = useState([]);
  const [loading,setLoading]     = useState(true);
  const [selected,setSelected]   = useState(null);
  const [cancelId,setCancelId]   = useState(null);
  const [cancelReason,setReason] = useState('');
  const [actioning,setActioning] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {data} = await spaBookingAPI.getMy();
      setBookings(data.data.bookings||[]);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  const handleCancel = async () => {
    if (!cancelId) return;
    setActioning(a=>({...a,[cancelId]:true}));
    try {
      await spaBookingAPI.cancel(cancelId, { reason: cancelReason||'Customer request' });
      toast.success('Booking cancelled');
      setCancelId(null); setReason('');
      load();
    } catch { toast.error('Cancellation failed'); }
    finally { setActioning(a=>({...a,[cancelId]:false})); }
  };

  const handleAttend = async (id) => {
    setActioning(a=>({...a,[id]:true}));
    try {
      await spaBookingAPI.requestAttend(id);
      toast.success('🔔 Attend request sent to admin!');
      load();
    } catch { toast.error('Failed to send attend request'); }
    finally { setActioning(a=>({...a,[id]:false})); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <style>{ANIM}</style>
      <Link to="/spa" className="text-sm text-gray-500 hover:text-amber-600 flex items-center gap-1 mb-6">← Back to Spa</Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Spa Bookings</h1>
          <p className="text-gray-500 mt-1 text-sm">{bookings.length} booking{bookings.length!==1?'s':''}</p>
        </div>
      </div>

      {/* Cancel modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={()=>setCancelId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Cancel Spa Booking</h3>
            <p className="text-gray-500 text-sm mb-4">This action cannot be undone.</p>
            <textarea value={cancelReason} onChange={e=>setReason(e.target.value)}
              placeholder="Reason for cancellation (optional)" rows={3}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"/>
            <div className="flex gap-3">
              <button onClick={()=>setCancelId(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">Keep Booking</button>
              <button onClick={handleCancel} disabled={actioning[cancelId]}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60">
                {actioning[cancelId]?'Cancelling…':'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"/>
        </div>
      ) : bookings.length===0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border shadow-sm">
          <span className="text-6xl block mb-4">🌿</span>
          <h2 className="text-xl font-bold text-gray-700 mb-2">No Spa Bookings Yet</h2>
          <p className="text-gray-400 mb-6 text-sm">Your spa treatments will appear here.</p>
          <Link to="/spa" className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-3 rounded-xl text-sm">
            Explore Treatments →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b,i)=>{
            const sc = STATUS_CFG[b.status]||STATUS_CFG.Pending;
            const canAttend = b.status==='Pending';
            const canCancel = !['Cancelled','Confirmed'].includes(b.status);
            return (
              <div key={b._id} className={`spa-card bg-white rounded-2xl border shadow-sm hover:shadow-md transition overflow-hidden`}
                style={{animationDelay:`${i*0.05}s`}}>
                <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={()=>setSelected(selected===b._id?null:b._id)}>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-2xl flex-shrink-0">
                    🌿
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800">{b.treatment}</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${sc.color}`}>{sc.icon} {sc.label}</span>
                      {b.category && <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{b.category}</span>}
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">📅 {fmt(b.date)} · ⏰ {b.time}</p>
                    <p className="text-gray-400 text-xs mt-0.5 font-mono">{b.ref}</p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                    <p className="font-bold text-amber-600 text-lg">₹{b.amount?.toLocaleString('en-IN')}</p>
                    <p className="text-gray-400 text-xs">{b.duration}</p>
                    {canAttend && (
                      <button
                        onClick={e=>{e.stopPropagation();handleAttend(b._id);}}
                        disabled={actioning[b._id]}
                        className="attend-btn bg-amber-400 hover:bg-amber-500 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60">
                        {actioning[b._id]?'Sending…':'🙋 Attend'}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={e=>{e.stopPropagation();setCancelId(b._id);setReason('');}}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 px-2.5 py-1 rounded-lg transition font-semibold">
                        ✕ Cancel
                      </button>
                    )}
                    <p className="text-gray-400 text-xs">{selected===b._id?'▲ Hide':'▼ Details'}</p>
                  </div>
                </div>

                {/* Attend status info banner */}
                {b.status==='AttendRequested' && (
                  <div className="mx-5 mb-3 bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-800">
                    🔔 <strong>Attend request sent</strong> — waiting for admin approval. You'll be confirmed once approved.
                  </div>
                )}
                {b.status==='Confirmed' && (
                  <div className="mx-5 mb-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                    ✅ <strong>Confirmed!</strong> Your spa appointment is confirmed. Please arrive 15 minutes early.
                  </div>
                )}

                {/* Expanded details */}
                {selected===b._id && (
                  <div className="border-t bg-gray-50 px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {[
                      ['Guest Name',b.fullName],['Email',b.email],['Phone',b.phone||'—'],
                      ['Guests',b.guests==='2'?'2 Persons (Couples)':'1 Person'],
                      ['Payment',METHOD[b.paymentMethod]||b.paymentMethod||'—'],
                      ['Amount Paid',`₹${b.amount?.toLocaleString('en-IN')}`],
                      ['Booked On',b.createdAt?new Date(b.createdAt).toLocaleString('en-IN'):'—'],
                    ].map(([k,v])=>(
                      <div key={k}><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="font-semibold text-gray-800 truncate">{v}</p></div>
                    ))}
                    {b.notes && (
                      <div className="col-span-2 sm:col-span-3">
                        <p className="text-xs text-gray-400 mb-0.5">Special Notes</p>
                        <p className="font-semibold text-gray-700">{b.notes}</p>
                      </div>
                    )}
                    {b.status==='Cancelled' && (
                      <div className="col-span-2 sm:col-span-3 bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="font-bold text-red-700 text-sm">❌ Booking Cancelled {b.cancelledAt?`on ${new Date(b.cancelledAt).toLocaleDateString('en-IN')}`:''}</p>
                        {b.cancelReason && <p className="text-xs text-red-600 mt-0.5">Reason: {b.cancelReason}</p>}
                      </div>
                    )}
                    {b.attendRequest?.requestedAt && (
                      <div className="col-span-2 sm:col-span-3 bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-800">
                        <p className="font-bold">🔔 Attend Request Sent</p>
                        <p className="text-xs mt-0.5">Sent: {new Date(b.attendRequest.requestedAt).toLocaleString('en-IN')}</p>
                        {b.attendRequest.reviewedAt && (
                          <p className="text-xs">Reviewed: {new Date(b.attendRequest.reviewedAt).toLocaleString('en-IN')} — {b.attendRequest.status}</p>
                        )}
                      </div>
                    )}
                    <div className="col-span-2 sm:col-span-3 border-t pt-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                        <p>📧 Confirmation to <strong>{b.email}</strong></p>
                        <p>⏰ Please arrive <strong>15 minutes early</strong></p>
                        <p>🧴 Complimentary robe, slippers & herbal tea included</p>
                        <p>📍 Spa Reception: Level B1, Hoto.tours</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/spa" className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-8 py-3 rounded-xl text-sm">
          + Book Another Treatment
        </Link>
      </div>
    </div>
  );
}
