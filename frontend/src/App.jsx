import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar    from './components/common/Navbar';
import Footer    from './components/common/Footer';
import ChatWidget from './components/chat/ChatWidget';

import HomePage         from './pages/Customer/HomePage';
import RoomsPage        from './pages/Customer/RoomsPage';
import RoomDetailPage   from './pages/Customer/RoomDetailPage';
import BookingPage      from './pages/Customer/BookingPage';
import MyBookingsPage   from './pages/Customer/MyBookingsPage';
import BookingDetailPage from './pages/Customer/BookingDetailPage';
import ProfilePage      from './pages/Customer/ProfilePage';
import DiningPage       from './pages/Customer/DiningPage';
import SpaPage          from './pages/Customer/SpaPage';
import SpaBookingPage   from './pages/Customer/SpaBookingPage';
import SpaBookingsPage  from './pages/Customer/SpaBookingsPage';
import LoyaltyPage      from './pages/Customer/LoyaltyPage';
import LoginPage        from './pages/Auth/LoginPage';
import RegisterPage     from './pages/Auth/RegisterPage';
import AdminDashboard   from './pages/Admin/AdminDashboard';
import AdminRooms       from './pages/Admin/AdminRooms';
import AdminBookings    from './pages/Admin/AdminBookings';
import AdminUsers       from './pages/Admin/AdminUsers';
import AdminSpaBookings from './pages/Admin/AdminSpaBookings';
import AdminLoyalty     from './pages/Admin/AdminLoyalty';
import AdminCheckInRequests  from './pages/Admin/AdminCheckInRequests';
import AdminCheckOutRequests from './pages/Admin/AdminCheckOutRequests';
import AdminRateOverrides    from './pages/Admin/AdminRateOverrides';
import AdminMembership       from './pages/Admin/AdminMembership';
import AdminCities           from './pages/Admin/AdminCities';
import HotelSearchPage       from './pages/Customer/HotelSearchPage';
import MembershipPage        from './pages/Customer/MembershipPage';

/* ─────────────────────────────────────────────────────────
   PRELOADER  — white background, gold italic logo
───────────────────────────────────────────────────────── */
function Preloader({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => {
      const el = document.getElementById('luxury-preloader');
      if (el) el.classList.add('fade-out');
      setTimeout(onDone, 900);
    }, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  // Soft ambient floating dots (transparent, light gold)
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left:     `${10 + Math.random() * 80}%`,
    size:     `${5 + Math.random() * 8}px`,
    duration: `${5 + Math.random() * 8}s`,
    delay:    `${Math.random() * 4}s`,
    color:    i % 2 === 0
      ? `rgba(212,160,23,${0.06 + Math.random() * 0.08})`
      : `rgba(251,191,36,${0.04 + Math.random() * 0.06})`,
  }));

  return (
    <div id="luxury-preloader">
      {/* Ambient particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="preloader-particle"
          style={{
            left: p.left,
            bottom: '-12px',
            width:  p.size,
            height: p.size,
            background: p.color,
            animationDuration: p.duration,
            animationDelay:    p.delay,
          }}
        />
      ))}

      {/* Logo */}
      <div className="preloader-logo">Amigo</div>
      <div className="preloader-tagline">Est. 1924 · Chennai's Finest</div>

      {/* Thin gold progress bar */}
      <div className="preloader-bar-track">
        <div className="preloader-bar" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   WAVE BACKGROUND  — subtle flowing canvas, scroll-reactive
   Draws two translucent sine waves that drift slowly.
   On scroll, amplitude/offset shifts gently.
───────────────────────────────────────────────────────── */
function WaveBackground() {
  useEffect(() => {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'wave-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d');

    let W, H, raf, scrollY = 0, targetScroll = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', () => { targetScroll = window.scrollY; }, { passive: true });

    let t = 0;
    function draw() {
      // Ease scroll
      scrollY += (targetScroll - scrollY) * 0.04;
      t += 0.003; // very slow time advance

      ctx.clearRect(0, 0, W, H);

      // Wave 1 — very faint warm gold tint
      const amp1   = 38 + Math.sin(scrollY * 0.0008) * 14;
      const freq1  = 0.0014;
      const offset1 = scrollY * 0.06;

      ctx.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const y = H * 0.38
          + Math.sin(x * freq1 + t * 2.1 + offset1 * 0.01) * amp1
          + Math.sin(x * freq1 * 0.6 + t * 1.3) * (amp1 * 0.4);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const g1 = ctx.createLinearGradient(0, H * 0.2, 0, H);
      g1.addColorStop(0,   'rgba(251,191,36,0.028)');
      g1.addColorStop(0.5, 'rgba(245,158,11,0.018)');
      g1.addColorStop(1,   'rgba(251,191,36,0.008)');
      ctx.fillStyle = g1;
      ctx.fill();

      // Wave 2 — cooler, slightly lower, even softer
      const amp2  = 28 + Math.cos(scrollY * 0.0006) * 10;
      const freq2 = 0.0011;
      const offset2 = scrollY * 0.04;

      ctx.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const y = H * 0.62
          + Math.sin(x * freq2 + t * 1.7 + offset2 * 0.012 + 1.2) * amp2
          + Math.cos(x * freq2 * 0.7 + t * 0.9) * (amp2 * 0.35);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const g2 = ctx.createLinearGradient(0, H * 0.45, 0, H);
      g2.addColorStop(0,   'rgba(214,173,92,0.022)');
      g2.addColorStop(0.6, 'rgba(251,191,36,0.014)');
      g2.addColorStop(1,   'rgba(251,191,36,0.005)');
      ctx.fillStyle = g2;
      ctx.fill();

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.remove();
    };
  }, []);

  return null;
}

/* ─────────────────────────────────────────────────────────
   CLICK BURST PARTICLES
───────────────────────────────────────────────────────── */
function ClickBurst() {
  useEffect(() => {
    const colors = ['#F59E0B','#FCD34D','#FBBF24','#ffffff','#FDE68A'];
    // Inject crack keyframe once
    if (!document.getElementById('crack-style')) {
      const s = document.createElement('style');
      s.id = 'crack-style';
      s.textContent = `
        @keyframes crackShard {
          0%   { transform:translate(0,0) rotate(0deg) scale(1); opacity:1; }
          100% { transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(0); opacity:0; }
        }
        @keyframes crackRay { 0%{opacity:0.9;} 100%{opacity:0;} }
      `;
      document.head.appendChild(s);
    }
    const spawnGlassCrack = (x, y) => {
      const shardColors = ['#F59E0B','#FCD34D','#FBBF24','#FDE68A','#fff','#F97316'];
      for (let i = 0; i < 18; i++) {
        const el = document.createElement('div');
        const angle = (i / 18) * Math.PI * 2 + (Math.random()-0.5)*0.9;
        const dist  = 25 + Math.random() * 70;
        const size  = 3 + Math.random() * 8;
        el.style.cssText = `position:fixed;pointer-events:none;z-index:99999;left:${x}px;top:${y}px;width:${size}px;height:${size*(0.3+Math.random()*0.5)}px;background:${shardColors[i%shardColors.length]};transform-origin:center;border-radius:${Math.random()>0.5?'2px':'50%'};animation:crackShard 0.75s cubic-bezier(0.16,1,0.3,1) ${Math.random()*60}ms forwards;--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;--rot:${Math.random()*600-300}deg;`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 900);
      }
      for (let r = 0; r < 7; r++) {
        const ray = document.createElement('div');
        const angle = (r/7)*Math.PI*2+Math.random()*0.5;
        const len = 15+Math.random()*50;
        ray.style.cssText = `position:fixed;pointer-events:none;z-index:99998;left:${x}px;top:${y}px;width:${len}px;height:1.5px;background:linear-gradient(to right,rgba(251,191,36,0.85),transparent);transform-origin:left center;transform:rotate(${angle}rad);animation:crackRay 0.45s ease ${r*18}ms forwards;`;
        document.body.appendChild(ray);
        setTimeout(() => ray.remove(), 600);
      }
    };
    const burst = (e) => {
      if (!e.target.closest('button, a, [role="button"]')) return;
      // Glass crack effect on every button/link click
      spawnGlassCrack(e.clientX, e.clientY);
      for (let i = 0; i < 10; i++) {
        const el    = document.createElement('div');
        el.className = 'burst-particle';
        const angle = (i / 10) * Math.PI * 2;
        const dist  = 40 + Math.random() * 50;
        el.style.cssText = `
          left:${e.clientX}px; top:${e.clientY}px;
          background:${colors[i % colors.length]};
          --tx:${Math.cos(angle)*dist}px;
          --ty:${Math.sin(angle)*dist}px;
          width:${4+Math.random()*4}px; height:${4+Math.random()*4}px;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 700);
      }
    };
    window.addEventListener('click', burst);
    return () => window.removeEventListener('click', burst);
  }, []);
  return null;
}

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────────────────────── */
function ScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children'
    );
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });
  return null;
}

/* ─────────────────────────────────────────────────────────
   MAGNETIC BUTTONS
───────────────────────────────────────────────────────── */
function MagneticButtons() {
  useEffect(() => {
    const btns = document.querySelectorAll('.btn-magnetic');
    const handlers = [];
    btns.forEach(btn => {
      const move = (e) => {
        const r  = btn.getBoundingClientRect();
        const x  = ((e.clientX - r.left) / r.width)  * 100;
        const y  = ((e.clientY - r.top)  / r.height) * 100;
        btn.style.setProperty('--mx', x + '%');
        btn.style.setProperty('--my', y + '%');
        const dx = (e.clientX - r.left - r.width  / 2) * 0.15;
        const dy = (e.clientY - r.top  - r.height / 2) * 0.15;
        btn.style.transform = `translate(${dx}px,${dy}px) scale(1.04)`;
      };
      const leave = () => { btn.style.transform = ''; };
      btn.addEventListener('mousemove', move);
      btn.addEventListener('mouseleave', leave);
      handlers.push({ btn, move, leave });
    });
    return () => handlers.forEach(({ btn, move, leave }) => {
      btn.removeEventListener('mousemove', move);
      btn.removeEventListener('mouseleave', leave);
    });
  });
  return null;
}

/* ─────────────────────────────────────────────────────────
   IMAGE POP-OUT  (touch/hover on any .img-popout-wrap img)
───────────────────────────────────────────────────────── */
function ImagePopout() {
  useEffect(() => {
    const attach = () => {
      document.querySelectorAll('.img-popout-wrap img, .img-popout').forEach(img => {
        if (img.dataset.popoutBound) return;
        img.dataset.popoutBound = '1';
        img.classList.add('img-popout');

        // touch support
        img.addEventListener('touchstart', () => img.classList.add('popped'),  { passive: true });
        img.addEventListener('touchend',   () => setTimeout(() => img.classList.remove('popped'), 600), { passive: true });
      });
    };
    // Re-attach whenever DOM might change (route changes trigger re-run via useEffect)
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  });
  return null;
}

/* ─────────────────────────────────────────────────────────
   ROUTE GUARDS
───────────────────────────────────────────────────────── */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin)         return <Navigate to="/" replace />;
  return children;
};
const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
    <ChatWidget />
  </div>
);

/* ─────────────────────────────────────────────────────────
   ROUTES
───────────────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<PublicLayout><HomePage/></PublicLayout>} />
      <Route path="/rooms"     element={<Navigate to="/hotels" replace />} />
      <Route path="/rooms/:id" element={<Navigate to="/hotels" replace />} />
      <Route path="/dining"    element={<PublicLayout><DiningPage/></PublicLayout>} />
      <Route path="/spa"       element={<PublicLayout><SpaPage/></PublicLayout>} />
      <Route path="/loyalty"   element={<PublicLayout><LoyaltyPage/></PublicLayout>} />
      <Route path="/login"     element={<GuestRoute><LoginPage/></GuestRoute>} />
      <Route path="/register"  element={<GuestRoute><RegisterPage/></GuestRoute>} />
      <Route path="/spa/book"      element={<PrivateRoute><PublicLayout><SpaBookingPage/></PublicLayout></PrivateRoute>} />
      <Route path="/spa/bookings"  element={<PrivateRoute><PublicLayout><SpaBookingsPage/></PublicLayout></PrivateRoute>} />
      <Route path="/book/:roomId"  element={<PrivateRoute><PublicLayout><BookingPage/></PublicLayout></PrivateRoute>} />
      <Route path="/bookings"      element={<PrivateRoute><PublicLayout><MyBookingsPage/></PublicLayout></PrivateRoute>} />
      <Route path="/bookings/:id"  element={<PrivateRoute><PublicLayout><BookingDetailPage/></PublicLayout></PrivateRoute>} />
      <Route path="/profile"       element={<PrivateRoute><PublicLayout><ProfilePage/></PublicLayout></PrivateRoute>} />
      <Route path="/admin"               element={<AdminRoute><AdminDashboard/></AdminRoute>} />
      <Route path="/admin/rooms"         element={<AdminRoute><AdminRooms/></AdminRoute>} />
      <Route path="/admin/bookings"      element={<AdminRoute><AdminBookings/></AdminRoute>} />
      <Route path="/admin/users"         element={<AdminRoute><AdminUsers/></AdminRoute>} />
      <Route path="/admin/spa-bookings"  element={<AdminRoute><AdminSpaBookings/></AdminRoute>} />
      <Route path="/admin/loyalty"       element={<AdminRoute><AdminLoyalty/></AdminRoute>} />
      <Route path="/admin/checkin-requests"  element={<AdminRoute><AdminCheckInRequests/></AdminRoute>} />
      <Route path="/admin/checkout-requests" element={<AdminRoute><AdminCheckOutRequests/></AdminRoute>} />
      <Route path="/admin/rate-overrides"    element={<AdminRoute><AdminRateOverrides/></AdminRoute>} />
      <Route path="/admin/membership"        element={<AdminRoute><AdminMembership/></AdminRoute>} />
      <Route path="/admin/cities"            element={<AdminRoute><AdminCities/></AdminRoute>} />
      <Route path="/hotels"                  element={<PublicLayout><HotelSearchPage/></PublicLayout>} />
      <Route path="/membership"              element={<PublicLayout><MembershipPage/></PublicLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ─────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────── */
export default function App() {
  const [preloaderDone, setPreloaderDone] = useState(false);

  return (
    <>
      {/* Wave canvas (fixed, behind everything) */}
      <WaveBackground />

      {/* Preloader */}
      {!preloaderDone && <Preloader onDone={() => setPreloaderDone(true)} />}

      {/* Click burst + image popout + scroll */}
      <ClickBurst />
      <ImagePopout />

      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <ScrollReveal />
          <MagneticButtons />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
