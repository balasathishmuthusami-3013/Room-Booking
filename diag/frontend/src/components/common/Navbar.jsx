/**
 * Navbar.jsx — Premium animated navbar with magnetic hover + ink underline
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI } from '../../services/api';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [open, setOpen]               = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [scrolled, setScrolled]       = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      bookingAPI.getMyBookings({ status:'pending', limit:10 })
        .then(({ data }) => setPendingCount(data.data.total || data.data.bookings?.length || 0))
        .catch(() => {});
    }
  }, [isAuthenticated, isAdmin, location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  // Home button: if already on '/', smoothly scroll to top; otherwise navigate
  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`text-white sticky top-0 z-50 nav-slide-down transition-all duration-300 ${
        scrolled ? 'bg-gray-900/95 backdrop-blur shadow-2xl shadow-black/30' : 'bg-gray-900'
      }`}
    >
      <style>{`
        .nav-link-anim { position:relative; transition: color 0.2s ease; }
        .nav-link-anim::after {
          content:''; position:absolute; bottom:-2px; left:50%; right:50%;
          height:2px; background:#F59E0B; border-radius:2px;
          transition: left 0.35s cubic-bezier(0.16,1,0.3,1), right 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .nav-link-anim:hover::after,
        .nav-link-anim.is-active::after { left:8px; right:8px; }
        .nav-logo-em {
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), text-shadow 0.3s ease;
        }
        .nav-logo-em:hover { transform: scale(1.1) rotate(-4deg); }
        .nav-avatar {
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
        }
        .nav-avatar:hover { transform:scale(1.2) rotate(6deg); box-shadow:0 0 0 3px rgba(251,191,36,0.55); }
        .nav-logout { transition:all 0.2s ease; }
        .nav-logout:hover { background:#EF4444 !important; transform:scale(1.05); }
        .mobile-slide { animation: mobileSlide 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes mobileSlide { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .pending-badge { animation: badgePing 1.5s ease-in-out infinite; }
        @keyframes badgePing { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
        .nav-cta {
          position:relative; overflow:hidden;
          transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .nav-cta::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform:translateX(-100%);
          transition: transform 0.4s ease;
        }
        .nav-cta:hover::after { transform:translateX(100%); }
        .nav-cta:hover { transform:scale(1.05) translateY(-1px); box-shadow:0 6px 18px rgba(251,191,36,0.3); }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <span className="text-amber-400 text-2xl nav-logo-em inline-block">🏨</span>
            <span
              className="font-bold text-xl text-amber-400 group-hover:text-amber-300 transition-colors duration-200"
              style={{ fontFamily:"'Playfair Display','Cormorant Garamond',Georgia,serif", letterSpacing:'0.06em', fontStyle:'italic' }}
            >
              Amigo
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" active={isActive('/')} onClick={handleHomeClick}>🏠 Home</NavLink>

            {!isAdmin && <NavLink to="/hotels" active={isActive('/hotels') || isActive('/rooms')}>Hotels &amp; Rooms</NavLink>}

            {isAuthenticated && !isAdmin && (
              <>
                <Link
                  to="/bookings"
                  className={`nav-cta relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive('/bookings') ? 'bg-amber-400 text-gray-900' : 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30'
                  }`}
                >
                  📋 My Bookings
                  {pendingCount > 0 && (
                    <span className="pending-badge absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/spa/bookings"
                  className={`nav-cta flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive('/spa/bookings') ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30'
                  }`}
                >
                  🌿 Spa Bookings
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link to="/admin"
                  className="nav-cta flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30 transition">
                  📊 Admin Dashboard
                </Link>
                <Link to="/admin/loyalty"
                  className="nav-cta flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30 transition">
                  🏆 Loyalty Program
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition">
                  <div className="nav-avatar w-7 h-7 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center font-bold text-sm">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="nav-logout bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition">
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 transition nav-link-anim">Login</Link>
                <Link to="/register" className="nav-cta bg-amber-400 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-300 transition">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-xl transition-transform duration-200 active:scale-90"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-gray-800 px-4 pb-4 flex flex-col gap-1 border-t border-gray-700 mobile-slide">
          <MobileLink to="/" onClick={(e) => { setOpen(false); handleHomeClick(e); }}>🏠 Home</MobileLink>
          {!isAdmin && <MobileLink to="/hotels" onClick={() => setOpen(false)}>🏨 Hotels &amp; Rooms</MobileLink>}
          {isAuthenticated && !isAdmin && (
            <>
              <MobileLink to="/bookings" onClick={() => setOpen(false)}>
                📋 My Bookings
                {pendingCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount} pending</span>
                )}
              </MobileLink>
              <MobileLink to="/spa/bookings" onClick={() => setOpen(false)}>🌿 Spa Bookings</MobileLink>
            </>
          )}
          {isAdmin && <MobileLink to="/admin" onClick={() => setOpen(false)}>📊 Admin Dashboard</MobileLink>}
          {isAdmin && <MobileLink to="/admin/loyalty" onClick={() => setOpen(false)}>🏆 Loyalty Program</MobileLink>}
          <div className="border-t border-gray-700 mt-2 pt-2">
            {isAuthenticated ? (
              <>
                <MobileLink to="/profile" onClick={() => setOpen(false)}>👤 My Profile</MobileLink>
                <button
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="nav-logout w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/login"    onClick={() => setOpen(false)}>Login</MobileLink>
                <MobileLink to="/register" onClick={() => setOpen(false)}>Register</MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

const NavLink = ({ to, active, children }) => (
  <Link
    to={to}
    className={`nav-link-anim px-3 py-2 rounded-lg text-sm font-medium transition ${
      active ? 'bg-gray-700 text-white is-active' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`}
  >
    {children}
  </Link>
);

const MobileLink = ({ to, onClick, children }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition active:scale-95"
  >
    {children}
  </Link>
);
