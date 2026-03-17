import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      transition: 'all 0.4s ease',
      background: scrolled
        ? 'rgba(250, 246, 238, 0.97)'
        : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(200,169,110,0.3)' : 'none',
      padding: scrolled ? '0.75rem 2rem' : '1.5rem 2rem',
    }}>
      <div style={{
        maxWidth: '1400px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.8rem', fontWeight: 300, letterSpacing: '0.15em',
              color: scrolled ? '#2a1a0a' : '#fff',
              textShadow: scrolled ? 'none' : '0 2px 20px rgba(0,0,0,0.3)',
            }}>AXOPAY</span>
            <span style={{
              fontFamily: 'Josefin Sans, sans-serif',
              fontSize: '0.6rem', letterSpacing: '0.3em', fontWeight: 600,
              color: scrolled ? '#9a6f38' : 'rgba(255,255,255,0.8)',
              alignSelf: 'flex-end', marginBottom: '4px',
            }}>LUXURY HOTELS</span>
          </div>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          {[
            { to: '/', label: 'Home' },
            { to: '/rooms', label: 'Rooms' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              textDecoration: 'none',
              fontFamily: 'Josefin Sans, sans-serif',
              fontSize: '0.75rem', letterSpacing: '0.2em', fontWeight: 600,
              color: scrolled ? '#2a1a0a' : 'rgba(255,255,255,0.9)',
              transition: 'color 0.3s',
            }}>{label}</Link>
          ))}

          {user ? (
            <>
              <Link to="/dashboard" style={{
                textDecoration: 'none',
                fontFamily: 'Josefin Sans, sans-serif',
                fontSize: '0.75rem', letterSpacing: '0.2em', fontWeight: 600,
                color: scrolled ? '#2a1a0a' : 'rgba(255,255,255,0.9)',
              }}>Dashboard</Link>

              {user.role === 'admin' && (
                <Link to="/admin" style={{
                  textDecoration: 'none',
                  fontFamily: 'Josefin Sans, sans-serif',
                  fontSize: '0.75rem', letterSpacing: '0.2em', fontWeight: 600,
                  color: '#b8894a',
                  padding: '0.3rem 0.8rem',
                  border: '1px solid #b8894a',
                  borderRadius: '2px',
                }}>Admin</Link>
              )}

              <button onClick={handleLogout} style={{
                background: 'linear-gradient(135deg, #b8894a, #9a6f38)',
                color: '#fff', border: 'none', cursor: 'pointer',
                padding: '0.5rem 1.2rem', borderRadius: '2px',
                fontFamily: 'Josefin Sans, sans-serif',
                fontSize: '0.7rem', letterSpacing: '0.15em', fontWeight: 600,
              }}>Sign Out</button>
            </>
          ) : (
            <Link to="/login" style={{
              background: 'linear-gradient(135deg, #b8894a, #9a6f38)',
              color: '#fff', textDecoration: 'none',
              padding: '0.5rem 1.5rem', borderRadius: '2px',
              fontFamily: 'Josefin Sans, sans-serif',
              fontSize: '0.7rem', letterSpacing: '0.15em', fontWeight: 600,
            }}>Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
