import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

/* ─── Static review seed ─── */
const SEED_REVIEWS = [
  { id: 1, name: 'Isabella Fontaine', rating: 5, date: 'February 2025', avatar: 'IF', comment: 'Absolutely breathtaking. The suite was beyond our expectations — every detail whispered luxury. The staff anticipated every need before we even voiced it. A true sanctuary.', room: 'Royal Penthouse Suite' },
  { id: 2, name: 'Marcus Ellington', rating: 5, date: 'January 2025', avatar: 'ME', comment: 'We celebrated our anniversary here and it was magical. The honeymoon package exceeded every expectation. The rose petal turndown and champagne welcome were divine touches.', room: 'Honeymoon Suite' },
  { id: 3, name: 'Sophia Laurent', rating: 4, date: 'March 2025', avatar: 'SL', comment: 'The architecture alone is worth the stay. Waking up to panoramic views with the finest Egyptian cotton sheets — this is what travel should feel like.', room: 'Deluxe Ocean View' },
];

const ROOMS_MOCK = [
  { _id: '1', name: 'Royal Penthouse Suite', type: 'penthouse', pricePerNight: 1200, images: [], rating: { average: 4.9 }, description: 'An architectural marvel perched on the highest floor with panoramic views.' },
  { _id: '2', name: 'Garden Deluxe Room', type: 'deluxe', pricePerNight: 480, images: [], rating: { average: 4.7 }, description: 'Serene garden-facing sanctuary with private terrace and bespoke furnishings.' },
  { _id: '3', name: 'Grand Honeymoon Suite', type: 'suite', pricePerNight: 850, images: [], rating: { average: 4.8 }, description: 'Romance redefined — a haven for couples seeking the pinnacle of intimacy.' },
];

const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
];

export default function HomePage() {
  useScrollReveal();
  const { user } = useAuth();
  const [reviews, setReviews] = useState(SEED_REVIEWS);
  const [rooms, setRooms] = useState(ROOMS_MOCK);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: user?.name || '', rating: 5, comment: '', room: '' });
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const reviewsRef = useRef(null);

  useEffect(() => {
    // Re-run scroll reveal when content changes
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children')
      .forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [reviews]);

  useEffect(() => {
    // Load saved reviews from localStorage
    const saved = localStorage.getItem('hotel_reviews');
    if (saved) {
      const parsed = JSON.parse(saved);
      setReviews([...SEED_REVIEWS, ...parsed]);
    }
  }, []);

  const submitReview = () => {
    if (!reviewForm.name || !reviewForm.comment) {
      toast.error('Please fill in all fields');
      return;
    }
    const newReview = {
      id: Date.now(),
      name: reviewForm.name,
      rating: reviewForm.rating,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      avatar: reviewForm.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      comment: reviewForm.comment,
      room: reviewForm.room || 'General Stay',
    };
    const savedReviews = JSON.parse(localStorage.getItem('hotel_reviews') || '[]');
    savedReviews.push(newReview);
    localStorage.setItem('hotel_reviews', JSON.stringify(savedReviews));
    setReviews(prev => [...prev, newReview]);
    setReviewForm({ name: user?.name || '', rating: 5, comment: '', room: '' });
    setShowReviewForm(false);
    toast.success('Your review has been published!');
    setTimeout(() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
  };

  const StarRating = ({ rating, onChange, size = 20 }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} onClick={() => onChange && onChange(s)}
          style={{ fontSize: size, cursor: onChange ? 'pointer' : 'default', color: s <= rating ? '#c9a96e' : '#ddd', transition: 'color 0.2s' }}>★</span>
      ))}
    </div>
  );

  return (
    <div style={{ background: 'var(--ivory)', minHeight: '100vh' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        height: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, rgba(42,26,10,0.75) 0%, rgba(90,60,20,0.5) 50%, rgba(42,26,10,0.8) 100%)`,
          zIndex: 1,
        }} />
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=85"
          alt="Luxury Hotel"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.7rem', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', animation: 'fadeUp 1s ease forwards' }}>
            WELCOME TO
          </p>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
            fontSize: 'clamp(3.5rem, 10vw, 8rem)', lineHeight: 1,
            color: '#fff', letterSpacing: '0.05em',
            textShadow: '0 4px 40px rgba(0,0,0,0.3)',
            animation: 'fadeUp 1s 0.2s ease both',
          }}>
            Axopay<br />
            <span style={{ color: '#d4a853' }}>Luxury</span>
          </h1>
          <div style={{ width: '60px', height: '1px', background: 'linear-gradient(to right, transparent, #d4a853, transparent)', margin: '2rem auto', animation: 'fadeIn 1s 0.4s ease both' }} />
          <p style={{
            fontFamily: 'Josefin Sans', fontSize: '0.9rem', letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.8)', marginBottom: '3rem',
            animation: 'fadeUp 1s 0.5s ease both',
          }}>
            WHERE EVERY MOMENT BECOMES A MEMORY
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', animation: 'fadeUp 1s 0.7s ease both' }}>
            <Link to="/rooms" style={{
              background: 'linear-gradient(135deg, #b8894a, #9a6f38)',
              color: '#fff', textDecoration: 'none',
              padding: '1rem 2.5rem', letterSpacing: '0.2em',
              fontFamily: 'Josefin Sans', fontSize: '0.75rem', fontWeight: 600,
            }}>EXPLORE ROOMS</Link>
            <a href="#booking" style={{
              border: '1px solid rgba(255,255,255,0.5)',
              color: '#fff', textDecoration: 'none',
              padding: '1rem 2.5rem', letterSpacing: '0.2em',
              fontFamily: 'Josefin Sans', fontSize: '0.75rem', fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }}>RESERVE NOW</a>
          </div>
        </div>
        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2, textAlign: 'center' }}>
          <div style={{ width: '1px', height: '60px', background: 'linear-gradient(to bottom, transparent, #d4a853)', margin: '0 auto', animation: 'pulse 2s infinite' }} />
        </div>
      </section>

      {/* ── BOOKING FORM ── */}
      <section id="booking" style={{ background: 'var(--deep-espresso)', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p className="reveal" style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.35em', color: 'var(--latte)', textAlign: 'center', marginBottom: '1.5rem' }}>RESERVE YOUR STAY</p>
          <div className="reveal stagger-children" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1px', background: 'rgba(200,169,110,0.2)' }}>
            {[
              { label: 'CHECK IN', type: 'date', value: checkIn, onChange: e => setCheckIn(e.target.value) },
              { label: 'CHECK OUT', type: 'date', value: checkOut, onChange: e => setCheckOut(e.target.value) },
              { label: 'GUESTS', type: 'number', value: guests, onChange: e => setGuests(e.target.value), min: 1, max: 10 },
            ].map(({ label, type, value, onChange, min, max }) => (
              <div key={label} style={{ background: 'var(--deep-espresso)', padding: '1.5rem', borderLeft: '1px solid rgba(200,169,110,0.15)' }}>
                <label style={{ display: 'block', fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.25em', color: 'var(--latte)', marginBottom: '0.5rem' }}>{label}</label>
                <input type={type} value={value} onChange={onChange} min={min} max={max}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'Josefin Sans', fontSize: '0.9rem', letterSpacing: '0.05em' }}
                />
              </div>
            ))}
            <Link to="/rooms" style={{
              background: 'linear-gradient(135deg, #b8894a, #7c5828)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem 2rem', textDecoration: 'none',
              color: '#fff', fontFamily: 'Josefin Sans',
              fontSize: '0.7rem', letterSpacing: '0.2em', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>SEARCH →</Link>
          </div>
        </div>
      </section>

      {/* ── SPLIT SCREEN LUXURY LAYOUT ── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '90vh' }}>
        {/* Left: Couple Image (replaced as requested) */}
        <div className="reveal-left" style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=900&q=85"
            alt="Romantic couple at luxury hotel"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s ease' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
          <div style={{
            position: 'absolute', bottom: '2rem', left: '2rem',
            background: 'rgba(42,26,10,0.85)', backdropFilter: 'blur(10px)',
            padding: '1rem 1.5rem', borderLeft: '3px solid #d4a853',
          }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#fff', fontWeight: 300 }}>Romance Redefined</p>
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: 'var(--latte)', letterSpacing: '0.2em' }}>HONEYMOON EXPERIENCES</p>
          </div>
        </div>

        {/* Right: Hotel exterior */}
        <div className="reveal-right" style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=85"
            alt="Luxury hotel exterior"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s ease' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(42,26,10,0.4)',
          }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3.5rem', fontWeight: 300, color: '#fff', textAlign: 'center', marginBottom: '1rem' }}>
              The Axopay<br /><em>Experience</em>
            </h2>
            <div style={{ width: '60px', height: '1px', background: '#d4a853', margin: '0 auto 1rem' }} />
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: '300px' }}>
              Five-star luxury in every heartbeat of your journey
            </p>
          </div>
        </div>
      </section>

      {/* ── HONEYMOON OFFERS ── */}
      <section style={{ background: 'var(--deep-espresso)', padding: '6rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(212,168,83,0.05)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.4em', color: 'var(--latte)', marginBottom: '1rem' }}>💑 MADE FOR TWO</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, color: '#fff' }}>
              Honeymoon <em style={{ color: '#d4a853' }}>Offers</em>
            </h2>
            <div style={{ width: '80px', height: '1px', background: 'linear-gradient(to right, transparent, #d4a853, transparent)', margin: '1.5rem auto' }} />
            <p style={{ fontFamily: 'Josefin Sans', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', letterSpacing: '0.1em', maxWidth: '500px', margin: '0 auto' }}>
              Curated escapes for couples beginning their forever
            </p>
          </div>

          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { icon: '🌹', title: 'Rose Petal Package', desc: 'Rose petal turndown, champagne on arrival, couples spa treatment, and a private candlelit dinner by the pool.', price: 'from $299/night', badge: 'MOST ROMANTIC' },
              { icon: '🥂', title: 'Champagne Escape', desc: 'Premium suite upgrade, daily breakfast in bed, sunset cocktails, couple\'s photo session and concierge service.', price: 'from $450/night', badge: 'BESTSELLER' },
              { icon: '🌙', title: 'Moonlit Retreat', desc: 'Rooftop dinner under the stars, moonlit pool access, personalized keepsake gift, and late checkout privilege.', price: 'from $620/night', badge: 'EXCLUSIVE' },
            ].map(({ icon, title, desc, price, badge }) => (
              <div key={title} style={{
                border: '1px solid rgba(200,169,110,0.2)',
                padding: '2.5rem', position: 'relative', cursor: 'pointer',
                transition: 'border-color 0.3s, transform 0.3s',
                background: 'rgba(255,255,255,0.02)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4a853'; e.currentTarget.style.transform = 'translateY(-6px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.2)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(184,137,74,0.2)', border: '1px solid rgba(184,137,74,0.4)', padding: '0.2rem 0.6rem', borderRadius: '2px' }}>
                  <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.55rem', letterSpacing: '0.15em', color: '#d4a853' }}>{badge}</span>
                </div>
                <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>{icon}</div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: '#fff', fontWeight: 300, marginBottom: '1rem' }}>{title}</h3>
                <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{desc}</p>
                <div style={{ borderTop: '1px solid rgba(200,169,110,0.15)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: '#d4a853' }}>{price}</span>
                  <Link to="/rooms" style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em', color: '#b8894a', textDecoration: 'none' }}>BOOK NOW →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ROOMS ── */}
      <section style={{ padding: '6rem 2rem', background: 'var(--ivory)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.4em', color: 'var(--latte)', marginBottom: '1rem' }}>OUR COLLECTION</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, color: 'var(--deep-espresso)' }}>
              Signature <em>Rooms</em>
            </h2>
            <div className="gold-divider" />
          </div>
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {ROOMS_MOCK.map((room, i) => (
              <div key={room._id} style={{
                background: '#fff', overflow: 'hidden',
                boxShadow: '0 4px 30px rgba(42,26,10,0.08)',
                transition: 'transform 0.4s ease, box-shadow 0.4s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(42,26,10,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 30px rgba(42,26,10,0.08)'; }}
              >
                <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                  <img src={ROOM_IMAGES[i]} alt={room.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  />
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(42,26,10,0.8)', padding: '0.3rem 0.8rem' }}>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--latte)', textTransform: 'uppercase' }}>{room.type}</span>
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--deep-espresso)', marginBottom: '0.5rem' }}>{room.name}</h3>
                  <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: '#999', lineHeight: 1.6, marginBottom: '1rem' }}>{room.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--sand-100)', paddingTop: '1rem' }}>
                    <div>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: 'var(--bronze)' }}>${room.pricePerNight}</span>
                      <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#bbb', marginLeft: '0.3rem' }}>/night</span>
                    </div>
                    <Link to={`/rooms/${room._id}`} style={{
                      background: 'var(--deep-espresso)', color: 'var(--latte)',
                      textDecoration: 'none', padding: '0.5rem 1.2rem',
                      fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em',
                    }}>VIEW DETAILS</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="reveal" style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/rooms" style={{
              border: '1px solid var(--bronze)', color: 'var(--bronze)',
              textDecoration: 'none', padding: '0.9rem 2.5rem',
              fontFamily: 'Josefin Sans', fontSize: '0.7rem', letterSpacing: '0.2em',
              display: 'inline-block', transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.target.style.background = 'var(--bronze)'; e.target.style.color = '#fff'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--bronze)'; }}
            >VIEW ALL ROOMS</Link>
          </div>
        </div>
      </section>

      {/* ── LOYALTY PROGRAM ── */}
      <section style={{ background: 'linear-gradient(135deg, #2a1a0a 0%, #3d2b10 50%, #2a1a0a 100%)', padding: '6rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=30") center/cover', opacity: 0.05 }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div className="reveal">
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.4em', color: 'var(--latte)', marginBottom: '1rem' }}>🏅 EXCLUSIVE MEMBERSHIP</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, color: '#fff', marginBottom: '1.5rem' }}>
              Axopay <em style={{ color: '#d4a853' }}>Loyalty Program</em>
            </h2>
            <div style={{ width: '80px', height: '1px', background: 'linear-gradient(to right, transparent, #d4a853, transparent)', margin: '0 auto 2rem' }} />
            <p style={{ fontFamily: 'Josefin Sans', color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', letterSpacing: '0.08em', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto 3rem' }}>
              Join our distinguished circle of connoisseurs. Earn golden points with every stay, redeem for exclusive privileges, and ascend through our tiers of extraordinary recognition.
            </p>
          </div>
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(200,169,110,0.15)', marginBottom: '3rem' }}>
            {[
              { tier: '🥉 Bronze', pts: '0–499 pts', perks: 'Priority check-in, 5% dining discount' },
              { tier: '🥈 Silver', pts: '500–1499 pts', perks: 'Room upgrade requests, complimentary breakfast' },
              { tier: '🥇 Gold', pts: '1500–4999 pts', perks: 'Suite upgrades, airport transfer, spa credits' },
              { tier: '💎 Diamond', pts: '5000+ pts', perks: 'Butler service, unlimited upgrades, VIP events' },
            ].map(({ tier, pts, perks }) => (
              <div key={tier} style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem 1rem', borderLeft: '1px solid rgba(200,169,110,0.1)' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#d4a853', marginBottom: '0.5rem' }}>{tier}</div>
                <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: 'var(--latte)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>{pts}</div>
                <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{perks}</div>
              </div>
            ))}
          </div>
          <Link to="/dashboard" style={{
            background: 'linear-gradient(135deg, #b8894a, #7c5828)',
            color: '#fff', textDecoration: 'none',
            padding: '1rem 2.5rem', fontFamily: 'Josefin Sans',
            fontSize: '0.7rem', letterSpacing: '0.2em',
          }}>JOIN THE PROGRAM →</Link>
        </div>
      </section>

      {/* ── GUEST REVIEWS ── */}
      <section ref={reviewsRef} style={{ padding: '6rem 2rem', background: 'var(--sand-50)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.4em', color: 'var(--latte)', marginBottom: '1rem' }}>⭐ GUEST VOICES</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, color: 'var(--deep-espresso)' }}>
              What Our Guests <em>Say</em>
            </h2>
            <div className="gold-divider" />
            <button onClick={() => setShowReviewForm(!showReviewForm)} style={{
              marginTop: '1.5rem',
              background: showReviewForm ? 'transparent' : 'var(--deep-espresso)',
              color: showReviewForm ? 'var(--deep-espresso)' : 'var(--latte)',
              border: '1px solid var(--deep-espresso)',
              padding: '0.7rem 2rem', cursor: 'pointer',
              fontFamily: 'Josefin Sans', fontSize: '0.7rem', letterSpacing: '0.15em',
              transition: 'all 0.3s',
            }}>{showReviewForm ? '✕ CANCEL' : '✍ WRITE A REVIEW'}</button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="reveal" style={{
              background: '#fff', padding: '2.5rem',
              marginBottom: '3rem', border: '1px solid var(--sand-200)',
              boxShadow: '0 10px 40px rgba(42,26,10,0.08)',
              maxWidth: '700px', margin: '0 auto 3rem',
            }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: 'var(--deep-espresso)', marginBottom: '1.5rem' }}>
                Share Your Experience
              </h3>
              <div style={{ display: 'grid', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--bronze)', display: 'block', marginBottom: '0.5rem' }}>YOUR NAME</label>
                    <input value={reviewForm.name} onChange={e => setReviewForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Full name"
                      style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--sand-200)', background: 'var(--sand-50)', fontFamily: 'Josefin Sans', outline: 'none', color: 'var(--deep-espresso)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--bronze)', display: 'block', marginBottom: '0.5rem' }}>ROOM STAYED IN</label>
                    <input value={reviewForm.room} onChange={e => setReviewForm(p => ({ ...p, room: e.target.value }))}
                      placeholder="Room name (optional)"
                      style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--sand-200)', background: 'var(--sand-50)', fontFamily: 'Josefin Sans', outline: 'none', color: 'var(--deep-espresso)' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--bronze)', display: 'block', marginBottom: '0.5rem' }}>YOUR RATING</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                        style={{ fontSize: '28px', cursor: 'pointer', color: s <= reviewForm.rating ? '#c9a96e' : '#ddd', transition: 'color 0.2s, transform 0.2s' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      >★</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--bronze)', display: 'block', marginBottom: '0.5rem' }}>YOUR REVIEW</label>
                  <textarea value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                    placeholder="Tell us about your stay..."
                    rows={4}
                    style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--sand-200)', background: 'var(--sand-50)', fontFamily: 'Josefin Sans', fontSize: '0.85rem', outline: 'none', color: 'var(--deep-espresso)', resize: 'vertical' }}
                  />
                </div>
                <button onClick={submitReview} style={{
                  background: 'linear-gradient(135deg, #b8894a, #7c5828)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  padding: '0.9rem', fontFamily: 'Josefin Sans',
                  fontSize: '0.7rem', letterSpacing: '0.2em', fontWeight: 600,
                  transition: 'opacity 0.3s',
                }}>PUBLISH REVIEW</button>
              </div>
            </div>
          )}

          {/* Reviews Grid */}
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {reviews.map((review) => (
              <div key={review.id} style={{
                background: '#fff', padding: '2rem',
                border: '1px solid var(--sand-100)',
                boxShadow: '0 4px 20px rgba(42,26,10,0.05)',
                position: 'relative', transition: 'transform 0.3s, box-shadow 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(42,26,10,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(42,26,10,0.05)'; }}
              >
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '4rem', color: 'var(--sand-100)', lineHeight: 1 }}>"</div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #b8894a, #7c5828)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Josefin Sans', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                    {review.avatar}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.8rem', fontWeight: 600, color: 'var(--deep-espresso)' }}>{review.name}</div>
                    <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#bbb', letterSpacing: '0.1em' }}>{review.date} · {review.room}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '0.75rem' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} style={{ color: s <= review.rating ? '#c9a96e' : '#e0d5c5', fontSize: '14px' }}>★</span>
                  ))}
                </div>
                <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.8rem', color: '#777', lineHeight: 1.7 }}>{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--deep-espresso)', padding: '4rem 2rem 2rem', color: 'rgba(255,255,255,0.5)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: '#fff', marginBottom: '1rem', fontWeight: 300, letterSpacing: '0.1em' }}>AXOPAY</div>
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.45)' }}>
              A sanctuary of timeless luxury, where extraordinary hospitality meets architectural grandeur.
            </p>
          </div>
          {[
            { title: 'Explore', links: ['Rooms & Suites', 'Dining', 'Spa & Wellness', 'Events'] },
            { title: 'Services', links: ['Concierge', 'Airport Transfer', 'Honeymoon Packages', 'Business Center'] },
            { title: 'Contact', links: ['+1 800 AXOPAY', 'hello@axopay.com', '5th Avenue, NY', 'Open 24/7'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--latte)', marginBottom: '1.5rem' }}>{title}</div>
              {links.map(link => (
                <div key={link} style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.6rem', cursor: 'pointer', transition: 'color 0.3s' }}
                  onMouseEnter={e => e.target.style.color = '#d4a853'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >{link}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(200,169,110,0.1)', paddingTop: '2rem', textAlign: 'center', fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em' }}>
          © 2025 AXOPAY LUXURY HOTELS · ALL RIGHTS RESERVED
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
