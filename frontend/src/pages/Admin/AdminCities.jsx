import React, { useState, useRef, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { cityHotelAPI } from '../../services/api';
import toast from 'react-hot-toast';

function ImageUpload({ images, onChange, multi=false }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  const processFiles = files => {
    const arr = [...files].slice(0, multi ? 5 : 1);
    arr.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => {
        onChange(prev => multi ? [...prev, e.target.result].slice(0,5) : [e.target.result]);
      };
      reader.readAsDataURL(f);
    });
  };

  const onDrop = e => { e.preventDefault(); setDrag(false); processFiles(e.dataTransfer.files); };
  const onDrag = e => { e.preventDefault(); setDrag(true); };
  const onLeave = () => setDrag(false);
  const remove = i => onChange(prev => prev.filter((_,j)=>j!==i));

  return (
    <div>
      <div
        onClick={() => ref.current?.click()}
        onDrop={onDrop} onDragOver={onDrag} onDragLeave={onLeave}
        style={{border:'2px dashed '+(drag?'#c9a84c':'#e2e8f0'),borderRadius:12,padding:'20px 16px',textAlign:'center',cursor:'pointer',background:drag?'#fffbeb':'#fafbfc',transition:'all .18s'}}>
        <input ref={ref} type="file" accept="image/*" multiple={multi} style={{display:'none'}} onChange={e=>processFiles(e.target.files)}/>
        <p style={{fontSize:22,marginBottom:6}}>📷</p>
        <p style={{fontSize:12.5,color:'#64748b',fontWeight:600}}>Click or drag to upload {multi?'images':'image'}</p>
        <p style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{multi?'Up to 5 images':'Single image'} · JPG, PNG, WebP</p>
      </div>
      {images.length > 0 && (
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
          {images.map((img,i) => (
            <div key={i} style={{position:'relative',width:72,height:72,borderRadius:10,overflow:'hidden',border:'1.5px solid #e2e8f0'}}>
              <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              <button onClick={()=>remove(i)} style={{position:'absolute',top:2,right:2,width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,.6)',border:'none',color:'#fff',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, setter, placeholder, type='text', required=false }) {
  return (
    <div>
      <label className="adm-label">{label}{required&&<span style={{color:'#ef4444',marginLeft:2}}>*</span>}</label>
      <input type={type} value={value} onChange={e=>setter(e.target.value)} placeholder={placeholder||label} className="adm-input"/>
    </div>
  );
}

export default function AdminCities() {
  const [cities,    setCities]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [view,      setView]      = useState('list'); // 'list' | 'city' | 'hotel'
  const [selCity,   setSelCity]   = useState(null);
  const [hotels,    setHotels]    = useState([]);
  const [loadH,     setLoadH]     = useState(false);

  // City form
  const [cName,  setCName]  = useState('');
  const [cCode,  setCCode]  = useState('');
  const [cState, setCState] = useState('');
  const [cImgs,  setCImgs]  = useState([]);
  const [cSaving,setCsav]   = useState(false);

  // Hotel form
  const [hName,  setHName]  = useState('');
  const [hDesc,  setHDesc]  = useState('');
  const [hLoc,   setHLoc]   = useState('');
  const [hWeb,   setHWeb]   = useState('');
  const [hAmId,  setHAmId]  = useState('');
  const [hImgs,  setHImgs]  = useState([]);
  const [hSaving,setHsav]   = useState(false);
  const [showH,  setShowH]  = useState(false);

  const loadCities = async () => {
    setLoading(true);
    try { const {data} = await cityHotelAPI.getCities(); setCities(data.data.cities||[]); }
    catch { toast.error('Failed to load cities'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadCities(); }, []);

  const loadHotels = async cid => {
    setLoadH(true); setHotels([]);
    try { const {data} = await cityHotelAPI.getHotels(cid); setHotels(data.data.hotels||[]); }
    catch { toast.error('Failed to load hotels'); }
    finally { setLoadH(false); }
  };

  const saveCity = async () => {
    if (!cName.trim() || !cCode.trim()) { toast.error('City name and code required'); return; }
    setCsav(true);
    try {
      const {data} = await cityHotelAPI.createCity({ name:cName, iataCode:cCode.toUpperCase(), state:cState, images:cImgs });
      toast.success('City saved!');
      setCName(''); setCCode(''); setCState(''); setCImgs([]);
      await loadCities();
      setSelCity(data.data.city);
      setShowH(true);
      setView('hotel');
    } catch(e) { toast.error(e.response?.data?.message||'Failed to save city'); }
    finally { setCsav(false); }
  };

  const saveHotel = async () => {
    if (!selCity) { toast.error('Select a city first'); return; }
    if (!hName.trim()) { toast.error('Hotel name required'); return; }
    setHsav(true);
    try {
      await cityHotelAPI.createHotel(selCity._id, { name:hName, description:hDesc, location:hLoc, website:hWeb, amadeusHotelId:hAmId, images:hImgs });
      toast.success('Hotel added!');
      setHName(''); setHDesc(''); setHLoc(''); setHWeb(''); setHAmId(''); setHImgs([]);
      loadHotels(selCity._id);
    } catch(e) { toast.error(e.response?.data?.message||'Failed to save hotel'); }
    finally { setHsav(false); }
  };

  const openCity = city => {
    setSelCity(city);
    loadHotels(city._id);
    setView('hotel');
    setShowH(false);
  };

  return (
    <AdminLayout title="Cities & Hotels" subtitle="Manage your hotel portfolio locations">
      {/* Breadcrumb */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20,fontSize:12.5}}>
        <button onClick={()=>{setView('list');setSelCity(null);}} style={{background:'none',border:'none',cursor:'pointer',color:view==='list'?'#c9a84c':'#64748b',fontWeight:view==='list'?700:500,fontFamily:"'DM Sans',sans-serif",fontSize:12.5,padding:0}}>All Cities</button>
        {selCity && (<><span style={{color:'#d1d5db'}}>/</span><button onClick={()=>setView('hotel')} style={{background:'none',border:'none',cursor:'pointer',color:view==='hotel'?'#c9a84c':'#64748b',fontWeight:view==='hotel'?700:500,fontFamily:"'DM Sans',sans-serif",fontSize:12.5,padding:0}}>{selCity.name}</button></>)}
        {view==='city' && (<><span style={{color:'#d1d5db'}}>/</span><span style={{color:'#c9a84c',fontWeight:700}}>Add City</span></>)}
      </div>

      {view==='list' && (
        <>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <div>
              <h2 className="adm-serif" style={{fontSize:20,fontWeight:700,color:'#0f172a'}}>{cities.length} Cities</h2>
              <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>Click a city to manage hotels</p>
            </div>
            <button onClick={()=>setView('city')} className="adm-btn adm-btn-gold">+ Add City</button>
          </div>

          {loading ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
              {[...Array(6)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:160,borderRadius:16}}/>)}
            </div>
          ) : cities.length===0 ? (
            <div className="adm-card" style={{padding:'64px',textAlign:'center',color:'#94a3b8'}}>
              <p style={{fontSize:36,marginBottom:12}}>🏙</p>
              <p style={{fontSize:14,fontWeight:600,marginBottom:6}}>No cities yet</p>
              <p style={{fontSize:12,marginBottom:20}}>Add your first city to get started</p>
              <button onClick={()=>setView('city')} className="adm-btn adm-btn-gold">+ Add First City</button>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
              {cities.map((c,i) => (
                <div key={c._id} className={'adm-card adm-card-gold adm-fadein d'+(Math.min(i+1,6))}
                  style={{overflow:'hidden',cursor:'pointer'}} onClick={()=>openCity(c)}>
                  {c.images?.[0] ? (
                    <div style={{height:110,background:'#f1f5f9',overflow:'hidden'}}>
                      <img src={c.images[0]} alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .3s'}}
                        onMouseEnter={e=>e.target.style.transform='scale(1.05)'}
                        onMouseLeave={e=>e.target.style.transform='none'}/>
                    </div>
                  ) : (
                    <div style={{height:110,background:'linear-gradient(135deg,#fffbeb,#fef3c7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40}}>🏙</div>
                  )}
                  <div style={{padding:'12px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <p style={{fontWeight:700,fontSize:14,color:'#1e293b'}}>{c.name}</p>
                      <span style={{background:'#f1f5f9',color:'#475569',borderRadius:99,padding:'2px 8px',fontSize:10.5,fontWeight:700}}>{c.iataCode}</span>
                    </div>
                    {c.state && <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>{c.state}</p>}
                    <div style={{marginTop:8,display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#c9a84c',fontWeight:600}}>
                      <span>Manage Hotels →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view==='city' && (
        <div style={{maxWidth:600}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
            <button onClick={()=>setView('list')} className="adm-btn adm-btn-ghost" style={{padding:'7px 13px',fontSize:12}}>← Back</button>
            <div>
              <h2 className="adm-serif" style={{fontSize:20,fontWeight:700,color:'#0f172a'}}>Add New City</h2>
              <p style={{fontSize:11.5,color:'#94a3b8',marginTop:1}}>After saving, you can add hotels</p>
            </div>
          </div>
          <div className="adm-card" style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Field label="City Name" value={cName} setter={setCName} required placeholder="e.g. Chennai"/>
              <Field label="IATA Code" value={cCode} setter={setCCode} required placeholder="e.g. MAA"/>
            </div>
            <Field label="State" value={cState} setter={setCState} placeholder="e.g. Tamil Nadu"/>
            <div>
              <label className="adm-label">City Image</label>
              <ImageUpload images={cImgs} onChange={setCImgs} multi={false}/>
            </div>
            <button onClick={saveCity} disabled={cSaving} className="adm-btn adm-btn-gold" style={{width:'100%',padding:'11px'}}>
              {cSaving ? 'Saving City…' : '💾 Save City & Add Hotels →'}
            </button>
          </div>
        </div>
      )}

      {view==='hotel' && selCity && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr',gap:24,alignItems:'start'}}>
          {/* Hotels List */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <h2 className="adm-serif" style={{fontSize:18,fontWeight:700,color:'#0f172a'}}>Hotels in {selCity.name}</h2>
                <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>{hotels.length} properties</p>
              </div>
              <button onClick={()=>setShowH(h=>!h)} className="adm-btn adm-btn-gold" style={{fontSize:12,padding:'7px 14px'}}>
                {showH ? '− Hide Form' : '+ Add Hotel'}
              </button>
            </div>

            {loadH ? (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[...Array(3)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:80,borderRadius:14}}/>)}
              </div>
            ) : hotels.length===0 ? (
              <div className="adm-card" style={{padding:40,textAlign:'center',color:'#94a3b8'}}>
                <p style={{fontSize:28,marginBottom:8}}>🏨</p>
                <p style={{fontSize:13}}>No hotels yet</p>
                <p style={{fontSize:12,marginTop:4}}>Add the first hotel using the form</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {hotels.map((h,i) => (
                  <div key={h._id} className={'adm-card adm-fadein d'+(Math.min(i+1,6))} style={{padding:0,overflow:'hidden'}}>
                    <div style={{display:'flex',gap:0}}>
                      {h.images?.[0] && (
                        <div style={{width:80,flexShrink:0,overflow:'hidden'}}>
                          <img src={h.images[0]} alt={h.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        </div>
                      )}
                      <div style={{padding:'12px 14px',flex:1}}>
                        <p style={{fontWeight:700,fontSize:13.5,color:'#1e293b',marginBottom:2}}>{h.name}</p>
                        {h.location && <p style={{fontSize:11.5,color:'#64748b',marginBottom:3}}>📍 {h.location}</p>}
                        {h.description && <p style={{fontSize:11.5,color:'#94a3b8',lineHeight:1.4}}>{h.description.slice(0,80)}{h.description.length>80?'…':''}</p>}
                        {h.website && <a href={h.website} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#c9a84c',fontWeight:600}}>🔗 Website</a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hotel Form */}
          {showH && (
            <div className="adm-card adm-fadein" style={{padding:22,position:'sticky',top:80}}>
              <h3 className="adm-serif" style={{fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:16}}>
                Add Hotel to {selCity.name}
              </h3>
              <div style={{display:'flex',flexDirection:'column',gap:13}}>
                <Field label="Hotel Name" value={hName} setter={setHName} required placeholder="e.g. The Grand Chennai"/>
                <div>
                  <label className="adm-label">Description</label>
                  <textarea value={hDesc} onChange={e=>setHDesc(e.target.value)} placeholder="Describe the hotel…" className="adm-input" rows={3}/>
                </div>
                <Field label="Location / Address" value={hLoc} setter={setHLoc} placeholder="Street, Area"/>
                <Field label="Website URL" value={hWeb} setter={setHWeb} placeholder="https://…"/>
                <Field label="Amadeus Hotel ID" value={hAmId} setter={setHAmId} placeholder="e.g. BWLONDON"/>
                <div>
                  <label className="adm-label">Hotel Images</label>
                  <ImageUpload images={hImgs} onChange={setHImgs} multi={true}/>
                </div>
                <button onClick={saveHotel} disabled={hSaving} className="adm-btn adm-btn-gold" style={{width:'100%',padding:'11px'}}>
                  {hSaving ? 'Saving Hotel…' : '🏨 Add Hotel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
