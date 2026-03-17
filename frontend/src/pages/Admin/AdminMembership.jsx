import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { membershipAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TIER_CFG = {
  silver:   { grad:'linear-gradient(135deg,#94a3b8,#64748b)', accent:'#64748b', bg:'#f8fafc', border:'#e2e8f0', glow:'rgba(100,116,139,.2)', icon:'🥈', label:'Silver' },
  gold:     { grad:'linear-gradient(135deg,#e8c97a,#c9a84c)', accent:'#c9a84c', bg:'#fffbeb', border:'#fde68a', glow:'rgba(201,168,76,.25)',  icon:'🥇', label:'Gold'   },
  platinum: { grad:'linear-gradient(135deg,#a78bfa,#7c3aed)', accent:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe', glow:'rgba(124,58,237,.2)',   icon:'💎', label:'Platinum Elite' },
};

function PkgCard({ pkg, onSave }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({ price:pkg.price, freeBookings:pkg.freeBookings, benefits:(pkg.benefits||[]).join('\n') });
  const cfg = TIER_CFG[pkg.tier] || TIER_CFG.silver;

  useEffect(() => { setForm({ price:pkg.price, freeBookings:pkg.freeBookings, benefits:(pkg.benefits||[]).join('\n') }); }, [pkg]);

  const save = async () => {
    setSaving(true);
    try {
      await membershipAPI.updatePackage(pkg.tier, { price:Number(form.price), freeBookings:Number(form.freeBookings), benefits:form.benefits.split('\n').map(b=>b.trim()).filter(Boolean) });
      toast.success(pkg.name+' updated'); setEditing(false); onSave();
    } catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="adm-fadein" style={{borderRadius:20,overflow:'hidden',border:'1.5px solid '+cfg.border,boxShadow:'0 4px 24px '+cfg.glow,transition:'all .24s',background:cfg.bg}}>
      {/* Gradient Header */}
      <div style={{background:cfg.grad,padding:'22px 20px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-24,right:-24,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,.1)'}}/>
        <div style={{position:'absolute',bottom:-16,left:48,width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,.07)'}}/>
        <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:32}}>{cfg.icon}</span>
            <div>
              <p style={{color:'#fff',fontWeight:800,fontSize:16,lineHeight:1.1,fontFamily:"'Cormorant Garamond',serif"}}>{pkg.name}</p>
              <p style={{color:'rgba(255,255,255,.65)',fontSize:10,textTransform:'uppercase',letterSpacing:'.12em',marginTop:3}}>{cfg.label} Tier</p>
            </div>
          </div>
          <button onClick={()=>setEditing(e=>!e)}
            style={{background:'rgba(255,255,255,.18)',border:'1px solid rgba(255,255,255,.3)',color:'#fff',borderRadius:99,padding:'6px 16px',fontSize:11.5,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .16s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.28)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.18)'}>
            {editing ? '✕ Cancel' : '✏ Edit'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{padding:20}}>
        {!editing ? (
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <div style={{background:'#fff',border:'1px solid '+cfg.border,borderRadius:13,padding:14,textAlign:'center',boxShadow:'0 2px 8px '+cfg.glow}}>
                <p style={{fontWeight:800,fontSize:22,color:cfg.accent,fontVariantNumeric:'tabular-nums'}}>₹{(pkg.price||0).toLocaleString('en-IN')}</p>
                <p style={{fontSize:10.5,color:'#94a3b8',marginTop:2}}>per year</p>
              </div>
              <div style={{background:'#fff',border:'1px solid '+cfg.border,borderRadius:13,padding:14,textAlign:'center',boxShadow:'0 2px 8px '+cfg.glow}}>
                <p style={{fontWeight:800,fontSize:22,color:cfg.accent}}>{pkg.freeBookings}</p>
                <p style={{fontSize:10.5,color:'#94a3b8',marginTop:2}}>free bookings</p>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {(pkg.benefits||[]).map(b=>(
                <div key={b} style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:12.5,color:'#475569'}}>
                  <span style={{color:cfg.accent,fontWeight:800,flexShrink:0,marginTop:1}}>✓</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="adm-scalein" style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label className="adm-label">Price (₹/year)</label>
                <input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="adm-input"/>
              </div>
              <div>
                <label className="adm-label">Free Bookings</label>
                <input type="number" value={form.freeBookings} onChange={e=>setForm({...form,freeBookings:e.target.value})} className="adm-input"/>
              </div>
            </div>
            <div>
              <label className="adm-label">Benefits (one per line)</label>
              <textarea value={form.benefits} onChange={e=>setForm({...form,benefits:e.target.value})} className="adm-input" rows={5}/>
            </div>
            <button onClick={save} disabled={saving} className="adm-btn adm-btn-gold" style={{width:'100%'}}>
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminMembership() {
  const [pkgs,    setPkgs]    = useState([]);
  const [mems,    setMems]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('packages');
  const [search,  setSearch]  = useState('');

  const load = async () => {
    try {
      const [pRes,mRes] = await Promise.all([membershipAPI.getPackages(), membershipAPI.getAll().catch(()=>({data:{data:{memberships:[]}}}))] );
      setPkgs(pRes.data.data.packages||[]);
      setMems(mRes.data.data.memberships||[]);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const order = {silver:0,gold:1,platinum:2};
  const sorted = [...pkgs].sort((a,b) => (order[a.tier]||0)-(order[b.tier]||0));

  const filteredMems = mems.filter(m => {
    const q = search.toLowerCase();
    return !q || m.fullName?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Membership Packages" subtitle="Configure tier benefits and manage members">
      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24}}>
        {[
          {l:'Total Members',  v:mems.length,                                        color:'#c9a84c',bg:'linear-gradient(135deg,#fffbeb,#fef3c7)'},
          {l:'Silver',         v:mems.filter(m=>m.tier==='silver').length,            color:'#64748b',bg:'linear-gradient(135deg,#f8fafc,#f1f5f9)'},
          {l:'Gold',           v:mems.filter(m=>m.tier==='gold').length,              color:'#c9a84c',bg:'linear-gradient(135deg,#fffbeb,#fef3c7)'},
          {l:'Platinum',       v:mems.filter(m=>m.tier==='platinum').length,          color:'#7c3aed',bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)'},
        ].map((s,i)=>(
          <div key={s.l} className={'adm-stat adm-fadein d'+(i+1)} style={{'--stat-c':s.color,background:s.bg}}>
            <p style={{fontSize:26,fontWeight:800,color:'#0f172a'}}>{s.v}</p>
            <p style={{fontSize:11,color:'#64748b',marginTop:4}}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{marginBottom:20}}>
        <div className="adm-tabs" style={{width:'fit-content'}}>
          {[{k:'packages',l:'📦 Packages'},{k:'members',l:'👥 Members'}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className={'adm-tab'+(tab===t.k?' active':'')} style={{padding:'8px 24px'}}>{t.l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}>
          {[...Array(3)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:320,borderRadius:20}}/>)}
        </div>
      ) : tab==='packages' ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          {sorted.map(p => <PkgCard key={p.tier} pkg={p} onSave={load}/>)}
        </div>
      ) : (
        <div className="adm-card" style={{overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <p style={{fontWeight:700,color:'#1e293b',fontSize:13.5}}>{mems.length} total memberships</p>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members…" className="adm-input" style={{width:240}}/>
          </div>
          {filteredMems.length===0 ? (
            <div style={{padding:48,textAlign:'center',color:'#94a3b8'}}>
              <p style={{fontSize:28,marginBottom:8}}>👥</p>
              <p>{search?'No matching members':'No memberships yet'}</p>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table className="adm-table">
                <thead><tr>{['Member ID','Name / Email','Tier','Amount Paid','Free Left','Member Since'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredMems.map((m,i)=>{
                    const cfg = TIER_CFG[m.tier]||TIER_CFG.silver;
                    return (
                      <tr key={m._id} className={'adm-fadein d'+(Math.min(i%8+1,8))}>
                        <td><span style={{fontFamily:'monospace',fontSize:11,color:'#94a3b8'}}>{m.membershipId}</span></td>
                        <td><p style={{fontWeight:600,color:'#1e293b'}}>{m.fullName}</p><p style={{fontSize:10.5,color:'#94a3b8'}}>{m.email}</p></td>
                        <td>
                          <span style={{display:'inline-flex',alignItems:'center',gap:5,background:cfg.bg,color:cfg.accent,border:'1px solid '+cfg.border,borderRadius:99,padding:'3px 10px',fontSize:11,fontWeight:700}}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td style={{fontWeight:700,color:'#1e293b'}}>₹{(m.pricePaid||0).toLocaleString('en-IN')}</td>
                        <td><span style={{fontWeight:800,fontSize:14,color:cfg.accent}}>{m.freeBookingsRemaining}</span></td>
                        <td style={{color:'#94a3b8',fontSize:12}}>{new Date(m.createdAt).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
