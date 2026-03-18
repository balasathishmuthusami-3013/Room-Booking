import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-auto relative overflow-hidden">
      <style>{`
        .footer-link {
          transition: all 0.25s ease;
          display: inline-flex; align-items: center; gap: 0.25rem;
        }
        .footer-link:hover { color: #F59E0B; transform: translateX(4px); }
        .footer-logo-icon {
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
          display: inline-block;
        }
        .footer-logo-icon:hover { transform: scale(1.2) rotate(-10deg); }
        .footer-grid-item {
          opacity: 0; transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .footer-grid-item.footer-visible {
          opacity: 1; transform: translateY(0);
        }
        .footer-divider {
          background: linear-gradient(90deg, transparent, #F59E0B40, transparent);
          height: 1px; border: none;
        }
        .social-btn {
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.05); font-size: 14px;
        }
        .social-btn:hover { background: rgba(251,191,36,0.2); transform: scale(1.3) rotate(10deg); }
        @keyframes footerGlow {
          0%,100% { opacity: 0.03; }
          50%      { opacity: 0.07; }
        }
        .footer-bg-blob {
          position: absolute; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, #F59E0B, transparent);
          animation: footerGlow 6s ease-in-out infinite;
        }
      `}</style>

      {/* Background decoration blobs */}
      <div className="footer-bg-blob" style={{width:'300px',height:'300px',left:'-100px',top:'-100px'}}/>
      <div className="footer-bg-blob" style={{width:'200px',height:'200px',right:'-50px',bottom:'-50px',animationDelay:'3s'}}/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FooterAnimated />
      </div>
    </footer>
  );
}

function FooterAnimated() {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const items = [
    { delay: '0s', content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="footer-logo-icon text-amber-400 text-xl">🏨</span>
          <span className="text-amber-400 font-bold text-lg" style={{fontFamily:"'Playfair Display', Georgia, serif", fontStyle:'italic'}}>Amigo</span>
        </div>
        <p className="text-sm leading-relaxed mb-4">A century of uncompromising luxury. Where every moment becomes a memory.</p>
        <div className="flex gap-2">
          {['🐦','📘','📸','▶️'].map((s, i) => (
            <span key={i} className="social-btn cursor-pointer">{s}</span>
          ))}
        </div>
      </div>
    )},
    { delay: '0.1s', content: (
      <div>
        <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Hotel</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/rooms"  className="footer-link">🛏 Rooms &amp; Suites</Link></li>
          <li><Link to="/dining" className="footer-link">🍽️ Dining</Link></li>
          <li><Link to="/spa"    className="footer-link">🌿 Spa &amp; Wellness</Link></li>
        </ul>
      </div>
    )},
    { delay: '0.2s', content: (
      <div>
        <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Guests</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/bookings" className="footer-link">📋 My Bookings</Link></li>
          <li><Link to="/profile"  className="footer-link">👤 My Profile</Link></li>
          <li>
            <Link to="/loyalty" className="footer-link">
              ✨ Loyalty Program
              <span className="bg-amber-400 text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ml-1">5 Events</span>
            </Link>
          </li>
        </ul>
      </div>
    )},
    { delay: '0.3s', content: (
      <div>
        <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Contact</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2 hover:text-amber-400 transition cursor-default">📞 +91 98765 00000</li>
          <li className="flex items-center gap-2 hover:text-amber-400 transition cursor-default">✉️ reservations@amigo.com</li>
          <li className="flex items-center gap-2 hover:text-amber-400 transition cursor-default">📍 Anna Salai, Chennai</li>
        </ul>
      </div>
    )},
  ];

  return (
    <div ref={ref}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {items.map((item, i) => (
          <div key={i} className={`footer-grid-item ${visible ? 'footer-visible' : ''}`}
            style={{ transitionDelay: item.delay }}>
            {item.content}
          </div>
        ))}
      </div>
      <div className="footer-divider mb-6"/>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
        <span className="hover:text-amber-400 transition">© {new Date().getFullYear()} Amigo Hotel. All rights reserved.</span>
        <span className="flex gap-4">
          <span className="hover:text-amber-400 transition cursor-pointer">Privacy Policy</span>
          <span className="text-gray-700">·</span>
          <span className="hover:text-amber-400 transition cursor-pointer">Terms of Service</span>
        </span>
      </div>
    </div>
  );
}
