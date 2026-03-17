/**
 * ============================================================
 *  AmigoRoomsIntegration.jsx
 * ============================================================
 *
 *  This component adds an "Amigo · Live Hotel Search" panel
 *  ABOVE your existing rooms list WITHOUT touching your existing
 *  rooms page UI.
 *
 *  HOW TO ADD IT TO YOUR EXISTING ROOMS PAGE:
 *
 *  1. Import this component in your existing RoomsPage:
 *       import AmigoRoomsIntegration from './AmigoRoomsIntegration';
 *
 *  2. Render it anywhere on the page, e.g. just before your
 *     existing room cards grid:
 *       <AmigoRoomsIntegration />
 *       {/* your existing room cards here *\/}
 *
 *  That's it. The component is fully self-contained and uses
 *  the existing site's CSS variables / font.
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getLiveRooms, getSupportedCities, formatINR } from '../../services/hotelsApi';

// ── Room Card — matches your existing card design ────────────
function AmadeusRoomCard({ room, onBook }) {
  const discount = room.pricePerNight !== room.amadeusData?.originalPrice &&
                   room.amadeusData?.overrideApplied;

  return (
    <div className="amigo-room-card" style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform .2s, box-shadow .2s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform  = 'translateY(-4px)';
        e.currentTarget.style.boxShadow  = '0 8px 24px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img
          src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
          alt={room.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'; }}
        />
        {/* Type badge */}
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.65)', color: '#fff',
          padding: '3px 10px', borderRadius: 20,
          fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
        }}>
          {room.type}
        </span>
        {/* Discount badge */}
        {discount && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: '#dc2626', color: '#fff',
            padding: '3px 10px', borderRadius: 20,
            fontSize: '0.72rem', fontWeight: 700,
          }}>
            SPECIAL RATE
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          margin: '0 0 4px',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: '#1e293b',
          lineHeight: 1.35,
        }}>
          {room.name}
        </h3>

        {/* Star rating */}
        <div style={{ color: '#f59e0b', fontSize: '0.8rem', marginBottom: 6 }}>
          {'★'.repeat(room.amadeusData?.starRating || 3)}
          {'☆'.repeat(Math.max(0, 5 - (room.amadeusData?.starRating || 3)))}
          <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginLeft: 5 }}>
            {room.amadeusData?.starRating || 3}-star hotel
          </span>
        </div>

        {/* Description */}
        <p style={{
          color: '#64748b', fontSize: '0.78rem', margin: '0 0 8px',
          lineHeight: 1.5, flex: 1,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {room.description}
        </p>

        {/* Amenities */}
        <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(room.amenities || []).slice(0, 4).map(a => (
            <span key={a} style={{
              background: '#f1f5f9', color: '#475569',
              padding: '2px 8px', borderRadius: 20,
              fontSize: '0.68rem', fontWeight: 500,
            }}>
              ✓ {a.charAt(0).toUpperCase() + a.slice(1)}
            </span>
          ))}
          {(room.amenities || []).length > 4 && (
            <span style={{ color: '#94a3b8', fontSize: '0.68rem', alignSelf: 'center' }}>
              +{room.amenities.length - 4} more
            </span>
          )}
        </div>

        {/* Capacity row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, color: '#64748b', fontSize: '0.73rem' }}>
          <span>👥 {room.capacity.adults} adults</span>
          <span>🛏️ {room.bedCount} {room.bedType}</span>
          {room.size && <span>📐 {room.size} sqm</span>}
        </div>

        {/* Price + Book */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div>
            {discount && room.amadeusData?.originalPrice && (
              <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.75rem' }}>
                {formatINR(room.amadeusData.originalPrice)}/night
              </div>
            )}
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#b45309' }}>
              {formatINR(room.pricePerNight)}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}> / night</span>
          </div>
          <button
            onClick={() => onBook(room)}
            style={{
              background: 'linear-gradient(135deg,#b45309,#92400e)',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontWeight: 700, fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Booking Modal ────────────────────────────────────────────
function BookingModal({ room, checkIn, checkOut, nights, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const handleBook = async () => {
    if (!localStorage.getItem('token')) {
      alert('Please log in to make a booking.');
      onClose();
      return;
    }
    setBusy(true);
    try {
      const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      // Step 1: Create booking
      const bookRes = await fetch(`${BASE}/hotels/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          hotelId:          room.amadeusData.hotelId,
          hotelName:        room.amadeusData.hotelName,
          hotelCity:        room.amadeusData.hotelCity,
          hotelAddress:     room.amadeusData.hotelAddress,
          hotelStarRating:  room.amadeusData.starRating,
          hotelAmenities:   room.amenities,
          hotelLat:         room.amadeusData.lat,
          hotelLng:         room.amadeusData.lng,
          offerId:          room.amadeusData.offerId,
          roomTypeCode:     room.roomNumber.split('-')[1],
          roomDescription:  room.description,
          bedType:          room.amadeusData.bedType,
          beds:             room.amadeusData.beds,
          boardType:        room.amadeusData.boardType,
          checkIn,
          checkOut,
          guests:           { adults: 2, children: 0 },
          pricePerNight:    room.pricePerNight,
          originalAmadeusPrice: room.amadeusData.originalPrice,
          rateOverrideApplied:  room.amadeusData.overrideApplied,
        }),
      });

      const bookData = await bookRes.json();
      if (!bookRes.ok) throw new Error(bookData.message || 'Booking failed');

      // Step 2: Confirm demo payment
      const payRes = await fetch(`${BASE}/hotels/bookings/${bookData.data.booking._id}/confirm-demo`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payData = await payRes.json();

      setDone(payData.data?.booking || bookData.data.booking);
      if (onConfirm) onConfirm(payData.data?.booking);
    } catch (err) {
      alert('Booking error: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎉</div>
          <h2 style={{ margin: '0 0 8px', color: '#1e293b' }}>Booking Confirmed!</h2>
          <p style={{ color: '#64748b', margin: '0 0 6px' }}>
            Reference: <strong style={{ color: '#b45309' }}>{done.bookingReference}</strong>
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 22 }}>
            Your stay at <strong>{done.externalHotel?.name}</strong> is confirmed.
          </p>
          <button onClick={onClose} style={{ ...btnPrimary, width: '100%' }}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ margin: '0 0 4px', color: '#1e293b', fontSize: '1.1rem', fontWeight: 800 }}>
          Confirm Booking
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 14 }}>
          Demo payment — no real charge.
        </p>

        {/* Summary */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          {[
            ['Hotel',     room.amadeusData.hotelName],
            ['Room',      room.name.split('—')[1]?.trim() || room.type],
            ['Check-In',  checkIn],
            ['Check-Out', checkOut],
            ['Nights',    nights],
            ['Total',     formatINR(room.pricePerNight * nights * 1.17)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.83rem' }}>
              <span style={{ color: '#64748b' }}>{k}</span>
              <span style={{ fontWeight: 600, color: '#1e293b', maxWidth: '60%', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleBook} disabled={busy} style={{ ...btnPrimary, flex: 2 }}>
            {busy ? 'Processing…' : '✓ Confirm & Pay (Demo)'}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 20,
};
const modalStyle = {
  background: '#fff', borderRadius: 16, padding: 28,
  maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
};
const btnPrimary = {
  flex: 1, padding: '10px 0',
  background: 'linear-gradient(135deg,#b45309,#92400e)',
  color: '#fff', border: 'none', borderRadius: 10,
  fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
};
const btnSecondary = {
  flex: 1, padding: '10px 0',
  background: '#f1f5f9', border: '1px solid #e2e8f0',
  color: '#64748b', borderRadius: 10,
  fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
};

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT — Drop this anywhere on your Rooms page
// ══════════════════════════════════════════════════════════════
export default function AmigoRoomsIntegration({ onRoomsLoaded }) {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  const [cities,   setCities]   = useState([]);
  const [rooms,    setRooms]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [searched, setSearched] = useState(false);
  const [booking,  setBooking]  = useState(null);

  const [city,     setCity]     = useState('Chennai');
  const [checkIn,  setCheckIn]  = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [type,     setType]     = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Load city list
  useEffect(() => { getSupportedCities().then(setCities).catch(() => {}); }, []);

  const nights = Math.max(1, Math.round(
    (new Date(checkOut) - new Date(checkIn)) / 86_400_000
  ));

  const search = useCallback(async () => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const result = await getLiveRooms({ city, checkIn, checkOut, adults: 2, type, maxPrice });
      setRooms(result.rooms || []);
      if (onRoomsLoaded) onRoomsLoaded(result.rooms || []);
    } catch (err) {
      setError(err.message || 'Failed to load hotels. Please try again.');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [city, checkIn, checkOut, type, maxPrice, onRoomsLoaded]);

  const inputStyle = {
    padding: '9px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: '0.85rem',
    color: '#1e293b',
    background: '#fff',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ margin: '0 0 32px' }}>
      {/* ── Section header ───────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
      }}>
        <span style={{ fontSize: '1.4rem' }}>🏨</span>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
            Amigo · Live Hotel Search
          </h2>
          <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8' }}>
            Real-time prices across Tamil Nadu · Powered by Amadeus
          </p>
        </div>
      </div>

      {/* ── Search bar ───────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
      }}>
        <div>
          <label style={labelStyle}>City</label>
          <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
            {cities.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Check-In</label>
          <input type="date" value={checkIn} min={today}
            onChange={e => setCheckIn(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Check-Out</label>
          <input type="date" value={checkOut} min={checkIn}
            onChange={e => setCheckOut(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Room Type</label>
          <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
            <option value="">All Types</option>
            <option value="standard">Standard</option>
            <option value="deluxe">Deluxe</option>
            <option value="suite">Suite</option>
            <option value="penthouse">Penthouse</option>
            <option value="family">Family</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Max Price / Night</label>
          <input type="number" value={maxPrice} min="0" step="500"
            placeholder="No limit"
            onChange={e => setMaxPrice(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button onClick={search} disabled={loading} style={{
            width: '100%', padding: '10px 0',
            background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#b45309,#92400e)',
            color: loading ? '#94a3b8' : '#fff',
            border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: '0.88rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Searching…' : '🔍 Search Hotels'}
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────── */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontSize: '0.84rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Results ──────────────────────────────────── */}
      {searched && !loading && (
        <>
          <div style={{ marginBottom: 14, color: '#64748b', fontSize: '0.82rem' }}>
            {rooms.length > 0
              ? `${rooms.length} room${rooms.length > 1 ? 's' : ''} found in ${city} · ${checkIn} → ${checkOut} (${nights} night${nights > 1 ? 's' : ''})`
              : `No rooms found in ${city}. Try different dates or raise the price limit.`
            }
          </div>

          {rooms.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {rooms.map(room => (
                <AmadeusRoomCard
                  key={room._id}
                  room={room}
                  onBook={r => setBooking(r)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Booking Modal ─────────────────────────── */}
      {booking && (
        <BookingModal
          room={booking}
          checkIn={checkIn}
          checkOut={checkOut}
          nights={nights}
          onClose={() => setBooking(null)}
          onConfirm={() => setTimeout(() => setBooking(null), 3000)}
        />
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700,
  color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.7px',
};
