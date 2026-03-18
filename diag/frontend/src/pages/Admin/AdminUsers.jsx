import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/common/AdminLayout';
import { adminAPI, bookingAPI, membershipAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TIER_CFG = {
  silver:   { bg:'#f8fafc', color:'#475569', border:'#e2e8f0', icon:'🥈' },
  gold:     { bg:'#fffbeb', color:'#92400e', border:'#fde68a', icon:'🥇' },
  platinum: { bg:'#f5f3ff', color:'#5b21b6', border:'#ddd6fe', icon:'💎' },
};

export default function AdminUsers() {
  const [users,       setUsers]       = useState([]);
  const [bookings,    setBookings]    = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('all');
  const [detail,      setDetail]      = useState(null);

  useEffect(() => {
    Promise.all([
      adminAPI.getUsers(),
      bookingAPI.getAll({}).catch(()=>({data:{data:{bookings:[]}}})),
      membershipAPI.getAll().catch(()=>({data:{data:{memberships:[]}}})),
    ]).then(([uRes,bRes,mRes])=>{
      setUsers(uRes.data.data.users||[]);
      setBookings(bRes.data.data.bookings||[]);
      setMemberships(mRes.data.data.memberships||[]);
    }).finally(()=>setLoading(false));
  }, []);

  const toggleStatus = async id => {
    try {
      const {data} = await adminAPI.toggleUserStatus(id);
      toast.success('User status updated');
      setUsers(u=>u.map(x=>x._id===id?{...x,isActive:data.data.user.isActive}:x));
    } catch { toast.error('Action failed'); }
  };

  const getUserBookings    = uid => bookings.filter(b=>b.user?._id===uid||b.user===uid);
  const getUserMembership  = uid => memberships.find(m=>m.user===uid||m.user?._id===uid);

  const visible = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchR = roleFilter==='all' || u.role===roleFilter;
    return matchQ && matchR;
  });

  const selectedUser = detail ? users.find(u=>u._id===detail) : null;
  const userBks = selectedUser ? getUserBookings(selectedUser._id) : [];
  const userMem = selectedUser ? getUserMembership(selectedUser._id) : null;
  const memCfg  = userMem ? (TIER_CFG[userMem.tier]||TIER_CFG.silver) : null;

  return (
    <AdminLayout title="Users" subtitle="Manage all registered customers">
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24}}>
        {[
          {l:'Total Users',  v:users.length,                         color:'#c9a84c',bg:'linear-gradient(135deg,#fffbeb,#fef3c7)'},
          {l:'Active',       v:users.filter(u=>u.isActive).length,   color:'#10b981',bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)'},
          {l:'Customers',    v:users.filter(u=>u.role==='customer').length, color:'#6366f1',bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)'},
          {l:'With Membership',v:memberships.length,                 color:'#7c3aed',bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)'},
        ].map((s,i)=>(
          <div key={s.l} className={'adm-stat adm-fadein d'+(i+1)} style={{'--stat-c':s.color,background:s.bg}}>
            <p style={{fontSize:26,fontWeight:800,color:'#0f172a'}}>{s.v}</p>
            <p style={{fontSize:11,color:'#64748b',marginTop:4}}>{s.l}</p>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:detail?'1fr 360px':'1fr',gap:18,alignItems:'start'}}>
        {/* Table */}
        <div className="adm-card" style={{overflow:'hidden'}}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…" className="adm-input" style={{flex:'1 1 200px',maxWidth:320}}/>
            <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="adm-input" style={{width:140}}>
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="admin">Admins</option>
            </select>
            <span style={{fontSize:12,color:'#94a3b8'}}>{visible.length} users</span>
          </div>

          {loading ? (
            <div style={{padding:18,display:'flex',flexDirection:'column',gap:10}}>
              {[...Array(6)].map((_,i)=><div key={i} className="adm-shimmer" style={{height:52,borderRadius:10}}/>)}
            </div>
          ) : visible.length===0 ? (
            <div style={{textAlign:'center',padding:'48px',color:'#94a3b8'}}>
              <p style={{fontSize:28,marginBottom:8}}>👥</p>
              <p>{search?'No users found':'No users yet'}</p>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table className="adm-table">
                <thead>
                  <tr>{['User','Email','Role','Membership','Bookings','Status',''].map(h=><th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {visible.map((u,i)=>{
                    const mem = getUserMembership(u._id);
                    const bkCount = getUserBookings(u._id).length;
                    const cfg = mem ? (TIER_CFG[mem.tier]||TIER_CFG.silver) : null;
                    return (
                      <tr key={u._id} className={'adm-fadein d'+(Math.min(i%8+1,8))} style={{cursor:'pointer',background:detail===u._id?'#fafbfc':''}} onClick={()=>setDetail(detail===u._id?null:u._id)}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:9}}>
                            <div style={{width:34,height:34,borderRadius:99,background:'linear-gradient(135deg,#c9a84c,#9b7a2e)',color:'#fff8e7',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,flexShrink:0}}>
                              {u.name?.[0]?.toUpperCase()||'?'}
                            </div>
                            <p style={{fontWeight:600,color:'#1e293b',fontSize:13}}>{u.name}</p>
                          </div>
                        </td>
                        <td style={{fontSize:12,color:'#64748b'}}>{u.email}</td>
                        <td>
                          <span style={{background:u.role==='admin'?'#fffbeb':'#f1f5f9',color:u.role==='admin'?'#92400e':'#475569',border:'1px solid '+(u.role==='admin'?'#fde68a':'#e2e8f0'),borderRadius:99,padding:'2px 9px',fontSize:10.5,fontWeight:700,textTransform:'capitalize'}}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {mem && cfg ? (
                            <span style={{background:cfg.bg,color:cfg.color,border:'1px solid '+cfg.border,borderRadius:99,padding:'2px 9px',fontSize:10.5,fontWeight:700,display:'inline-flex',alignItems:'center',gap:4}}>
                              {cfg.icon} {mem.tier}
                            </span>
                          ) : <span style={{color:'#d1d5db',fontSize:12}}>None</span>}
                        </td>
                        <td style={{fontWeight:700,color:'#1e293b',fontSize:13}}>{bkCount}</td>
                        <td>
                          <span style={{background:u.isActive?'#dcfce7':'#fee2e2',color:u.isActive?'#15803d':'#b91c1c',border:'1px solid '+(u.isActive?'#bbf7d0':'#fecaca'),borderRadius:99,padding:'2px 9px',fontSize:10.5,fontWeight:700}}>
                            {u.isActive?'Active':'Inactive'}
                          </span>
                        </td>
                        <td onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>toggleStatus(u._id)} className="adm-btn adm-btn-ghost" style={{padding:'4px 10px',fontSize:11,borderRadius:7}}>
                            {u.isActive?'Disable':'Enable'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedUser && (
          <div className="adm-card adm-fadein" style={{padding:0,overflow:'hidden',position:'sticky',top:80}}>
            <div style={{padding:'16px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <p style={{fontWeight:700,color:'#1e293b',fontSize:13}}>User Details</p>
              <button onClick={()=>setDetail(null)} style={{width:26,height:26,borderRadius:'50%',background:'#f1f5f9',border:'none',cursor:'pointer',color:'#64748b',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>
            <div style={{padding:18}}>
              {/* Avatar */}
              <div style={{textAlign:'center',marginBottom:16}}>
                <div style={{width:60,height:60,borderRadius:99,background:'linear-gradient(135deg,#c9a84c,#9b7a2e)',color:'#fff8e7',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:22,margin:'0 auto 10px'}}>
                  {selectedUser.name?.[0]?.toUpperCase()||'?'}
                </div>
                <p style={{fontWeight:700,fontSize:15,color:'#0f172a'}}>{selectedUser.name}</p>
                <p style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{selectedUser.email}</p>
              </div>
              <hr style={{border:'none',borderTop:'1px solid #f1f5f9',margin:'12px 0'}}/>
              {/* Info Grid */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                {[
                  {l:'Role',     v:selectedUser.role},
                  {l:'Status',   v:selectedUser.isActive?'Active':'Inactive'},
                  {l:'Bookings', v:userBks.length},
                  {l:'Joined',   v:new Date(selectedUser.createdAt).toLocaleDateString('en-IN',{month:'short',year:'numeric'})},
                ].map(({l,v})=>(
                  <div key={l} style={{background:'#f8fafc',borderRadius:9,padding:'8px 10px'}}>
                    <p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',color:'#94a3b8',marginBottom:2}}>{l}</p>
                    <p style={{fontSize:12.5,fontWeight:600,color:'#1e293b',textTransform:'capitalize'}}>{v}</p>
                  </div>
                ))}
              </div>
              {/* Membership */}
              {userMem && memCfg && (
                <div style={{background:memCfg.bg,border:'1.5px solid '+memCfg.border,borderRadius:12,padding:'12px 14px',marginBottom:12}}>
                  <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:memCfg.color,marginBottom:6}}>Membership</p>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontWeight:700,fontSize:13,color:memCfg.color}}>{memCfg.icon} {userMem.tier?.charAt(0).toUpperCase()+userMem.tier?.slice(1)}</span>
                    <span style={{fontSize:12,color:memCfg.color}}>{userMem.freeBookingsRemaining} free left</span>
                  </div>
                </div>
              )}
              {/* Recent bookings */}
              {userBks.length>0 && (
                <div>
                  <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',color:'#94a3b8',marginBottom:8}}>Recent Bookings</p>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {userBks.slice(0,4).map(b=>(
                      <div key={b._id} style={{background:'#f8fafc',borderRadius:9,padding:'8px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div>
                          <p style={{fontSize:11,fontFamily:'monospace',color:'#c9a84c',fontWeight:700}}>{b.bookingReference}</p>
                          <p style={{fontSize:10.5,color:'#64748b',marginTop:1}}>{b.room?.hotelName||'—'}</p>
                        </div>
                        <span className={'tag tag-'+(b.status||'pending')} style={{fontSize:9.5}}>{(b.status||'—').replace('_',' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
