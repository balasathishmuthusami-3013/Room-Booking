import React, { useState } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SK = 'amigo_loyalty_v2';
const HK = 'amigo_loyalty_hist_v2';

const DEFAULTS = {
  tiers:[
    {id:'silver', name:'Silver Circle',  icon:'🥈',grad:'linear-gradient(135deg,#94a3b8,#64748b)',accent:'#64748b',benefits:['5% off dining','Welcome drink','Late checkout 1 PM','Member events'],minStays:0,  minPoints:0},
    {id:'gold',   name:'Gold Prestige',  icon:'🥇',grad:'linear-gradient(135deg,#e8c97a,#c9a84c)',accent:'#c9a84c',benefits:['10% off all services','Free airport transfer','Room upgrade','Priority booking','All Silver benefits'],minStays:5,  minPoints:500},
    {id:'platinum',name:'Platinum Elite',icon:'💎',grad:'linear-gradient(135deg,#a78bfa,#7c3aed)',accent:'#7c3aed',benefits:['20% off everything','Personal butler','Guaranteed suite upgrade','Private dining','Unlimited spa','All Gold benefits'],minStays:15, minPoints:1500},
    {id:'diamond', name:'Diamond Legacy',icon:'👑',grad:'linear-gradient(135deg,#67e8f9,#0891b2)',accent:'#0891b2',benefits:['25% off everything','Dedicated concierge','Lifetime suite guarantee','Annual gala invite','All Platinum benefits'],minStays:30, minPoints:5000},
  ],
  promos:[
    {id:'p1',title:'Summer Splash',     desc:'20% off all stays Jun–Aug',   icon:'☀',  active:true,  color:'#f59e0b'},
    {id:'p2',title:'Weekend Warrior',   desc:'Earn 2x points Fri–Sun',      icon:'🎯', active:true,  color:'#10b981'},
    {id:'p3',title:'Monsoon Magic',     desc:'Free spa session with stay',   icon:'🌧', active:false, color:'#6366f1'},
  ],
  events:[
    {id:'e1',title:'Diwali Gala Night',    desc:'Exclusive member dinner & entertainment',date:'2025-10-20',icon:'🪔',active:true},
    {id:'e2',title:'New Year Eve Party',   desc:'Rooftop celebration with live music',    date:'2025-12-31',icon:'🎉',active:true},
    {id:'e3',title:'Summer Wine Tasting',  desc:'Private wine & dine for Gold+ members',  date:'2025-06-15',icon:'🍷',active:false},
  ],
};

const loadData = () => { try { const s=localStorage.getItem(SK); if(s) return JSON.parse(s); } catch{} return DEFAULTS; };
const saveData = d => localStorage.setItem(SK,JSON.stringify(d));
const getHist  = () => { try { const s=localStorage.getItem(HK); if(s) return JSON.parse(s); } catch{} return []; };
const addHist  = e => { const h=getHist(); h.unshift({...e,ts:new Date().toISOString()}); localStorage.setItem(HK,JSON.stringify(h.slice(0,30))); };

function TierCard({ tier, onEdit }) {
  return (
    <div style={{borderRadius:16,overflow:'hidden',border:'1px solid #f1f5f9',boxShadow:'0 2px 12px rgba(0,0,0,.05)',background:'#fff'}}>
      <div style={{background:tier.grad,padding:'18px 16px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,.1)'}}/>
        <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:26}}>{tier.icon}</span>
            <div>
              <p style={{color:'#fff',fontWeight:800,fontSize:14,fontFamily:"'Cormorant Garamond',serif"}}>{tier.name}</p>
              <p style={{color:'rgba(255,255,255,.65)',fontSize:10,marginTop:1}}>{tier.minStays}+ stays · {tier.minPoints}+ pts</p>
            </div>
          </div>
          <button onClick={()=>onEdit(tier)} style={{background:'rgba(255,255,255,.2)',border:'1px solid rgba(255,255,255,.3)',color:'#fff',borderRadius:99,padding:'5px 12px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Edit</button>
        </div>
      </div>
      <div style={{padding:14,display:'flex',flexDirection:'column',gap:5}}>
        {tier.benefits.map(b=>(
          <div key={b} style={{display:'flex',gap:7,fontSize:12,color:'#475569'}}>
            <span style={{color:tier.accent,flexShrink:0}}>✓</span><span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditModal({ item, type, onSave, onClose }) {
  const [form, setForm] = useState(
    type==='tier' ? {name:item.name,benefits:[...item.benefits],newB:'',minStays:item.minStays,minPoints:item.minPoints} :
    type==='promo' ? {title:item.title,desc:item.desc,active:item.active} :
    {title:item.title,desc:item.desc,date:item.date,active:item.active}
  );
  const addB = () => { if(!form.newB?.trim()) return; setForm(f=>({...f,benefits:[...f.benefits,f.newB.trim()],newB:''})); };
  const rmB  = i => setForm(f=>({...f,benefits:f.benefits.filter((_,j)=>j!==i)}));

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e=>e.stopPropagation()}>
        <div style={{padding:'20px 22px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h2 className="adm-serif" style={{fontSize:18,fontWeight:700}}>Edit {type==='tier'?'Tier':type==='promo'?'Promotion':'Event'}</h2>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:'50%',background:'#f8fafc',border:'1px solid #e2e8f0',cursor:'pointer',color:'#64748b',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <div style={{padding:22,display:'flex',flexDirection:'column',gap:12}}>
          <div><label className="adm-label">Title</label><input value={form.title||form.name||''} onChange={e=>setForm({...form,[type==='tier'?'name':'title']:e.target.value})} className="adm-input"/></div>
          {type!=='tier' && <div><label className="adm-label">Description</label><textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} className="adm-input" rows={2}/></div>}
          {type==='tier' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label className="adm-label">Min Stays</label><input type="number" value={form.minStays} onChange={e=>setForm({...form,minStays:e.target.value})} className="adm-input"/></div>
                <div><label className="adm-label">Min Points</label><input type="number" value={form.minPoints} onChange={e=>setForm({...form,minPoints:e.target.value})} className="adm-input"/></div>
              </div>
              <div>
                <label className="adm-label">Benefits</label>
                <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:8}}>
                  {form.benefits.map((b,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:8,padding:'6px 10px'}}>
                      <span style={{flex:1,fontSize:12,color:'#475569'}}>✓ {b}</span>
                      <button onClick={()=>rmB(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626',fontSize:14,padding:0}}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8}}>
                  <input value={form.newB||''} onChange={e=>setForm({...form,newB:e.target.value})} onKeyDown={e=>e.key==='Enter'&&addB()} placeholder="Add benefit…" className="adm-input" style={{flex:1}}/>
                  <button onClick={addB} className="adm-btn adm-btn-ghost" style={{padding:'9px 14px'}}>+</button>
                </div>
              </div>
            </>
          )}
          {type==='event' && <div><label className="adm-label">Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="adm-input"/></div>}
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <label style={{fontSize:13,color:'#475569',fontWeight:600}}>Active</label>
            <button onClick={()=>setForm(f=>({...f,active:!f.active}))}
              style={{width:44,height:24,borderRadius:99,background:form.active?'#c9a84c':'#e2e8f0',position:'relative',border:'none',cursor:'pointer',transition:'background .2s'}}>
              <span style={{position:'absolute',top:2,left:form.active?20:2,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
            </button>
          </div>
          <button onClick={()=>onSave(form)} className="adm-btn adm-btn-gold" style={{width:'100%',marginTop:4}}>💾 Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ type, onSave, onClose }) {
  const [form, setForm] = useState(type==='promo'?{title:'',desc:'',icon:'🎁',active:true}:{title:'',desc:'',date:'',icon:'🎉',active:true});
  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
        <div style={{padding:'20px 22px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h2 className="adm-serif" style={{fontSize:18,fontWeight:700}}>New {type==='promo'?'Promotion':'Event'}</h2>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:'50%',background:'#f8fafc',border:'1px solid #e2e8f0',cursor:'pointer',color:'#64748b',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <div style={{padding:22,display:'flex',flexDirection:'column',gap:12}}>
          <div><label className="adm-label">Icon Emoji</label><input value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} className="adm-input" style={{fontSize:20}}/></div>
          <div><label className="adm-label">Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="adm-input" placeholder="Enter title…"/></div>
          <div><label className="adm-label">Description</label><textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} className="adm-input" rows={2} placeholder="Details…"/></div>
          {type==='event' && <div><label className="adm-label">Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="adm-input"/></div>}
          <button onClick={()=>{if(!form.title.trim()){toast.error('Title required');return;}onSave(form);}} className="adm-btn adm-btn-gold" style={{width:'100%'}}>Add {type==='promo'?'Promotion':'Event'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoyalty() {
  const { user } = useAuth();
  const [data, setData]   = useState(loadData);
  const [tab,  setTab]    = useState('tiers');
  const [editing, setEditing] = useState(null);
  const [adding,  setAdding]  = useState(null);

  const persist = d => { setData(d); saveData(d); };

  const saveTier = (id, form) => {
    const updated = data.tiers.map(t => t.id===id ? {...t,name:form.name,benefits:form.benefits,minStays:Number(form.minStays),minPoints:Number(form.minPoints)} : t);
    persist({...data,tiers:updated});
    addHist({action:'Updated tier',detail:`${id} updated by ${user?.name||'Admin'}`});
    toast.success('Tier updated'); setEditing(null);
  };

  const savePromo = (id, form) => {
    const updated = data.promos.map(p => p.id===id ? {...p,title:form.title,desc:form.desc,active:form.active} : p);
    persist({...data,promos:updated});
    toast.success('Promotion updated'); setEditing(null);
  };

  const saveEvent = (id, form) => {
    const updated = data.events.map(e => e.id===id ? {...e,title:form.title,desc:form.desc,date:form.date,active:form.active} : e);
    persist({...data,events:updated});
    toast.success('Event updated'); setEditing(null);
  };

  const addPromo = form => {
    const newP = {...form, id:'p'+Date.now()};
    persist({...data,promos:[...data.promos,newP]});
    addHist({action:'Added promotion',detail:form.title});
    toast.success('Promotion added'); setAdding(null);
  };

  const addEvent = form => {
    const newE = {...form, id:'e'+Date.now()};
    persist({...data,events:[...data.events,newE]});
    addHist({action:'Added event',detail:form.title});
    toast.success('Event added'); setAdding(null);
  };

  const togglePromo = id => { const updated = data.promos.map(p=>p.id===id?{...p,active:!p.active}:p); persist({...data,promos:updated}); toast.success('Updated'); };
  const toggleEvent = id => { const updated = data.events.map(e=>e.id===id?{...e,active:!e.active}:e); persist({...data,events:updated}); toast.success('Updated'); };
  const delPromo = id => { persist({...data,promos:data.promos.filter(p=>p.id!==id)}); toast.success('Removed'); };
  const delEvent = id => { persist({...data,events:data.events.filter(e=>e.id!==id)}); toast.success('Removed'); };

  const hist = getHist();

  return (
    <AdminLayout title="Loyalty Programs" subtitle="Manage tiers, promotions, events and rewards">
      <div style={{marginBottom:20}}>
        <div className="adm-tabs" style={{width:'fit-content'}}>
          {[{k:'tiers',l:'Tier Structure'},{k:'promos',l:'Promotions'},{k:'events',l:'Events'},{k:'history',l:'Activity Log'}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className={'adm-tab'+(tab===t.k?' active':'')} style={{padding:'8px 18px'}}>{t.l}</button>
          ))}
        </div>
      </div>

      {tab==='tiers' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
          {data.tiers.map((t,i)=>(
            <div key={t.id} className={'adm-fadein d'+(i+1)}>
              <TierCard tier={t} onEdit={setEditing}/>
            </div>
          ))}
        </div>
      )}

      {tab==='promos' && (
        <>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
            <button onClick={()=>setAdding('promo')} className="adm-btn adm-btn-gold">+ Add Promotion</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
            {data.promos.map((p,i)=>(
              <div key={p.id} className={'adm-card adm-fadein d'+(i+1)} style={{padding:18,borderLeft:'3px solid '+(p.active?'#c9a84c':'#e2e8f0'),opacity:p.active?1:.7}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:24}}>{p.icon}</span>
                    <div>
                      <p style={{fontWeight:700,fontSize:14,color:'#1e293b'}}>{p.title}</p>
                      <p style={{fontSize:12,color:'#64748b',marginTop:2}}>{p.desc}</p>
                    </div>
                  </div>
                  <span style={{background:p.active?'#f0fdf4':'#f3f4f6',color:p.active?'#16a34a':'#6b7280',border:'1px solid '+(p.active?'#bbf7d0':'#e5e7eb'),borderRadius:99,padding:'2px 8px',fontSize:10,fontWeight:700,flexShrink:0}}>{p.active?'Active':'Inactive'}</span>
                </div>
                <div style={{display:'flex',gap:6,marginTop:10}}>
                  <button onClick={()=>setEditing({...p,_type:'promo'})} className="adm-btn adm-btn-ghost" style={{flex:1,fontSize:11.5,padding:'6px'}}>Edit</button>
                  <button onClick={()=>togglePromo(p.id)} className="adm-btn adm-btn-ghost" style={{flex:1,fontSize:11.5,padding:'6px'}}>{p.active?'Disable':'Enable'}</button>
                  <button onClick={()=>delPromo(p.id)} className="adm-btn adm-btn-danger" style={{padding:'6px 10px',fontSize:11.5}}>×</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab==='events' && (
        <>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
            <button onClick={()=>setAdding('event')} className="adm-btn adm-btn-gold">+ Add Event</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
            {data.events.map((e,i)=>(
              <div key={e.id} className={'adm-card adm-fadein d'+(i+1)} style={{padding:18,borderLeft:'3px solid '+(e.active?'#6366f1':'#e2e8f0'),opacity:e.active?1:.7}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
                  <span style={{fontSize:26,flexShrink:0}}>{e.icon}</span>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:700,fontSize:14,color:'#1e293b'}}>{e.title}</p>
                    <p style={{fontSize:12,color:'#64748b',marginTop:2}}>{e.desc}</p>
                    {e.date && <p style={{fontSize:11,color:'#6366f1',marginTop:4,fontWeight:600}}>📅 {new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>}
                  </div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>setEditing({...e,_type:'event'})} className="adm-btn adm-btn-ghost" style={{flex:1,fontSize:11.5,padding:'6px'}}>Edit</button>
                  <button onClick={()=>toggleEvent(e.id)} className="adm-btn adm-btn-ghost" style={{flex:1,fontSize:11.5,padding:'6px'}}>{e.active?'Disable':'Enable'}</button>
                  <button onClick={()=>delEvent(e.id)} className="adm-btn adm-btn-danger" style={{padding:'6px 10px',fontSize:11.5}}>×</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab==='history' && (
        <div className="adm-card" style={{overflow:'hidden'}}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9'}}>
            <p style={{fontWeight:700,color:'#1e293b',fontSize:13}}>Activity Log — last {hist.length} actions</p>
          </div>
          {hist.length===0 ? (
            <div style={{padding:48,textAlign:'center',color:'#94a3b8'}}>
              <p style={{fontSize:28,marginBottom:8}}>📋</p><p>No activity yet</p>
            </div>
          ) : (
            <div style={{padding:14,display:'flex',flexDirection:'column',gap:8}}>
              {hist.map((h,i)=>(
                <div key={i} className={'adm-fadein d'+(Math.min(i%8+1,8))} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 12px',background:'#fafbfc',borderRadius:10,border:'1px solid #f1f5f9'}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:'#c9a84c',flexShrink:0,marginTop:5}}/>
                  <div>
                    <p style={{fontWeight:600,color:'#1e293b',fontSize:12.5}}>{h.action}</p>
                    <p style={{fontSize:11.5,color:'#64748b',marginTop:1}}>{h.detail}</p>
                    <p style={{fontSize:10.5,color:'#94a3b8',marginTop:2}}>{new Date(h.ts).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal
          item={editing}
          type={editing._type || 'tier'}
          onSave={form => {
            if (editing._type==='promo') savePromo(editing.id, form);
            else if (editing._type==='event') saveEvent(editing.id, form);
            else saveTier(editing.id, form);
          }}
          onClose={()=>setEditing(null)}
        />
      )}
      {adding && <AddModal type={adding} onSave={adding==='promo'?addPromo:addEvent} onClose={()=>setAdding(null)}/>}
    </AdminLayout>
  );
}
