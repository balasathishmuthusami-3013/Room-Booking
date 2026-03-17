import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const DEFAULT_TIERS = [
  { id: 1, name: 'Bronze', icon: '🥉', minPts: 0, maxPts: 499, perks: ['Priority check-in', '5% dining discount', 'Welcome drink'], color: '#cd7f32' },
  { id: 2, name: 'Silver', icon: '🥈', minPts: 500, maxPts: 1499, perks: ['Room upgrade requests', 'Complimentary breakfast', '10% spa discount', 'Late checkout'], color: '#9e9e9e' },
  { id: 3, name: 'Gold', icon: '🥇', minPts: 1500, maxPts: 4999, perks: ['Suite upgrades', 'Airport transfer', '$50 spa credits', 'Priority reservations', 'Dedicated concierge'], color: '#d4a853' },
  { id: 4, name: 'Diamond', icon: '💎', minPts: 5000, maxPts: null, perks: ['Butler service', 'Unlimited upgrades', 'VIP events access', 'Annual luxury gift', 'Private dining'], color: '#64b5f6' },
];

const LOYALTY_HISTORY = [
  { id: 1, date: '2025-07-12', action: 'Updated Gold tier perks', admin: 'admin@axopay.com', change: 'Added "Priority reservations" perk' },
  { id: 2, date: '2025-06-03', action: 'Modified point thresholds', admin: 'admin@axopay.com', change: 'Silver: 400→500 pts minimum' },
  { id: 3, date: '2025-04-18', action: 'Added Diamond tier', admin: 'superadmin@axopay.com', change: 'New tier created with 5000+ pts threshold' },
  { id: 4, date: '2025-02-01', action: 'Loyalty program launched', admin: 'superadmin@axopay.com', change: 'Initial program configuration' },
];

const MOCK_USERS = [
  { id: 'u1', name: 'Isabella Fontaine', email: 'isabella@email.com', role: 'customer', loyaltyPoints: 3200, bookings: 8, joinDate: '2024-03-15', isActive: true },
  { id: 'u2', name: 'Marcus Ellington', email: 'marcus@email.com', role: 'customer', loyaltyPoints: 680, bookings: 3, joinDate: '2024-08-22', isActive: true },
  { id: 'u3', name: 'Sophia Laurent', email: 'sophia@email.com', role: 'customer', loyaltyPoints: 5120, bookings: 15, joinDate: '2023-11-01', isActive: true },
  { id: 'u4', name: 'Test Admin', email: 'admin@axopay.com', role: 'admin', loyaltyPoints: 0, bookings: 0, joinDate: '2023-01-01', isActive: true },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [editingTier, setEditingTier] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newPerk, setNewPerk] = useState('');

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const startEdit = (tier) => {
    setEditingTier(tier.id);
    setEditForm({ ...tier, perks: [...tier.perks] });
    setNewPerk('');
  };

  const cancelEdit = () => { setEditingTier(null); setEditForm({}); };

  const saveEdit = () => {
    setTiers(prev => prev.map(t => t.id === editingTier ? { ...editForm } : t));
    // Log to history
    toast.success(`${editForm.name} tier updated successfully`);
    setEditingTier(null);
    setEditForm({});
  };

  const removePerk = (idx) => setEditForm(p => ({ ...p, perks: p.perks.filter((_, i) => i !== idx) }));
  const addPerk = () => {
    if (!newPerk.trim()) return;
    setEditForm(p => ({ ...p, perks: [...p.perks, newPerk.trim()] }));
    setNewPerk('');
  };

  const SideBtn = ({ id, label, icon }) => (
    <button onClick={() => setActiveTab(id)} style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
      padding: '0.9rem 1.25rem', border: 'none', cursor: 'pointer', textAlign: 'left',
      background: activeTab === id ? 'rgba(184,137,74,0.15)' : 'transparent',
      borderLeft: activeTab === id ? '3px solid #b8894a' : '3px solid transparent',
      fontFamily: 'Josefin Sans', fontSize: '0.72rem', letterSpacing: '0.12em',
      color: activeTab === id ? '#b8894a' : '#777', transition: 'all 0.2s',
    }}>
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ background: 'var(--ivory)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '80px', display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 80px)' }}>

        {/* Admin Sidebar */}
        <div style={{ background: '#fff', borderRight: '1px solid var(--sand-100)', padding: '2rem 0' }}>
          <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid var(--sand-100)', marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--latte)', marginBottom: '0.5rem' }}>ADMIN PANEL</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: 'var(--deep-espresso)' }}>Control Center</div>
            <div style={{ display: 'inline-block', marginTop: '0.4rem', background: 'rgba(184,137,74,0.15)', border: '1px solid rgba(184,137,74,0.4)', padding: '0.15rem 0.6rem' }}>
              <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.58rem', letterSpacing: '0.15em', color: '#b8894a' }}>⚙️ ADMINISTRATOR</span>
            </div>
          </div>
          <SideBtn id="dashboard" label="Dashboard" icon="📊" />
          <SideBtn id="loyalty" label="Loyalty Program" icon="🏅" />
          <SideBtn id="users" label="User Management" icon="👥" />
          <SideBtn id="history" label="Change History" icon="📜" />
          <div style={{ margin: '1rem 1.5rem', height: '1px', background: 'var(--sand-100)' }} />
          <button onClick={() => navigate('/dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
            padding: '0.9rem 1.25rem', border: 'none', cursor: 'pointer',
            background: 'transparent', fontFamily: 'Josefin Sans', fontSize: '0.72rem',
            letterSpacing: '0.12em', color: '#bbb',
          }}>← Back to Dashboard</button>
        </div>

        {/* Main */}
        <div style={{ padding: '3rem', overflowY: 'auto' }}>

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
              <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.1em', marginBottom: '3rem' }}>Overview of Axopay Hotel operations</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                  { icon: '📋', label: 'Total Bookings', value: '248', sub: '+12 this month', color: '#3b82f6' },
                  { icon: '💰', label: 'Revenue', value: '$184K', sub: '+8.2% vs last month', color: '#22c55e' },
                  { icon: '👥', label: 'Total Guests', value: '892', sub: '43 new this month', color: '#8b5cf6' },
                  { icon: '🏨', label: 'Occupancy', value: '76%', sub: 'Active rooms', color: '#f59e0b' },
                ].map(({ icon, label, value, sub, color }) => (
                  <div key={label} style={{ background: '#fff', padding: '1.75rem', border: '1px solid var(--sand-100)', boxShadow: '0 2px 15px rgba(42,26,10,0.04)', borderTop: `3px solid ${color}` }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{icon}</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', color: 'var(--deep-espresso)' }}>{value}</div>
                    <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.62rem', letterSpacing: '0.12em', color: 'var(--latte)', marginTop: '0.25rem' }}>{label}</div>
                    <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.62rem', color: '#bbb', marginTop: '0.2rem' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '1.5rem' }}>Quick Actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'Manage Loyalty Tiers', action: () => setActiveTab('loyalty'), icon: '🏅' },
                  { label: 'View User Accounts', action: () => setActiveTab('users'), icon: '👥' },
                  { label: 'Change History Log', action: () => setActiveTab('history'), icon: '📜' },
                ].map(({ label, action, icon }) => (
                  <button key={label} onClick={action} style={{
                    padding: '1.5rem', background: '#fff', border: '1px solid var(--sand-100)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#b8894a'; e.currentTarget.style.background = 'rgba(184,137,74,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sand-100)'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
                    <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--deep-espresso)' }}>{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LOYALTY PROGRAM TAB ── */}
          {activeTab === 'loyalty' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '0.5rem' }}>
                    Axopay Loyalty Program
                  </h1>
                  <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.1em' }}>
                    Configure tier thresholds, perks, and program details
                  </p>
                </div>
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '0.4rem 1rem' }}>
                  <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#22c55e' }}>● PROGRAM ACTIVE</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {tiers.map((tier) => (
                  <div key={tier.id} style={{
                    background: '#fff', border: '1px solid var(--sand-100)',
                    boxShadow: '0 2px 15px rgba(42,26,10,0.04)', overflow: 'hidden',
                  }}>
                    {/* Tier Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--sand-100)', background: `${tier.color}08` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '2rem' }}>{tier.icon}</span>
                        <div>
                          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--deep-espresso)', fontWeight: 400 }}>{tier.name} Tier</div>
                          <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#aaa', letterSpacing: '0.1em' }}>
                            {tier.minPts.toLocaleString()} – {tier.maxPts ? tier.maxPts.toLocaleString() : '∞'} points
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ background: `${tier.color}20`, border: `1px solid ${tier.color}40`, padding: '0.25rem 0.75rem', borderRadius: '2px' }}>
                          <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', color: tier.color, letterSpacing: '0.1em' }}>{tier.perks.length} PERKS</span>
                        </div>
                        {editingTier !== tier.id && (
                          <button onClick={() => startEdit(tier)} style={{
                            background: 'var(--deep-espresso)', color: 'var(--latte)', border: 'none', cursor: 'pointer',
                            padding: '0.5rem 1.2rem', fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em',
                            transition: 'opacity 0.2s',
                          }}
                            onMouseEnter={e => e.target.style.opacity = '0.85'}
                            onMouseLeave={e => e.target.style.opacity = '1'}
                          >✏️ EDIT TIER</button>
                        )}
                      </div>
                    </div>

                    {/* Edit Mode */}
                    {editingTier === tier.id ? (
                      <div style={{ padding: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                          {[
                            { label: 'TIER NAME', key: 'name', type: 'text' },
                            { label: 'MIN POINTS', key: 'minPts', type: 'number' },
                            { label: 'MAX POINTS (0 = unlimited)', key: 'maxPts', type: 'number' },
                          ].map(({ label, key, type }) => (
                            <div key={key}>
                              <label style={{ display: 'block', fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--bronze)', marginBottom: '0.4rem' }}>{label}</label>
                              <input type={type} value={editForm[key] ?? ''} onChange={e => setEditForm(p => ({ ...p, [key]: type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value }))}
                                style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--sand-200)', background: 'var(--sand-50)', fontFamily: 'Josefin Sans', outline: 'none', fontSize: '0.85rem' }}
                              />
                            </div>
                          ))}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--bronze)', marginBottom: '0.75rem' }}>PERKS</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {editForm.perks?.map((perk, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--sand-50)', padding: '0.5rem 0.75rem', border: '1px solid var(--sand-100)' }}>
                                <span style={{ flex: 1, fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: 'var(--deep-espresso)' }}>✓ {perk}</span>
                                <button onClick={() => removePerk(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem', padding: '0 0.25rem' }}>×</button>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input value={newPerk} onChange={e => setNewPerk(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPerk()}
                              placeholder="Add new perk..."
                              style={{ flex: 1, padding: '0.6rem 0.75rem', border: '1px solid var(--sand-200)', background: '#fff', fontFamily: 'Josefin Sans', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <button onClick={addPerk} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 1rem', cursor: 'pointer', fontFamily: 'Josefin Sans', fontSize: '0.7rem', letterSpacing: '0.1em' }}>+ ADD</button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={saveEdit} style={{ background: 'linear-gradient(135deg, #b8894a, #7c5828)', color: '#fff', border: 'none', padding: '0.75rem 2rem', cursor: 'pointer', fontFamily: 'Josefin Sans', fontSize: '0.7rem', letterSpacing: '0.15em' }}>SAVE CHANGES</button>
                          <button onClick={cancelEdit} style={{ background: 'transparent', color: '#999', border: '1px solid var(--sand-200)', padding: '0.75rem 2rem', cursor: 'pointer', fontFamily: 'Josefin Sans', fontSize: '0.7rem', letterSpacing: '0.15em' }}>CANCEL</button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div style={{ padding: '1.5rem 2rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {tier.perks.map((perk, i) => (
                            <span key={i} style={{ background: `${tier.color}12`, border: `1px solid ${tier.color}25`, padding: '0.3rem 0.75rem', fontFamily: 'Josefin Sans', fontSize: '0.68rem', color: '#666', borderRadius: '2px' }}>✓ {perk}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === 'users' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '2rem' }}>User Management</h1>
              <div style={{ background: '#fff', border: '1px solid var(--sand-100)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--sand-50)', borderBottom: '1px solid var(--sand-100)' }}>
                      {['Guest', 'Email', 'Role', 'Loyalty Points', 'Bookings', 'Status'].map(h => (
                        <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--bronze)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_USERS.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--sand-50)', background: i % 2 === 0 ? '#fff' : 'rgba(245,240,235,0.3)' }}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #b8894a, #7c5828)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Josefin Sans', fontSize: '0.65rem', fontWeight: 600 }}>
                              {u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                            </div>
                            <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.78rem', color: 'var(--deep-espresso)' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontFamily: 'Josefin Sans', fontSize: '0.72rem', color: '#888' }}>{u.email}</td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ background: u.role === 'admin' ? 'rgba(139,92,246,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${u.role === 'admin' ? 'rgba(139,92,246,0.3)' : 'rgba(34,197,94,0.3)'}`, padding: '0.2rem 0.6rem', fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.1em', color: u.role === 'admin' ? '#8b5cf6' : '#22c55e', borderRadius: '2px' }}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: u.loyaltyPoints > 0 ? 'var(--bronze)' : '#ccc' }}>{u.loyaltyPoints.toLocaleString()}</td>
                        <td style={{ padding: '1rem 1.25rem', fontFamily: 'Josefin Sans', fontSize: '0.78rem', color: '#888' }}>{u.bookings}</td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${u.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '0.2rem 0.6rem', fontFamily: 'Josefin Sans', fontSize: '0.6rem', color: u.isActive ? '#22c55e' : '#ef4444', borderRadius: '2px' }}>
                            {u.isActive ? '● ACTIVE' : '● INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '0.5rem' }}>Change History</h1>
              <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.1em', marginBottom: '2.5rem' }}>Audit trail for loyalty program modifications</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '17px', top: '0', bottom: '0', width: '1px', background: 'linear-gradient(to bottom, var(--latte), transparent)' }} />
                {LOYALTY_HISTORY.map((entry, i) => (
                  <div key={entry.id} style={{ display: 'flex', gap: '1.5rem', paddingBottom: '2rem', position: 'relative' }}>
                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#fff', border: '2px solid var(--sand-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, fontSize: '0.85rem' }}>
                      {i === 0 ? '🏅' : '📝'}
                    </div>
                    <div style={{ background: '#fff', flex: 1, padding: '1.5rem', border: '1px solid var(--sand-100)', boxShadow: '0 2px 10px rgba(42,26,10,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--deep-espresso)', fontWeight: 400 }}>{entry.action}</div>
                        <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', color: '#bbb', letterSpacing: '0.1em' }}>{entry.date}</div>
                      </div>
                      <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.72rem', color: '#888', marginBottom: '0.5rem' }}>{entry.change}</div>
                      <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: 'var(--latte)', letterSpacing: '0.05em' }}>by {entry.admin}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
