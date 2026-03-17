import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { hotelAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CITIES = [
  {code:'MAA',name:'Chennai',    emoji:'🏙', desc:'Metropolitan'},
  {code:'CJB',name:'Coimbatore', emoji:'🌿', desc:'Garden City'},
  {code:'IXM',name:'Madurai',    emoji:'⛩', desc:'Temple City'},
  {code:'TRZ',name:'Trichy',     emoji:'🕌', desc:'Heritage City'},
  {code:'SXV',name:'Salem',      emoji:'🌄', desc:'Steel City'},
];

const TYPE_COLORS = {
  STANDARD: {bg:'#f1f5f9',color:'#475569',border:'#e2e8f0'},
  DELUXE:   {bg:'#fffbeb',color:'#92400e',border:'#fde68a'},
  SUITE:    {bg:'#f5f3ff',color:'#5b21b6',border:'#ddd6fe'},
  TWIN:     {bg:'#ecfeff',color:'#155e75',border:'#a5f3fc'},
};

function TypeBadge({ type }) {
  const t = TYPE_COLORS[type?.toUpperCase()] || TYPE_COLORS.STANDARD;
  return (
    <span style={{background:t.bg,color:t.color,border:'1px solid '+t.border,borderRadius:99,padding:'2px 9px',fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>
      {type||'Standard'}
    </span>
  );
}

export default function AdminRooms() {
  const [city,    setCity]    = useState('MAA');
  const [hotels,  setHotels]  = useState([]);
  const [rooms,   setRooms]   = useState([]);
  const [selHotel,setSel]     = useState(null);
  const [loadH,   setLH]      = useState(false);
  const [loadR,   setLR]      = useState(false);
  const [search,  setSearch]  = useState('');
  const [typeFilter, setType] = useState('all');

  const fetchHotels = async c => {
    setLH(true); setHotels([]); setRooms([]); setSel(null);
    try { const {data} = await hotelAPI.getHotels(c); setHotels(data.data.hotels||[]); }
    catch { toast.error('Failed to load hotels'); }
    finally { setLH(false); }
  };

  const fetchRooms = async hid => {
    setLR(true); setRooms([]);
    const today = new Date();
    const ci = today.toISOString().split('T')[0];
    const co = new Date(today.getTime()+2*86400000).toISOString().split('T')[0];
    try { const {data} = await hotelAPI.getHotelRooms(hid,{checkIn:ci,checkOut:co,adults:2}); setRooms(data.data.offers||[]); }
    catch { toast.error('Failed to load rooms'); }
    finally { setLR(false); }
  };

  useEffect(() => { fetchHotels(city); }, [city]);

  const filtered = rooms.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.roomName?.toLowerCase().includes(q) || r.roomType?.toLowerCase().includes(q);
    const matchT = typeFilter==='all' || r.roomType?.toUpperCase()===typeFilter;
    return matchQ && matchT;
  });

  const types = [...new Set(rooms.map(r => r.roomType?.toUpperCase()).filter(Boolean))];

  return (
    <AdminLayout title="Rooms" subtitle="Live hotel & room availability via Amadeus API">
      {/* City Selector */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24}}>
        {CITIES.map(c => (
          <button key={c.code} onClick={() => setCity(c.code)}
            style={{padding:'14px 12px',borderRadius:14,border:city===c.code?'2px solid #c9a84c':'1.5px solid #e2e8f0',background:city===c.code?'linear-gradient(135deg,#fffbeb,#fef3c7)':'#fff',cursor:'pointer',transition:'all .18s',textAlign:'left',boxShadow:city===c.code?'0 4px 16px rgba(201,168,76,.18)':'0 1px 4px rgba(0,0,0,.04)'}}>
            <span style={{fontSize:22}}>{c.emoji}</span>
            <p style={{fontWeight:700,fontSize:13,color:city===c.code?'#92400e':'#1e293b',marginTop:6}}>{c.name}</p>
            <p style={{fontSize:10.5,color:'#94a3b8'}}>{c.desc}</p>
          </button>
        ))}
        <button onClick={() => fetchHotels(city)}
          style={{padding:'14px 12px',borderRadius:14,border:'1.5px dashed #e2e8f0',background:'#fafbfc',cursor:'pointer',transition:'all .18s',textAlign:'center',color:'#94a3b8',fontSize:12,fontWeight:600,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}}>
          <span style={{fontSize:22}}>↺</span>Refresh
        </button>
      </div>

      {/* Hotels */}
      <div className="adm-card" style={{marginBottom:20,overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h3 className="adm-serif" style={{fontSize:17,fontWeight:700,color:'#0f172a'}}>
              Hotels in {CITIES.find(c=>c.code===city)?.name}
            </h3>
            <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>{hotels.length} properties found via Amadeus</p>
          </div>
          {selHotel && (
            <div style={{display:'flex',alignItems:'center',gap:8,background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'6px 12px'}}>
              <span style={{fontSize:12,color:'#c9a84c'}}>●</span>
              <span style={{fontSize:12,fontWeight:600,color:'#92400e'}}>{selHotel.name}</span>
            </div>
          )}
        </div>
        <div style={{padding:'14px 16px'}}>
          {loadH ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
              {[...Array(6)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:80,borderRadius:12}}/>)}
            </div>
          ) : hotels.length===0 ? (
            <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}>
              <p style={{fontSize:28,marginBottom:8}}>🏨</p>
              <p style={{fontSize:13}}>No Amadeus hotels found for this city</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
              {hotels.map((h,i) => (
                <button key={h.hotelId||i} onClick={() => { setSel(h); fetchRooms(h.hotelId); }}
                  className="adm-fadein" style={{animationDelay:(i*.035)+'s',textAlign:'left',padding:'12px 14px',borderRadius:12,border:selHotel?.hotelId===h.hotelId?'2px solid #c9a84c':'1.5px solid #f1f5f9',background:selHotel?.hotelId===h.hotelId?'#fffbeb':'#fff',cursor:'pointer',transition:'all .18s',boxShadow:selHotel?.hotelId===h.hotelId?'0 4px 14px rgba(201,168,76,.18)':'0 1px 3px rgba(0,0,0,.04)'}}>
                  <div style={{width:32,height:32,borderRadius:8,background:selHotel?.hotelId===h.hotelId?'linear-gradient(135deg,#c9a84c,#9b7a2e)':'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,marginBottom:8}}>🏨</div>
                  <p style={{fontWeight:600,color:selHotel?.hotelId===h.hotelId?'#92400e':'#1e293b',fontSize:12,lineHeight:1.3,marginBottom:2}}>{h.name}</p>
                  <p style={{fontSize:10,color:'#94a3b8'}}>{h.hotelId}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rooms */}
      {selHotel && (
        <div className="adm-card adm-fadein" style={{overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
              <div>
                <h3 className="adm-serif" style={{fontSize:17,fontWeight:700,color:'#0f172a'}}>
                  Rooms at {selHotel.name}
                </h3>
                <p style={{fontSize:11.5,color:'#94a3b8',marginTop:2}}>Live Amadeus rates · Today +2 days</p>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search rooms..." className="adm-input" style={{width:180,padding:'7px 12px',fontSize:12}}/>
                <select value={typeFilter} onChange={e=>setType(e.target.value)} className="adm-input" style={{width:130,padding:'7px 12px',fontSize:12}}>
                  <option value="all">All Types</option>
                  {types.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {loadR ? (
            <div style={{padding:16,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
              {[...Array(6)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:200,borderRadius:14}}/>)}
            </div>
          ) : filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'48px',color:'#94a3b8'}}>
              <p style={{fontSize:28,marginBottom:8}}>🌐</p>
              <p style={{fontSize:13,fontWeight:600}}>No live rates available</p>
              <p style={{fontSize:12,marginTop:4}}>Amadeus may have limited inventory for this hotel</p>
            </div>
          ) : (
            <div style={{padding:16,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
              {filtered.map((room,i) => (
                <div key={room.offerId||i} className="adm-fadein" style={{animationDelay:(i*.04)+'s',background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:14,padding:16,transition:'all .2s',boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(201,168,76,.3)';e.currentTarget.style.boxShadow='0 8px 24px rgba(201,168,76,.12)';e.currentTarget.style.transform='translateY(-2px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#f1f5f9';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)';e.currentTarget.style.transform='none';}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:700,color:'#1e293b',fontSize:13,lineHeight:1.3,marginBottom:4}}>{room.roomName}</p>
                      <TypeBadge type={room.roomType}/>
                    </div>
                    {room.isFallback && (
                      <span style={{background:'#fef9c3',color:'#854d0e',border:'1px solid #fef08a',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,flexShrink:0,marginLeft:8}}>Fallback</span>
                    )}
                  </div>
                  {room.description && <p style={{fontSize:11.5,color:'#64748b',marginBottom:10,lineHeight:1.5}}>{room.description}</p>}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12,fontSize:11.5,color:'#64748b'}}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}><span>🛏</span><span>{room.bedType} x{room.beds}</span></div>
                    <div style={{display:'flex',alignItems:'center',gap:4}}><span>👥</span><span>{room.adults} adults</span></div>
                    {room.policies?.checkIn && <div style={{display:'flex',alignItems:'center',gap:4}}><span>✓</span><span>In: {room.policies.checkIn}</span></div>}
                    {room.policies?.checkOut && <div style={{display:'flex',alignItems:'center',gap:4}}><span>↩</span><span>Out: {room.policies.checkOut}</span></div>}
                  </div>
                  <div style={{borderTop:'1px solid #f8fafc',paddingTop:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <p style={{fontSize:20,fontWeight:800,color:'#c9a84c',lineHeight:1}}>₹{room.basePrice?.toLocaleString('en-IN')}</p>
                      <p style={{fontSize:10.5,color:'#94a3b8',marginTop:2}}>/ night · ₹{room.totalPrice?.toLocaleString('en-IN')} total</p>
                    </div>
                    <span style={{background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0',fontSize:10.5,fontWeight:700,padding:'3px 10px',borderRadius:99}}>Live</span>
                  </div>
                  {room.amenities?.length > 0 && (
                    <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:4}}>
                      {room.amenities.slice(0,4).map(a => (
                        <span key={a} style={{background:'#f8fafc',border:'1px solid #f1f5f9',color:'#64748b',fontSize:10,padding:'2px 7px',borderRadius:99}}>{a.replace('_',' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {!loadR && filtered.length > 0 && (
            <div style={{padding:'10px 20px 16px',textAlign:'center',fontSize:11,color:'#94a3b8',borderTop:'1px solid #f8fafc'}}>
              Live data from Amadeus API — showing {filtered.length} of {rooms.length} rooms
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
