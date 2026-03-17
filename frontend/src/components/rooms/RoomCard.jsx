import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatINR } from '../../utils/currency';

export default function RoomCard({ room }) {
  const effectivePrice = room.discountPercent > 0
    ? room.pricePerNight * (1 - room.discountPercent / 100)
    : room.pricePerNight;

  const amenityIcons = {
    wifi:'📶', ac:'❄️', pool:'🏊', spa:'🌿', gym:'💪',
    parking:'🅿️', restaurant:'🍽️', bar:'🍸', tv:'📺',
    balcony:'🌅', kitchen:'🍳', laundry:'👕',
  };

  const cardRef    = useRef(null);
  const overlayRef = useRef(null);
  const [clicked, setClicked] = useState(false);

  // 3D tilt + image zoom + depth shadow
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 16;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -16;
      el.style.transform  = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) translateY(-8px) scale3d(1.03,1.03,1.03)`;
      el.style.boxShadow  = `${-x*2}px ${y*2+28}px 50px rgba(0,0,0,0.18), 0 0 0 1px rgba(251,191,36,0.12)`;
      // update overlay center
      if (overlayRef.current) {
        const cx = ((e.clientX - rect.left) / rect.width)  * 100;
        const cy = ((e.clientY - rect.top)  / rect.height) * 100;
        overlayRef.current.style.setProperty('--cx', cx + '%');
        overlayRef.current.style.setProperty('--cy', cy + '%');
      }
    };
    const handleLeave = () => {
      el.style.transform = '';
      el.style.boxShadow = '';
    };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  // Click ripple overlay
  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 400);
  };

  return (
    <div
      ref={cardRef}
      className="card-3d bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 group relative"
      style={{ transition:'transform 0.22s ease,box-shadow 0.22s ease' }}
      onClick={handleClick}
    >
      {/* Click overlay */}
      <div
        ref={overlayRef}
        className={`card-click-overlay transition-opacity duration-400 ${clicked ? 'opacity-100' : 'opacity-0'}`}
        style={{
          position:'absolute', inset:0, zIndex:10, pointerEvents:'none', borderRadius:'inherit',
          background:'radial-gradient(circle at var(--cx,50%) var(--cy,50%), rgba(245,158,11,0.28) 0%, transparent 60%)',
        }}
      />

      <style>{`
        .room-img-zoom { transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .room-card-3d:hover .room-img-zoom { transform: scale(1.1); }
        .room-tag { transition: all 0.3s ease; }
        .room-card-3d:hover .room-tag { transform: scale(1.06); }
        .room-btn {
          position: relative; overflow: hidden;
          transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .room-btn::before {
          content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.45s ease;
        }
        .room-btn:hover::before { left:100%; }
        .room-btn:hover { background:#F59E0B; color:#111827; transform:scale(1.04) translateY(-1px); box-shadow:0 8px 20px rgba(245,158,11,0.35); }
        .star-animated { display:inline-block; transition:transform 0.2s ease; }
        .star-animated:hover { transform:scale(1.5) rotate(20deg); }
        .amenity-tag { transition:all 0.2s ease; }
        .amenity-tag:hover { background:#FEF3C7; transform:scale(1.1); }
        .price-pulse { animation: pricePulse 3s ease-in-out infinite; }
        @keyframes pricePulse { 0%,100%{color:#D97706} 50%{color:#F59E0B} }
        .discount-badge { animation: badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes badgePop { from{transform:scale(0) rotate(-20deg)} to{transform:scale(1) rotate(0)} }
        .img-shine::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.6s ease;
        }
        .group:hover .img-shine::after { left:150%; }
      `}</style>

      <div className="room-card-3d relative overflow-hidden">
        {/* Image with shine sweep + pop-out depth */}
        <div className="img-shine img-popout-wrap relative overflow-hidden">
          <img
            src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'}
            alt={room.name}
            className="room-img-zoom img-popout w-full h-52 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"/>
        </div>

        {room.discountPercent > 0 && (
          <div className="discount-badge absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
            -{room.discountPercent}% OFF
          </div>
        )}
        <div className="room-tag absolute top-3 right-3 bg-gray-900/70 backdrop-blur text-white text-xs font-semibold px-2 py-1 rounded-full capitalize z-10">
          {room.type}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-gray-800 text-lg leading-tight">{room.name}</h3>
            <div className="text-right ml-2 flex-shrink-0">
              {room.discountPercent > 0 && (
                <p className="text-xs text-gray-400 line-through">{formatINR(room.pricePerNight)}</p>
              )}
              <p className="price-pulse font-bold text-lg">{formatINR(effectivePrice)}</p>
              <p className="text-gray-400 text-xs">per night</p>
            </div>
          </div>

          {room.rating?.count > 0 && (
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`star-animated ${i < Math.round(room.rating.average) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
              ))}
              <span className="text-gray-400 text-xs ml-1">({room.rating.count} reviews)</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-4">
            {room.amenities?.slice(0,4).map((a) => (
              <span key={a} className="amenity-tag bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full capitalize cursor-default">
                {amenityIcons[a] || '✓'} {a}
              </span>
            ))}
            {room.amenities?.length > 4 && (
              <span className="text-gray-400 text-xs px-2 py-1">+{room.amenities.length - 4} more</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
            <span>👥 {room.capacity?.adults} adults</span>
            <span>🛏 {room.bedCount} {room.bedType}</span>
            <span>📐 {room.size} sqm</span>
          </div>

          <Link
            to={`/rooms/${room._id}`}
            className="room-btn block w-full text-center bg-gray-900 text-white font-bold py-2.5 rounded-xl"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
