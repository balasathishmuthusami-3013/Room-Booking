/**
 * pages/Customer/HotelRoomsPage.jsx
 *
 * Shows room offers for a selected Amadeus hotel.
 * Calls GET /api/hotels/:hotelId/rooms
 *
 * Add to React Router (App.js):
 *   import HotelRoomsPage from './pages/Customer/HotelRoomsPage';
 *   <Route path="/hotels/:hotelId/rooms" element={<HotelRoomsPage />} />
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getRooms, bookHotel, confirmDemoPayment,
  formatINR, getRoomTypeLabel, getStarDisplay,
} from '../../services/hotelsApi';

// ─── Room card ────────────────────────────────────────
function RoomCard({ room, nights, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const pn = room.price.perNight;

  return (
    <div style={{
      background:   'linear-gradient(145deg,#1e293b,#0f172a)',
      border:       '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px', marginBottom: '14px', overflow: 'hidden',
      display:      'grid', gridTemplateColumns: '150px 1fr auto',
    }}>
      {/* Icon col */}
      <div style={{
        background:     'linear-gradient(135deg,#334155,#1e293b)',
        display:        'flex', flexDirection: 'column',
        alignItems:     'center', justifyContent: 'center',
        padding:        '18px 8px', minHeight: '140px', gap: '6px',
      }}>
        <span style={{ fontSize: '2.4rem' }}>🛏️</span>
        <span style={{ color: '#64748b', fontSize: '0.65rem', textAlign: 'center', fontWeight: '600' }}>
          {room.room.beds} {room.room.bedType?.replace(/_/g,' ')} BED
        </span>
      </div>

      {/* Info col */}
      <div style={{ padding: '16px 18px' }}>
        <h3 style={{ margin: '0 0 7px', color: '#f1f5f9', fontWeight: '700', fontSize: '0.96rem' }}>
          {getRoomTypeLabel(room.room.typeCode)}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '9px' }}>
          {[`🛏️ ${room.room.bedType?.replace(/_/g,' ')}`, room.boardType?.replace(/_/g,' ')].map((t,i) => (
            <span key={i} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', padding: '2px 9px', fontSize: '0.7rem', color: '#94a3b8',
            }}>{t}</span>
          ))}
        </div>

        {room.room.description && (
          <>
            <p style={{
              color: '#64748b', fontSize: '0.8rem', margin: '0 0 5px', lineHeight: '1.55',
              overflow: expanded ? 'visible' : 'hidden',
              display: expanded ? 'block' : '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {room.room.description}
            </p>
            {room.room.description.length > 100 && (
              <button onClick={() => setExpanded(!expanded)} style={{
                background: 'none', border: 'none', color: '#3b82f6',
                cursor: 'pointer', fontSize: '0.73rem', padding: 0,
              }}>
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </>
        )}

        <div style={{ marginTop: 9, fontSize: '0.72rem', color: '#22c55e' }}>
          ✓ {room.policies.cancellation.length > 70
            ? room.policies.cancellation.substring(0,70)+'…'
            : room.policies.cancellation}
        </div>
      </div>

      {/* Price col */}
      <div style={{
        padding:        '16px 16px 16px 8px',
        display:        'flex', flexDirection: 'column',
        alignItems:     'flex-end', justifyContent: 'center',
        minWidth:       '148px', borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}>
        {room.price.overrideApplied && (
          <div style={{
            background: 'rgba(220,38,38,0.18)', color: '#f87171',
            border: '1px solid rgba(220,38,38,0.3)', borderRadius: '6px',
            padding: '2px 7px', fontSize: '0.64rem', fontWeight: '800', marginBottom: '5px',
          }}>SPECIAL RATE</div>
        )}
        {room.price.originalPerNight && (
          <div style={{ textDecoration: 'line-through', color: '#475569', fontSize: '0.73rem' }}>
            {formatINR(room.price.originalPerNight)}/night
          </div>
        )}
        <div style={{ fontWeight: '800', fontSize: '1.12rem', color: '#f1f5f9' }}>
          {formatINR(pn)}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '3px' }}>/night</div>
        <div style={{ color: '#475569', fontSize: '0.67rem', marginBottom: '12px', textAlign: 'right' }}>
          {formatINR(room.price.totalAmount)}<br />
          ({nights} night{nights>1?'s':''} + taxes)
        </div>
        <button onClick={() => onBook(room)} style={{
          background:   'linear-gradient(135deg,#3b82f6,#2563eb)',
          color:        '#fff', border: 'none', borderRadius: '10px',
          padding:      '9px 14px', fontWeight: '700', fontSize: '0.8rem',
          cursor:       'pointer', whiteSpace: 'nowrap',
        }}>
          Book Now
        </button>
      </div>
    </div>
  );
}

// ─── Demo payment modal ───────────────────────────────
function DemoModal({ booking, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); try { await onConfirm(booking._id); } finally { setBusy(false); } };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '34px', maxWidth: '430px', width: '100%',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>💳</div>
          <h2 style={{ margin: '0 0 6px', color: '#f1f5f9', fontWeight: '800' }}>Demo Payment</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>
            No real payment — booking is saved to your admin dashboard.
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px', padding: '16px', marginBottom: '16px',
        }}>
          {[
            ['Hotel',     booking.externalHotel?.name || '—'],
            ['Room',      booking.externalHotel?.roomTypeCode || 'Standard'],
            ['Check-In',  new Date(booking.checkIn).toDateString()],
            ['Check-Out', new Date(booking.checkOut).toDateString()],
            ['Nights',    booking.numberOfNights],
          ].map(([k, v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:'7px', fontSize:'0.83rem' }}>
              <span style={{ color: '#64748b' }}>{k}</span>
              <span style={{ color: '#f1f5f9', fontWeight: '600', maxWidth: '55%', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'9px', marginTop:'4px' }}>
            <span style={{ color:'#f1f5f9', fontWeight:'700' }}>Total</span>
            <span style={{ color:'#3b82f6', fontWeight:'800', fontSize:'1.05rem' }}>
              {formatINR(booking.pricing.totalAmount)}
            </span>
          </div>
        </div>

        <div style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '10px', padding: '9px 14px', marginBottom: '16px',
          fontSize: '0.76rem', color: '#fbbf24',
        }}>
          ℹ️ <strong>Demo Mode:</strong> Click Confirm to record this booking without charging payment.
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex:1, padding:'10px', background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px',
            color:'#94a3b8', fontWeight:'600', cursor:'pointer',
          }}>Cancel</button>
          <button onClick={go} disabled={busy} style={{
            flex:2, padding:'10px',
            background: busy ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#22c55e,#16a34a)',
            border:'none', borderRadius:'10px', color:'#fff',
            fontWeight:'700', cursor: busy ? 'not-allowed' : 'pointer',
          }}>
            {busy ? 'Processing…' : '✓ Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────
export default function HotelRoomsPage() {
  const { hotelId }   = useParams();
  const [sp]          = useSearchParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  const checkIn  = sp.get('checkIn');
  const checkOut = sp.get('checkOut');
  const adults   = parseInt(sp.get('adults') || '2');

  const [hotel,          setHotel]          = useState(location.state?.hotel || null);
  const [rooms,          setRooms]          = useState([]);
  const [nights,         setNights]         = useState(1);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [selectedRoom,   setSelectedRoom]   = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [success,        setSuccess]        = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Calls GET /api/hotels/:hotelId/rooms
        const d = await getRooms(hotelId, { checkIn, checkOut, adults });
        if (!hotel) setHotel(d.hotel);
        setRooms(d.rooms || []);   // ← 'rooms' key from our updated controller
        setNights(d.nights || 1);
      } catch (e) {
        setError(e.message || 'Failed to load rooms.');
      } finally {
        setLoading(false);
      }
    })();
  }, [hotelId, checkIn, checkOut, adults, hotel]);

  const handleBookClick = room => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setSelectedRoom(room);
  };

  const handleProceed = async () => {
    if (!selectedRoom) return;
    try {
      const payload = {
        hotelId,
        hotelName:           hotel?.name,
        hotelCity:           hotel?.city || hotel?.cityCode,
        hotelAddress:        hotel?.address,
        hotelStarRating:     hotel?.starRating,
        hotelAmenities:      hotel?.amenities,
        hotelLat:            hotel?.lat,
        hotelLng:            hotel?.lng,
        offerId:             selectedRoom.offerId,
        roomTypeCode:        selectedRoom.room.typeCode,
        roomDescription:     selectedRoom.room.description,
        bedType:             selectedRoom.room.bedType,
        beds:                selectedRoom.room.beds,
        boardType:           selectedRoom.boardType,
        checkIn,
        checkOut,
        guests:              { adults, children: 0 },
        pricePerNight:       selectedRoom.price.perNight,
        originalAmadeusPrice: selectedRoom.price.originalPerNight,
        rateOverrideApplied: selectedRoom.price.overrideApplied,
      };
      const booking = await bookHotel(payload);
      setSelectedRoom(null);
      setPendingBooking(booking);
    } catch (e) {
      setError(e.message || 'Booking failed. Please try again.');
    }
  };

  const handlePayment = async id => {
    const confirmed = await confirmDemoPayment(id);
    setPendingBooking(null);
    setSuccess(confirmed);
  };

  // ── Success screen ─────────────────────────────────
  if (success) return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1e', color: '#f1f5f9',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background:'linear-gradient(145deg,#1e293b,#0f172a)',
        border:'1px solid rgba(255,255,255,0.08)', borderRadius:'24px',
        padding:'46px 38px', textAlign:'center', maxWidth:'460px', width:'100%',
      }}>
        <div style={{ fontSize: '3.8rem', marginBottom: 14 }}>🎉</div>
        <h2 style={{ margin:'0 0 9px', color:'#f1f5f9', fontWeight:'800', fontSize:'1.45rem' }}>
          Booking Confirmed!
        </h2>
        <p style={{ color:'#64748b', marginBottom:5, fontSize:'0.88rem' }}>
          Reference: <strong style={{ color:'#3b82f6' }}>{success.bookingReference}</strong>
        </p>
        <p style={{ color:'#64748b', fontSize:'0.83rem', marginBottom:26 }}>
          Your stay at <strong style={{ color:'#f1f5f9' }}>{success.externalHotel?.name}</strong> is confirmed.
          Check your admin dashboard for details.
        </p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/my-bookings')} style={{
            padding:'10px 20px',
            background:'linear-gradient(135deg,#3b82f6,#2563eb)',
            color:'#fff', border:'none', borderRadius:'10px', fontWeight:'700', cursor:'pointer',
          }}>My Bookings</button>
          <button onClick={() => navigate('/hotels')} style={{
            padding:'10px 20px',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            color:'#94a3b8', borderRadius:'10px', fontWeight:'600', cursor:'pointer',
          }}>Search More</button>
        </div>
      </div>
    </div>
  );

  // ── Room list ──────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#0a0f1e', color:'#f1f5f9', fontFamily:'inherit' }}>

      {/* Hotel header */}
      <div style={{
        background:'linear-gradient(160deg,#0f172a,#1e293b)',
        borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'26px 20px',
      }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <button onClick={() => navigate(-1)} style={{
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            color:'#94a3b8', borderRadius:'8px', padding:'6px 13px',
            cursor:'pointer', fontSize:'0.8rem', marginBottom:'13px',
          }}>← Back</button>

          {hotel && (
            <>
              <h1 style={{ margin:'0 0 5px', fontSize:'clamp(1.1rem,2.5vw,1.65rem)', fontWeight:'800', color:'#f8fafc' }}>
                {hotel.name}
              </h1>
              <div style={{ color:'#64748b', fontSize:'0.83rem', marginBottom:'12px' }}>
                <span style={{ color:'#f59e0b' }}>{getStarDisplay(hotel.starRating)}</span>
                {hotel.cityCode && ` · ${hotel.cityCode}`}
                {hotel.address?.lines?.[0] && ` · ${hotel.address.lines[0]}`}
              </div>
              <div style={{
                display:'inline-flex', flexWrap:'wrap', gap:'14px',
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:'12px', padding:'9px 16px', fontSize:'0.8rem', color:'#94a3b8',
              }}>
                <span>📅 {new Date(checkIn).toDateString()}</span>
                <span>→ {new Date(checkOut).toDateString()}</span>
                <span>· {nights} night{nights>1?'s':''}</span>
                <span>· {adults} adult{adults>1?'s':''}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rooms */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'26px 20px' }}>
        {error && (
          <div style={{
            background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.3)',
            color:'#fca5a5', borderRadius:'12px', padding:'13px 18px', marginBottom:'18px',
          }}>⚠️ {error}</div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#475569' }}>
            <div style={{ fontSize:'2.4rem', marginBottom:10 }}>🛏️</div>
            <p>Loading available rooms…</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:18 }}>
              <h2 style={{ margin:'0 0 3px', color:'#f1f5f9', fontWeight:'700', fontSize:'1rem' }}>
                Available Rooms ({rooms.length})
              </h2>
              <p style={{ margin:0, color:'#475569', fontSize:'0.76rem' }}>
                Prices in INR · Includes 12% tax + 5% service charge
              </p>
            </div>

            {rooms.length > 0
              ? rooms.map(r => (
                  <RoomCard key={r.offerId} room={r} nights={nights} onBook={handleBookClick} />
                ))
              : (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#475569' }}>
                  <div style={{ fontSize:'2.4rem', marginBottom:10 }}>😔</div>
                  <p>No rooms available for these dates. Try different dates.</p>
                </div>
              )
            }
          </>
        )}
      </div>

      {/* Confirm room modal */}
      {selectedRoom && !pendingBooking && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px',
        }}>
          <div style={{
            background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'20px', padding:'34px', maxWidth:'390px', width:'100%',
          }}>
            <h2 style={{ margin:'0 0 14px', color:'#f1f5f9', fontWeight:'800' }}>Confirm Room</h2>
            <p style={{ color:'#64748b', marginBottom:'7px', fontSize:'0.88rem' }}>
              <strong style={{ color:'#f1f5f9' }}>{getRoomTypeLabel(selectedRoom.room.typeCode)}</strong>
              {' at '}
              <strong style={{ color:'#f1f5f9' }}>{hotel?.name}</strong>
            </p>
            <p style={{ color:'#3b82f6', fontWeight:'800', fontSize:'1.08rem', marginBottom:'22px' }}>
              {formatINR(selectedRoom.price.totalAmount)}
              <span style={{ color:'#64748b', fontWeight:'400', fontSize:'0.76rem' }}> (incl. taxes)</span>
            </p>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setSelectedRoom(null)} style={{
                flex:1, padding:'10px', background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px',
                color:'#94a3b8', fontWeight:'600', cursor:'pointer',
              }}>Back</button>
              <button onClick={handleProceed} style={{
                flex:2, padding:'10px',
                background:'linear-gradient(135deg,#3b82f6,#2563eb)',
                border:'none', borderRadius:'10px', color:'#fff',
                fontWeight:'700', cursor:'pointer',
              }}>Proceed to Payment</button>
            </div>
          </div>
        </div>
      )}

      {pendingBooking && (
        <DemoModal
          booking={pendingBooking}
          onClose={() => setPendingBooking(null)}
          onConfirm={handlePayment}
        />
      )}
    </div>
  );
}
