import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const MOCK_BOOKINGS = [
  { _id: 'b1', room: { name: 'Garden Deluxe Room', type: 'deluxe', roomNumber: 'D-204' }, checkIn: '2025-08-10', checkOut: '2025-08-14', status: 'confirmed', paymentStatus: 'paid', pricing: { totalAmount: 2102, pricePerNight: 432, baseAmount: 1728 }, numberOfNights: 4 },
  { _id: 'b2', room: { name: 'Grand Honeymoon Suite', type: 'suite', roomNumber: 'S-810' }, checkIn: '2025-09-20', checkOut: '2025-09-23', status: 'pending', paymentStatus: 'unpaid', pricing: { totalAmount: 2986, pricePerNight: 850, baseAmount: 2550 }, numberOfNights: 3 },
];

const STATUS_COLORS = {
  confirmed: '#22c55e', pending: '#f59e0b', cancelled: '#ef4444',
  checked_in: '#3b82f6', checked_out: '#6b7280', no_show: '#dc2626',
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loyaltyPoints] = useState(1240);
  const tier = loyaltyPoints >= 5000 ? 'Diamond 💎' : loyaltyPoints >= 1500 ? 'Gold 🥇' : loyaltyPoints >= 500 ? 'Silver 🥈' : 'Bronze 🥉';
  const nextTier = loyaltyPoints >= 5000 ? null : loyaltyPoints >= 1500 ? { name: 'Diamond', at: 5000 } : loyaltyPoints >= 500 ? { name: 'Gold', at: 1500 } : { name: 'Silver', at: 500 };

  const handleLogout = () => { logout(); navigate('/'); };

  const TabBtn = ({ id, label, icon }) => (
    <button onClick={() => setActiveTab(id)} style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      width: '100%', padding: '0.9rem 1.25rem', textAlign: 'left',
      border: 'none', cursor: 'pointer',
      background: activeTab === id ? 'rgba(184,137,74,0.12)' : 'transparent',
      borderLeft: activeTab === id ? '3px solid #b8894a' : '3px solid transparent',
      fontFamily: 'Josefin Sans', fontSize: '0.72rem', letterSpacing: '0.12em',
      color: activeTab === id ? '#b8894a' : '#888',
      transition: 'all 0.2s',
    }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div style={{ background: 'var(--ivory)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '80px', display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 80px)' }}>

        {/* Sidebar */}
        <div style={{ background: '#fff', borderRight: '1px solid var(--sand-100)', padding: '2rem 0' }}>
          <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid var(--sand-100)', marginBottom: '1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #b8894a, #7c5828)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Josefin Sans', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--deep-espresso)' }}>{user?.name}</div>
            <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#aaa', letterSpacing: '0.1em' }}>{user?.email}</div>
            <div style={{ marginTop: '0.5rem', display: 'inline-block', background: 'rgba(184,137,74,0.1)', border: '1px solid rgba(184,137,74,0.3)', padding: '0.2rem 0.6rem', borderRadius: '2px' }}>
              <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#b8894a' }}>{tier}</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <TabBtn id="overview" label="Overview" icon="🏠" />
            <TabBtn id="bookings" label="My Bookings" icon="📋" />
            <TabBtn id="loyalty" label="Loyalty Points" icon="🏅" />
            <TabBtn id="profile" label="My Profile" icon="👤" />

            {user?.role === 'admin' && (
              <>
                <div style={{ margin: '1rem 1.5rem 0.5rem', height: '1px', background: 'var(--sand-100)' }} />
                <div style={{ padding: '0.5rem 1.25rem', fontFamily: 'Josefin Sans', fontSize: '0.55rem', letterSpacing: '0.25em', color: '#ccc' }}>ADMIN</div>
                <Link to="/admin" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.9rem 1.25rem', fontFamily: 'Josefin Sans', fontSize: '0.72rem', letterSpacing: '0.12em', color: '#b8894a', cursor: 'pointer', borderLeft: '3px solid transparent', transition: 'all 0.2s', background: 'rgba(184,137,74,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,137,74,0.12)'; e.currentTarget.style.borderLeftColor = '#b8894a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,137,74,0.05)'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
                  >
                    <span>⚙️</span> Admin Panel
                  </div>
                </Link>
              </>
            )}
          </nav>

          <div style={{ marginTop: 'auto', padding: '2rem 1.25rem 0' }}>
            <button onClick={handleLogout} style={{
              width: '100%', padding: '0.75rem', border: '1px solid var(--sand-200)',
              background: 'transparent', cursor: 'pointer',
              fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em',
              color: '#999', transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.target.style.background = 'var(--deep-espresso)'; e.target.style.color = 'var(--latte)'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#999'; }}
            >SIGN OUT</button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '3rem' }}>
          {activeTab === 'overview' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '0.5rem' }}>
                Welcome back, <em style={{ color: 'var(--bronze)' }}>{user?.name?.split(' ')[0]}</em>
              </h1>
              <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: '#aaa', letterSpacing: '0.1em', marginBottom: '3rem' }}>Your personal sanctuary dashboard</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                  { icon: '📋', label: 'Total Bookings', value: MOCK_BOOKINGS.length, sub: 'All time' },
                  { icon: '🏅', label: 'Loyalty Points', value: loyaltyPoints.toLocaleString(), sub: tier },
                  { icon: '⭐', label: 'Member Since', value: '2024', sub: 'Valued Guest' },
                ].map(({ icon, label, value, sub }) => (
                  <div key={label} style={{ background: '#fff', padding: '1.75rem', border: '1px solid var(--sand-100)', boxShadow: '0 2px 15px rgba(42,26,10,0.04)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{icon}</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', color: 'var(--deep-espresso)', marginBottom: '0.25rem' }}>{value}</div>
                    <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: 'var(--latte)', letterSpacing: '0.12em' }}>{label}</div>
                    <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#ccc', marginTop: '0.25rem' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Recent Bookings Preview */}
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '1.5rem' }}>Recent Stays</h2>
              {MOCK_BOOKINGS.slice(0, 2).map(b => (
                <div key={b._id} style={{ background: '#fff', padding: '1.5rem', border: '1px solid var(--sand-100)', marginBottom: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--deep-espresso)', marginBottom: '0.25rem' }}>{b.room.name}</div>
                    <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#aaa' }}>{b.checkIn} → {b.checkOut} · {b.numberOfNights} nights</div>
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: `${STATUS_COLORS[b.status]}20`, border: `1px solid ${STATUS_COLORS[b.status]}40`, borderRadius: '2px', fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.1em', color: STATUS_COLORS[b.status] }}>
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: 'var(--bronze)' }}>${b.pricing.totalAmount}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '2rem' }}>My Bookings</h1>
              {MOCK_BOOKINGS.map(b => (
                <div key={b._id} style={{ background: '#fff', padding: '2rem', border: '1px solid var(--sand-100)', marginBottom: '1.5rem', boxShadow: '0 2px 15px rgba(42,26,10,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 400, color: 'var(--deep-espresso)' }}>{b.room.name}</h3>
                      <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--latte)' }}>{b.room.type.toUpperCase()} · ROOM {b.room.roomNumber}</span>
                    </div>
                    <span style={{ display: 'inline-block', padding: '0.3rem 0.9rem', background: `${STATUS_COLORS[b.status]}15`, border: `1px solid ${STATUS_COLORS[b.status]}30`, borderRadius: '2px', fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.1em', color: STATUS_COLORS[b.status] }}>
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--sand-100)' }}>
                    {[
                      { label: 'CHECK IN', val: b.checkIn },
                      { label: 'CHECK OUT', val: b.checkOut },
                      { label: 'NIGHTS', val: `${b.numberOfNights} nights` },
                      { label: 'TOTAL', val: `$${b.pricing.totalAmount}` },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--latte)', marginBottom: '0.25rem' }}>{label}</div>
                        <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.82rem', color: 'var(--deep-espresso)' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '0.5rem' }}>Loyalty Program</h1>
              <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: '#aaa', letterSpacing: '0.1em', marginBottom: '3rem' }}>Your Axopay rewards journey</p>

              <div style={{ background: 'linear-gradient(135deg, #2a1a0a, #3d2b10)', padding: '2.5rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(212,168,83,0.1)' }} />
                <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--latte)', marginBottom: '0.5rem' }}>CURRENT BALANCE</p>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '4rem', color: '#d4a853', marginBottom: '0.25rem' }}>{loyaltyPoints.toLocaleString()}</div>
                <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>GOLDEN POINTS · {tier}</div>
                {nextTier && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>
                      <span>Progress to {nextTier.name}</span>
                      <span>{nextTier.at - loyaltyPoints} pts to go</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(to right, #d4a853, #b8894a)', borderRadius: '2px', width: `${(loyaltyPoints / nextTier.at) * 100}%`, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {[
                  { tier: '🥉 Bronze', pts: '0–499', active: loyaltyPoints < 500 },
                  { tier: '🥈 Silver', pts: '500–1499', active: loyaltyPoints >= 500 && loyaltyPoints < 1500 },
                  { tier: '🥇 Gold', pts: '1500–4999', active: loyaltyPoints >= 1500 && loyaltyPoints < 5000 },
                  { tier: '💎 Diamond', pts: '5000+', active: loyaltyPoints >= 5000 },
                ].map(({ tier, pts, active }) => (
                  <div key={tier} style={{ background: active ? 'rgba(184,137,74,0.1)' : '#fff', border: active ? '1px solid rgba(184,137,74,0.4)' : '1px solid var(--sand-100)', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: active ? 'var(--bronze)' : '#ccc', marginBottom: '0.3rem' }}>{tier}</div>
                    <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', color: active ? 'var(--latte)' : '#ddd', letterSpacing: '0.1em' }}>{pts} pts</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '2rem' }}>My Profile</h1>
              <div style={{ background: '#fff', padding: '2.5rem', border: '1px solid var(--sand-100)', maxWidth: '600px' }}>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {[
                    { label: 'FULL NAME', value: user?.name, icon: '👤' },
                    { label: 'EMAIL ADDRESS', value: user?.email, icon: '📧' },
                    { label: 'MEMBER ROLE', value: user?.role?.toUpperCase(), icon: '🎭' },
                  ].map(({ label, value, icon }) => (
                    <div key={label}>
                      <label style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--latte)', display: 'block', marginBottom: '0.5rem' }}>{icon} {label}</label>
                      <div style={{ padding: '0.75rem 1rem', background: 'var(--sand-50)', border: '1px solid var(--sand-100)', fontFamily: 'Josefin Sans', fontSize: '0.85rem', color: 'var(--deep-espresso)' }}>{value}</div>
                    </div>
                  ))}
                  <button onClick={() => toast.success('Profile update coming soon!')} style={{
                    background: 'linear-gradient(135deg, #b8894a, #7c5828)', color: '#fff',
                    border: 'none', padding: '0.9rem', cursor: 'pointer',
                    fontFamily: 'Josefin Sans', fontSize: '0.7rem', letterSpacing: '0.2em',
                  }}>UPDATE PROFILE</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
