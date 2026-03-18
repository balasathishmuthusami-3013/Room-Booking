import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { hotelAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CITIES = [
  {code:'MAA',name:'Chennai',    emoji:'🏙'},
  {code:'CJB',name:'Coimbatore', emoji:'🌿'},
  {code:'IXM',name:'Madurai',    emoji:'⛩'},
  {code:'TRZ',name:'Trichy',     emoji:'🕌'},
  {code:'SXV',name:'Salem',      emoji:'🌄'},
];

const REASONS = ['Seasonal Discount','Festival Offer','VIP Guest','Corporate Rate','Flash Sale','Weekend Special','Last Minute Deal'];

export default function AdminRateOverrides() {
  const [overrides,  setOverrides]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [city,       setCity]       = useState('MAA');
  const [hotels,     setHotels]     = useState([]);
  const [loadingH,   setLH]         = useState(false);
  const [form, setForm] = useState({hotelId:'',offerId:'',overridePrice:'',note:'',reason:'',validFrom:'',validTo:''});
  const [saving, setSaving] = useState(false);

  const loadOverrides = async () => {
    setLoading(true);
    try { const {data} = await hotelAPI.getRateOverrides(); setOverrides(data.data.overrides||[]); }
    catch { toast.error('Failed to load overrides'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadOverrides(); }, []);

  const loadHotels = async c => {
    setLH(true); setHotels([]); setForm(f=>({...f,hotelId:''}));
    try { const {data} = await hotelAPI.getHotels(c); setHotels(data.data.hotels||[]); }
    catch { toast.error('Failed to load hotels'); }
    finally { setLH(false); }
  };

  const submit = async () => {
    if (!form.hotelId || !form.overridePrice) { toast.error('Select hotel and enter price'); return; }
    setSaving(true);
    try {
      await hotelAPI.createRateOverride({ hotelId:form.hotelId, offerId:form.offerId||null, overridePrice:Number(form.overridePrice), note:form.note, reason:form.reason, validFrom:form.validFrom||null, validTo:form.validTo||null });
      toast.success('Rate override saved!');
      setForm({hotelId:'',offerId:'',overridePrice:'',note:'',reason:'',validFrom:'',validTo:''});
      loadOverrides();
    } catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm('Remove this override?')) return;
    await hotelAPI.deleteRateOverride(id).catch(()=>{});
    loadOverrides(); toast.success('Override removed');
  };

  const selHotel = hotels.find(h=>h.hotelId===form.hotelId);

  return (
    <AdminLayout title="Rate Overrides" subtitle="Override Amadeus live pricing for promotions and special events">
      {/* Hero Banner */}
      <div style={{background:'linear-gradient(135deg,#0c0f16 0%,#1a2744 50%,#0c0f16 100%)',borderRadius:20,padding:'28px 32px',marginBottom:24,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-30,right:-30,width:160,height:160,borderRadius:'50%',background:'rgba(201,168,76,.07)'}}/>
        <div style={{position:'absolute',bottom:-20,left:100,width:110,height:110,borderRadius:'50%',background:'rgba(99,102,241,.08)'}}/>
        <div style={{position:'absolute',top:20,right:180,width:70,height:70,borderRadius:'50%',background:'rgba(16,185,129,.06)'}}/>
        <div style={{position:'relative'}}>
          <p style={{color:'#c9a84c',fontSize:10,fontWeight:800,letterSpacing:'.2em',textTransform:'uppercase',marginBottom:6}}>Rate Management</p>
          <h2 className="adm-serif" style={{color:'#f8fafc',fontSize:26,fontWeight:700,lineHeight:1.2,marginBottom:8}}>Override Live Amadeus Pricing</h2>
          <p style={{color:'#64748b',fontSize:13,lineHeight:1.7,maxWidth:520}}>Set custom rates for specific hotels during seasonal offers, events, or promotional periods. Overrides take precedence over Amadeus live rates.</p>
          <div style={{display:'flex',gap:14,marginTop:16}}>
            {[{v:overrides.length,l:'Active Overrides'},{v:overrides.filter(o=>o.reason).length,l:'With Reasons'},{v:new Set(overrides.map(o=>o.hotelId)).size,l:'Hotels Overridden'}].map(s=>(
              <div key={s.l} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,padding:'10px 18px',textAlign:'center'}}>
                <p style={{fontSize:22,fontWeight:800,color:'#c9a84c'}}>{s.v}</p>
                <p style={{fontSize:10.5,color:'#4b5563',marginTop:1}}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,alignItems:'start'}}>
        {/* Form */}
        <div>
          <div className="adm-card" style={{padding:22}}>
            <h3 className="adm-serif" style={{fontSize:17,fontWeight:700,color:'#0f172a',marginBottom:18}}>New Rate Override</h3>

            {/* City */}
            <div style={{marginBottom:16}}>
              <label className="adm-label">Select City</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {CITIES.map(c=>(
                  <button key={c.code} onClick={()=>{setCity(c.code);loadHotels(c.code);}}
                    style={{padding:'6px 13px',borderRadius:10,border:city===c.code?'1.5px solid #c9a84c':'1px solid #e2e8f0',background:city===c.code?'#fffbeb':'#fff',cursor:'pointer',fontSize:12,fontWeight:600,color:city===c.code?'#92400e':'#64748b',transition:'all .15s'}}>
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hotel */}
            <div style={{marginBottom:14}}>
              <label className="adm-label">Hotel</label>
              {loadingH ? (
                <div className="adm-shimmer" style={{height:40,borderRadius:11}}/>
              ) : (
                <select value={form.hotelId} onChange={e=>setForm({...form,hotelId:e.target.value})} className="adm-input">
                  <option value="">Select a hotel…</option>
                  {hotels.map(h=><option key={h.hotelId} value={h.hotelId}>{h.name}</option>)}
                </select>
              )}
              {selHotel && <p style={{fontSize:11,color:'#94a3b8',marginTop:4}}>Hotel ID: {selHotel.hotelId}</p>}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <label className="adm-label">Override Price (₹)</label>
                <input type="number" value={form.overridePrice} onChange={e=>setForm({...form,overridePrice:e.target.value})} placeholder="e.g. 4500" className="adm-input"/>
              </div>
              <div>
                <label className="adm-label">Offer ID (optional)</label>
                <input value={form.offerId} onChange={e=>setForm({...form,offerId:e.target.value})} placeholder="Amadeus Offer ID" className="adm-input"/>
              </div>
              <div>
                <label className="adm-label">Valid From</label>
                <input type="date" value={form.validFrom} onChange={e=>setForm({...form,validFrom:e.target.value})} className="adm-input"/>
              </div>
              <div>
                <label className="adm-label">Valid To</label>
                <input type="date" value={form.validTo} onChange={e=>setForm({...form,validTo:e.target.value})} className="adm-input"/>
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <label className="adm-label">Reason</label>
              <select value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} className="adm-input">
                <option value="">Select reason…</option>
                {REASONS.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{marginBottom:18}}>
              <label className="adm-label">Note</label>
              <textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Additional details…" className="adm-input" rows={2}/>
            </div>

            <button onClick={submit} disabled={saving} className="adm-btn adm-btn-gold" style={{width:'100%'}}>
              {saving ? 'Saving…' : '💾 Save Rate Override'}
            </button>
          </div>
        </div>

        {/* List */}
        <div>
          <h3 className="adm-serif" style={{fontSize:17,fontWeight:700,color:'#0f172a',marginBottom:14}}>Active Overrides</h3>
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[...Array(4)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:90,borderRadius:14}}/>)}
            </div>
          ) : overrides.length===0 ? (
            <div className="adm-card" style={{padding:40,textAlign:'center',color:'#94a3b8'}}>
              <p style={{fontSize:28,marginBottom:8}}>💰</p>
              <p style={{fontSize:13}}>No rate overrides yet</p>
              <p style={{fontSize:12,marginTop:4}}>Create your first override on the left</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {overrides.map((o,i)=>(
                <div key={o._id||i} className={'adm-card adm-fadein d'+(Math.min(i+1,6))} style={{padding:16,borderLeft:'3px solid #c9a84c'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:700,fontSize:13,color:'#1e293b'}}>{o.hotelName||o.hotelId}</p>
                      {o.reason && <span style={{background:'#fffbeb',color:'#92400e',border:'1px solid #fde68a',borderRadius:99,fontSize:10,fontWeight:700,padding:'1px 8px',marginTop:3,display:'inline-block'}}>{o.reason}</span>}
                    </div>
                    <button onClick={()=>del(o._id)} style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626',fontSize:16,padding:'0 2px'}}>×</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div style={{background:'#fffbeb',borderRadius:8,padding:'6px 10px'}}>
                      <p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',color:'#94a3b8',marginBottom:1}}>Override Price</p>
                      <p style={{fontSize:16,fontWeight:800,color:'#c9a84c'}}>₹{Number(o.overridePrice).toLocaleString('en-IN')}</p>
                    </div>
                    {(o.validFrom||o.validTo) && (
                      <div style={{background:'#f8fafc',borderRadius:8,padding:'6px 10px'}}>
                        <p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',color:'#94a3b8',marginBottom:1}}>Valid Period</p>
                        <p style={{fontSize:11,color:'#475569',fontWeight:600}}>
                          {o.validFrom?new Date(o.validFrom).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'} → {o.validTo?new Date(o.validTo).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}
                        </p>
                      </div>
                    )}
                  </div>
                  {o.note && <p style={{fontSize:11.5,color:'#64748b',marginTop:8,paddingTop:8,borderTop:'1px solid #f8fafc'}}>{o.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
