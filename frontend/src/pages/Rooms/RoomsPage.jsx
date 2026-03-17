import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import Navbar from '../../components/Navbar';

const ALL_ROOMS = [
  { _id: '1', name: 'Royal Penthouse Suite', type: 'penthouse', pricePerNight: 1200, discountPercent: 0, rating: { average: 4.9, count: 128 }, capacity: { adults: 4 }, size: 185, floor: 42, bedType: 'king', bedCount: 2, description: 'An architectural marvel perched on the highest floor with panoramic views.', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&q=80', isAvailable: true },
  { _id: '2', name: 'Garden Deluxe Room', type: 'deluxe', pricePerNight: 480, discountPercent: 10, rating: { average: 4.7, count: 89 }, capacity: { adults: 2 }, size: 68, floor: 2, bedType: 'queen', bedCount: 1, description: 'Serene garden-facing sanctuary with private terrace.', img: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=700&q=80', isAvailable: true },
  { _id: '3', name: 'Grand Honeymoon Suite', type: 'suite', pricePerNight: 850, discountPercent: 0, rating: { average: 4.8, count: 64 }, capacity: { adults: 2 }, size: 120, floor: 18, bedType: 'king', bedCount: 1, description: 'Romance redefined — a haven for couples.', img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=700&q=80', isAvailable: true },
  { _id: '4', name: 'Family Suite', type: 'family', pricePerNight: 680, discountPercent: 5, rating: { average: 4.6, count: 102 }, capacity: { adults: 4 }, size: 145, floor: 5, bedType: 'twin', bedCount: 2, description: 'Spacious interconnected rooms designed for family comfort.', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&q=80', isAvailable: true },
  { _id: '5', name: 'Classic Standard Room', type: 'standard', pricePerNight: 280, discountPercent: 0, rating: { average: 4.4, count: 215 }, capacity: { adults: 2 }, size: 38, floor: 3, bedType: 'double', bedCount: 1, description: 'Timeless elegance in a thoughtfully appointed room.', img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=700&q=80', isAvailable: true },
  { _id: '6', name: 'Executive Deluxe Suite', type: 'suite', pricePerNight: 950, discountPercent: 15, rating: { average: 4.7, count: 45 }, capacity: { adults: 3 }, size: 95, floor: 22, bedType: 'king', bedCount: 1, description: 'The preferred choice of discerning business travelers.', img: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=700&q=80', isAvailable: true },
];

const TYPE_LABELS = { penthouse: 'Penthouse', suite: 'Suite', deluxe: 'Deluxe', standard: 'Standard', family: 'Family' };

export default function RoomsPage() {
  useScrollReveal();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [rooms, setRooms] = useState(ALL_ROOMS);

  useEffect(() => {
    let filtered = ALL_ROOMS.filter(r => filter === 'all' || r.type === filter);
    if (sortBy === 'price_asc') filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
    else if (sortBy === 'price_desc') filtered.sort((a, b) => b.pricePerNight - a.pricePerNight);
    else filtered.sort((a, b) => b.rating.average - a.rating.average);
    setRooms(filtered);
  }, [filter, sortBy]);

  return (
    <div style={{ background: 'var(--ivory)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ height: '45vh', position: 'relative', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1920&q=80" alt="Rooms" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(42,26,10,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>OUR COLLECTION</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 300, color: '#fff', textAlign: 'center' }}>Rooms & Suites</h1>
          <div style={{ width: '60px', height: '1px', background: '#d4a853', margin: '1.5rem auto 0' }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--sand-100)', padding: '1.5rem 2rem', position: 'sticky', top: '0', zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
            {[['all', 'All Rooms'], ['standard', 'Standard'], ['deluxe', 'Deluxe'], ['suite', 'Suite'], ['penthouse', 'Penthouse'], ['family', 'Family']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{
                padding: '0.5rem 1.2rem', cursor: 'pointer',
                fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em',
                background: filter === val ? 'var(--deep-espresso)' : 'transparent',
                color: filter === val ? 'var(--latte)' : 'var(--deep-espresso)',
                border: filter === val ? '1px solid var(--deep-espresso)' : '1px solid var(--sand-200)',
                transition: 'all 0.3s',
              }}>{label}</button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: '0.5rem 1rem', border: '1px solid var(--sand-200)', background: 'var(--sand-50)',
            fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.1em', outline: 'none', cursor: 'pointer',
          }}>
            <option value="rating">Sort: Best Rated</option>
            <option value="price_asc">Sort: Price ↑</option>
            <option value="price_desc">Sort: Price ↓</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
          {rooms.map((room) => {
            const effectivePrice = room.discountPercent > 0 ? room.pricePerNight * (1 - room.discountPercent / 100) : room.pricePerNight;
            return (
              <div key={room._id} style={{
                background: '#fff', overflow: 'hidden',
                boxShadow: '0 4px 30px rgba(42,26,10,0.07)',
                transition: 'transform 0.4s ease, box-shadow 0.4s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 25px 60px rgba(42,26,10,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 30px rgba(42,26,10,0.07)'; }}
              >
                <div style={{ height: '230px', overflow: 'hidden', position: 'relative' }}>
                  <img src={room.img} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  />
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(42,26,10,0.85)', padding: '0.25rem 0.75rem' }}>
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--latte)' }}>{TYPE_LABELS[room.type]?.toUpperCase()}</span>
                  </div>
                  {room.discountPercent > 0 && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#d4a853', padding: '0.25rem 0.75rem' }}>
                      <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', color: '#fff', fontWeight: 600 }}>-{room.discountPercent}%</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '1.75rem' }}>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: 'var(--deep-espresso)', marginBottom: '0.5rem' }}>{room.name}</h3>
                  <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem' }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(room.rating.average) ? '#c9a96e' : '#e5d9c5', fontSize: '12px' }}>★</span>)}
                    <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#bbb', marginLeft: '4px' }}>{room.rating.average} ({room.rating.count})</span>
                  </div>
                  <p style={{ fontFamily: 'Josefin Sans', fontSize: '0.73rem', color: '#999', lineHeight: 1.6, marginBottom: '1rem' }}>{room.description}</p>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {[`👤 ${room.capacity.adults}`, `📐 ${room.size}m²`, `🏢 Floor ${room.floor}`].map(s => (
                      <span key={s} style={{ fontFamily: 'Josefin Sans', fontSize: '0.65rem', color: '#aaa' }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--sand-100)', paddingTop: '1rem' }}>
                    <div>
                      {room.discountPercent > 0 && <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.75rem', color: '#ccc', textDecoration: 'line-through', display: 'block' }}>${room.pricePerNight}</span>}
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.7rem', color: 'var(--bronze)' }}>${Math.round(effectivePrice)}</span>
                      <span style={{ fontFamily: 'Josefin Sans', fontSize: '0.6rem', color: '#bbb' }}>/night</span>
                    </div>
                    <Link to={`/rooms/${room._id}`} style={{
                      background: 'var(--deep-espresso)', color: 'var(--latte)',
                      textDecoration: 'none', padding: '0.6rem 1.3rem',
                      fontFamily: 'Josefin Sans', fontSize: '0.65rem', letterSpacing: '0.15em',
                      transition: 'background 0.3s',
                    }}
                      onMouseEnter={e => e.target.style.background = 'var(--bronze)'}
                      onMouseLeave={e => e.target.style.background = 'var(--deep-espresso)'}
                    >VIEW DETAILS</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
