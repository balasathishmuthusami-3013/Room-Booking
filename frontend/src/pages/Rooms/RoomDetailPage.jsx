import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const MOCK_ROOMS = {
  '1': {
    _id: '1', name: 'Royal Penthouse Suite', type: 'penthouse',
    roomNumber: 'P-01', pricePerNight: 1200, discountPercent: 0,
    description: 'An architectural marvel perched on the highest floor. Floor-to-ceiling panoramic windows frame the city skyline, while the private terrace offers an exclusive vantage point above the clouds. Every surface whispers of meticulous artistry — from the hand-laid Italian marble to the bespoke furnishings sourced from master craftsmen.',
    capacity: { adults: 4, children: 2 },
    size: 185,
    floor: 42,
    bedType: 'king',
    bedCount: 2,
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=85',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    ],
    amenities: ['Private Terrace', 'Butler Service', 'Jacuzzi', 'Mini Bar', 'Smart TV', 'WiFi', 'Safe', 'Espresso Machine', 'Rain Shower'],
    rating: { average: 4.9, count: 128 },
    smokingAllowed: false,
    petsAllowed: true,
    isAvailable: true,
  },
  '2': {
    _id: '2', name: 'Garden Deluxe Room', type: 'deluxe',
    roomNumber: 'D-204', pricePerNight: 480, discountPercent: 10,
    description: 'A serene garden-facing sanctuary where nature and luxury are seamlessly intertwined. Step through French doors onto your private terrace enveloped in lush tropical gardens. The room features bespoke furnishings in warm earth tones, creating an atmosphere of calm sophistication.',
    capacity: { adults: 2, children: 1 },
    size: 68,
    floor: 2,
    bedType: 'queen',
    bedCount: 1,
    images: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200&q=85',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
      'https://images.unsplash.com/photo-1506059612708-99d6128b0f46?w=800&q=80',
    ],
    amenities: ['Garden View Terrace', 'Rainfall Shower', 'Mini Bar', 'WiFi', 'Smart TV', 'In-Room Safe', 'Bathrobe & Slippers'],
    rating: { average: 4.7, count: 89 },
    smokingAllowed: false,
    petsAllowed: false,
    isAvailable: true,
  },
  '3': {
    _id: '3', name: 'Grand Honeymoon Suite', type: 'suite',
    roomNumber: 'S-810', pricePerNight: 850, discountPercent: 0,
    description: 'Romance redefined. This intimate sanctuary is crafted exclusively for couples, featuring a private plunge pool, handcrafted four-poster bed draped in finest silk, and a 180-degree view of the sunset horizon. Every detail — the petals scattered on arrival, the personalized champagne — exists to make your love story unforgettable.',
    capacity: { adults: 2, children: 0 },
    size: 120,
    floor: 18,
    bedType: 'king',
    bedCount: 1,
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=85',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    ],
    amenities: ['Private Plunge Pool', 'Four-poster Bed', 'Champagne on Arrival', 'Couples Spa Access', 'Butler Service', 'WiFi', 'Romantic Turndown'],
    rating: { average: 4.8, count: 64 },
    smokingAllowed: false,
    petsAllowed: false,
    isAvailable: true,
  },
};

const BED_ICONS = { king: '👑', queen: '💎', double: '🛏️', twin: '🛏️', single: '🛏️' };

export default function RoomDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(MOCK_ROOMS[id] || null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [booking, setBooking] = useState(false);
  const [nights, setNights] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!MOCK_ROOMS[id]) {
      axios.get(`/api/rooms/${id}`).then(r => setRoom(r.data.data.room)).catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const diff = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
      setNights(diff > 0 ? diff : 0);
    }
  }, [checkIn, checkOut]);

  if (!room) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory)' }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: 'var(--deep-espresso)' }}>Loading...</div>
    </div>
  );

  const effectivePrice = room.discountPercent > 0
    ? room.pricePerNight * (1 - room.discountPercent / 100)
    : room.pricePerNight;

  const handleBook = () => {
    if (!user) { navigate('/login'); return; }
    if (!checkIn || !checkOut || nights <= 0) { toast.error('Please select valid dates'); return; }
    toast.success(`Booking request submitted for ${nights} night(s)!`);
  };

  const StatCard = ({ icon, label, value, sub }) => (
    <div style={{
      background: 'rgba(42,26,10,0.04)', border: '1px solid rgba(184,137,74,0.2)',
      padding: '1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.3s, background 0.3s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4a853'; e.currentTarget.style.background = 'rgba(212,168,83,0.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(184,137,74,0.2)'; e.currentTarget.style.background = 'rgba(42,26,10,0.04)'; }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>{icon}</div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: 'var(--deep-espresso)', fontWeight: 400, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--bronze)', marginTop: '0.4rem', textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#bbb', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ background: 'var(--ivory)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero Image Gallery */}
      <div style={{ position: 'relative', height: '70vh', overflow: 'hidden', marginTop: '0' }}>
        <img src={room.images[selectedImg]} alt={room.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s ease' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(42,26,10,0.6) 100%)' }} />

        {/* Breadcrumb */}
        <div style={{ position: 'absolute', top: '100px', left: '3rem' }}>
          <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.7)' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>HOME</Link>
            {' / '}
            <Link to="/rooms" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>ROOMS</Link>
            {' / '}
            <span style={{ color: '#d4a853' }}>{room.name.toUpperCase()}</span>
          </span>
        </div>

        {/* Room title overlay */}
        <div style={{ position: 'absolute', bottom: '3rem', left: '3rem' }}>
          <div style={{ display: 'inline-block', background: 'rgba(42,26,10,0.8)', padding: '0.3rem 0.8rem', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.25em', color: 'var(--latte)', textTransform: 'uppercase' }}>{room.type} · Room {room.roomNumber}</span>
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 300, color: '#fff', lineHeight: 1.1 }}>{room.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(room.rating.average) ? '#d4a853' : 'rgba(255,255,255,0.3)', fontSize: '16px' }}>★</span>)}
            <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginLeft: '0.5rem' }}>{room.rating.average} ({room.rating.count} reviews)</span>
          </div>
        </div>

        {/* Thumbnail strip */}
        {room.images.length > 1 && (
          <div style={{ position: 'absolute', bottom: '3rem', right: '3rem', display: 'flex', gap: '0.5rem' }}>
            {room.images.map((img, i) => (
              <div key={i} onClick={() => setSelectedImg(i)} style={{
                width: '70px', height: '50px', overflow: 'hidden', cursor: 'pointer',
                border: selectedImg === i ? '2px solid #d4a853' : '2px solid transparent',
                opacity: selectedImg === i ? 1 : 0.6, transition: 'all 0.3s',
              }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '4rem 2rem', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '4rem', alignItems: 'start' }}>

        {/* Left Column */}
        <div>
          {/* Room Stats - Premium Cards */}
          <div style={{ marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--latte)', marginBottom: '1.5rem' }}>ROOM SPECIFICATIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <StatCard
                icon="👤"
                label="Adults"
                value={room.capacity.adults}
                sub={`+ ${room.capacity.children} children`}
              />
              <StatCard
                icon={BED_ICONS[room.bedType] || '🛏️'}
                label="Beds"
                value={room.bedCount}
                sub={`${room.bedType} bed`}
              />
              <StatCard
                icon="📐"
                label="Room Size"
                value={`${room.size}`}
                sub="square meters"
              />
              <StatCard
                icon="🏢"
                label="Floor"
                value={room.floor}
                sub="level"
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--deep-espresso)' }}>About This Room</h2>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, var(--sand-300), transparent)' }} />
            </div>
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.85rem', color: '#6b5a47', lineHeight: 2 }}>{room.description}</p>
          </div>

          {/* Amenities */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--deep-espresso)' }}>Amenities</h2>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, var(--sand-300), transparent)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {room.amenities.map((a, i) => {
                const emojiMap = { 'WiFi': '📡', 'Butler': '🤵', 'Jacuzzi': '🛁', 'Mini Bar': '🍸', 'Smart TV': '📺', 'Safe': '🔒', 'Pool': '🏊', 'Spa': '💆', 'Shower': '🚿', 'Terrace': '🌿', 'Champagne': '🥂', 'Espresso': '☕', 'Turndown': '🌹', 'Transfer': '🚗', 'View': '🌅' };
                const emoji = Object.entries(emojiMap).find(([k]) => a.includes(k))?.[1] || '✨';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', background: 'rgba(184,137,74,0.05)', border: '1px solid rgba(184,137,74,0.12)', borderRadius: '2px' }}>
                    <span style={{ fontSize: '1rem' }}>{emoji}</span>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.72rem', color: '#6b5a47', letterSpacing: '0.05em' }}>{a}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Policies */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { icon: room.smokingAllowed ? '🚬' : '🚭', label: room.smokingAllowed ? 'Smoking Allowed' : 'Non-Smoking', ok: !room.smokingAllowed },
              { icon: room.petsAllowed ? '🐾' : '🚫', label: room.petsAllowed ? 'Pet Friendly' : 'No Pets', ok: room.petsAllowed },
            ].map(({ icon, label, ok }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'}` }}>
                <span>{icon}</span>
                <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.7rem', color: '#6b5a47' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Booking Card */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{
            background: '#fff', boxShadow: '0 20px 60px rgba(42,26,10,0.12)',
            border: '1px solid rgba(184,137,74,0.15)', overflow: 'hidden',
          }}>
            {/* Price Header */}
            <div style={{ background: 'linear-gradient(135deg, #2a1a0a, #3d2b10)', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {room.discountPercent > 0 && (
                  <span style={{ fontFamily: 'Josefin Sans', fontSize: '1rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>${room.pricePerNight}</span>
                )}
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', color: '#d4a853', fontWeight: 400 }}>${Math.round(effectivePrice)}</span>
                <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>/ night</span>
              </div>
              {room.discountPercent > 0 && (
                <div style={{ display: 'inline-block', background: 'rgba(212,168,83,0.2)', border: '1px solid rgba(212,168,83,0.4)', padding: '0.2rem 0.6rem' }}>
                  <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#d4a853' }}>SAVE {room.discountPercent}%</span>
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: '📅 CHECK IN', type: 'date', value: checkIn, set: setCheckIn },
                  { label: '📅 CHECK OUT', type: 'date', value: checkOut, set: setCheckOut },
                ].map(({ label, type, value, set }) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--bronze)', marginBottom: '0.4rem' }}>{label}</label>
                    <input type={type} value={value} min={new Date().toISOString().split('T')[0]}
                      onChange={e => set(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem 0.8rem', border: '1px solid var(--sand-200)', background: 'var(--sand-50)', fontFamily: 'Josefin Sans', outline: 'none', fontSize: '0.85rem' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--bronze)', marginBottom: '0.4rem' }}>👥 GUESTS</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.7rem 0.8rem', border: '1px solid var(--sand-200)', background: 'var(--sand-50)', fontFamily: 'Josefin Sans', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                    {Array.from({ length: room.capacity.adults }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {nights > 0 && (
                <div style={{ background: 'var(--sand-50)', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--sand-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: '#888' }}>${Math.round(effectivePrice)} × {nights} nights</span>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: 'var(--deep-espresso)' }}>${Math.round(effectivePrice * nights)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: '#888' }}>Service charge (5%)</span>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: 'var(--deep-espresso)' }}>${Math.round(effectivePrice * nights * 0.05)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: '#888' }}>Tax (12%)</span>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: 'var(--deep-espresso)' }}>${Math.round(effectivePrice * nights * 0.12)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--sand-200)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.8rem', fontWeight: 600, color: 'var(--deep-espresso)', letterSpacing: '0.1em' }}>TOTAL</span>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--bronze)' }}>${Math.round(effectivePrice * nights * 1.17)}</span>
                  </div>
                </div>
              )}

              <button onClick={handleBook} style={{
                width: '100%', padding: '1rem',
                background: 'linear-gradient(135deg, #b8894a, #7c5828)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: 'Josefin Sans', fontSize: '0.75rem', letterSpacing: '0.2em', fontWeight: 600,
                transition: 'opacity 0.3s',
              }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                {user ? 'RESERVE THIS ROOM' : 'SIGN IN TO BOOK'}
              </button>

              <p style={{ textAlign: 'center', fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#bbb', marginTop: '0.75rem', letterSpacing: '0.05em' }}>
                Free cancellation up to 48 hours before check-in
              </p>
            </div>
          </div>

          {/* Quick Info */}
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(42,26,10,0.04)', border: '1px solid rgba(184,137,74,0.12)' }}>
            <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--latte)', marginBottom: '1rem' }}>ROOM HIGHLIGHTS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                `👤 Sleeps up to ${room.capacity.adults} adults`,
                `${BED_ICONS[room.bedType] || '🛏️'} ${room.bedCount} ${room.bedType} bed${room.bedCount > 1 ? 's' : ''}`,
                `📐 ${room.size} m² of space`,
                `🏢 Located on floor ${room.floor}`,
              ].map(item => (
                <div key={item} style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: '#6b5a47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
