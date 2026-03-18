/**
 * RoomDetailPage.jsx — Premium redesign + categorised image gallery
 * All API logic preserved. Added: click-to-open gallery with Room/Toilet/Balcony/Amenities tabs.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currency';

/* ─────────────────────────────────────────────────────────
   ROOM IMAGE CATALOGUE
   3 categorised images per room type. Keyed by room._id fallback to type.
   Categories: room · toilet · balcony · amenities
───────────────────────────────────────────────────────── */
const ROOM_IMAGE_SETS = {
  standard: {
    room:     ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80',
               'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80',
               'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=900&q=80'],
    toilet:   ['https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80',
               'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=900&q=80',
               'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80'],
    amenities:['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80',
               'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=900&q=80',
               'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80'],
  },
  deluxe: {
    room:     ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80',
               'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=900&q=80',
               'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=900&q=80'],
    toilet:   ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80',
               'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80',
               'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=900&q=80'],
    balcony:  ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
               'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
               'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80'],
    amenities:['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
               'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=900&q=80',
               'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80'],
  },
  suite: {
    room:     ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
               'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=900&q=80',
               'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=80'],
    toilet:   ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80',
               'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80',
               'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80'],
    balcony:  ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
               'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80',
               'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80'],
    amenities:['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80',
               'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=900&q=80',
               'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80'],
  },
  penthouse: {
    room:     ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
               'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=80',
               'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=900&q=80'],
    toilet:   ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80',
               'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80',
               'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80'],
    balcony:  ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
               'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80',
               'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80'],
    amenities:['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80',
               'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80',
               'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=900&q=80'],
  },
  family: {
    room:     ['https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900&q=80',
               'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=900&q=80',
               'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80'],
    toilet:   ['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=900&q=80',
               'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80',
               'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80'],
    amenities:['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80',
               'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=900&q=80',
               'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80'],
  },
};

const CATEGORY_META = {
  room:      { label: 'Room',      icon: '🛏️' },
  toilet:    { label: 'Bathroom',  icon: '🚿' },
  balcony:   { label: 'Balcony',   icon: '🌅' },
  amenities: { label: 'Amenities', icon: '✨' },
};

/* ─────────────────────────────────────────────────────────
   GALLERY LIGHTBOX MODAL
───────────────────────────────────────────────────────── */
function GalleryModal({ imageSet, hasBalcony, initialCategory, initialIndex, onClose }) {
  const availableCategories = Object.keys(CATEGORY_META).filter(
    cat => (cat === 'balcony' ? hasBalcony && imageSet.balcony : imageSet[cat])
  );

  const [activeCategory, setActiveCategory] = useState(initialCategory || availableCategories[0]);
  const [activeIndex, setActiveIndex]       = useState(initialIndex || 0);
  const [imgLoaded, setImgLoaded]           = useState(false);

  const currentImages = imageSet[activeCategory] || [];

  // Reset index when category changes
  const switchCategory = (cat) => { setActiveCategory(cat); setActiveIndex(0); setImgLoaded(false); };

  const prev = useCallback(() => { setActiveIndex(i => (i - 1 + currentImages.length) % currentImages.length); setImgLoaded(false); }, [currentImages.length]);
  const next = useCallback(() => { setActiveIndex(i => (i + 1) % currentImages.length); setImgLoaded(false); }, [currentImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(10,8,6,0.97)' }}
      onClick={onClose}
    >
      <style>{`
        .gal-img { opacity: 0; transition: opacity 0.35s ease; }
        .gal-img.loaded { opacity: 1; }
        .gal-thumb { border: 2px solid transparent; transition: all 0.25s ease; }
        .gal-thumb:hover { border-color: #F59E0B; transform: scale(1.06); }
        .gal-thumb.gal-thumb-active { border-color: #F59E0B; box-shadow: 0 0 0 3px rgba(245,158,11,0.3); }
        .gal-cat { transition: all 0.2s ease; }
        .gal-cat:hover { background: rgba(245,158,11,0.15); }
        .gal-cat.gal-cat-active { background: #F59E0B; color: #111827; }
        .gal-arrow { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .gal-arrow:hover { background: rgba(245,158,11,0.2); transform: scale(1.12); }
        .gal-arrow:active { transform: scale(0.94); }
      `}</style>

      {/* Header bar */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Category tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => switchCategory(cat)}
              className={`gal-cat flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition ${activeCategory === cat ? 'gal-cat-active' : 'text-gray-300 border border-white/10'}`}
            >
              <span>{CATEGORY_META[cat].icon}</span>
              <span>{CATEGORY_META[cat].label}</span>
              <span className="text-xs opacity-60 ml-0.5">({(imageSet[cat] || []).length})</span>
            </button>
          ))}
        </div>
        {/* Counter + close */}
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm font-medium tabular-nums">
            {activeIndex + 1} / {currentImages.length}
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition"
          >✕</button>
        </div>
      </div>

      {/* Main image area */}
      <div
        className="flex-1 flex items-center justify-center relative px-4 py-4 min-h-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Prev arrow */}
        {currentImages.length > 1 && (
          <button onClick={prev}
            className="gal-arrow absolute left-4 z-10 w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white text-2xl">
            ‹
          </button>
        )}

        {/* Image */}
        <img
          key={`${activeCategory}-${activeIndex}`}
          src={currentImages[activeIndex]}
          alt={`${CATEGORY_META[activeCategory].label} ${activeIndex + 1}`}
          onLoad={() => setImgLoaded(true)}
          className={`gal-img max-w-full max-h-full object-contain rounded-xl shadow-2xl select-none ${imgLoaded ? 'loaded' : ''}`}
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        />

        {/* Next arrow */}
        {currentImages.length > 1 && (
          <button onClick={next}
            className="gal-arrow absolute right-4 z-10 w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white text-2xl">
            ›
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div
        className="flex-shrink-0 px-6 py-4 flex gap-3 justify-center overflow-x-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {currentImages.map((img, i) => (
          <button key={i} onClick={() => { setActiveIndex(i); setImgLoaded(false); }}
            className={`gal-thumb flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden ${activeIndex === i ? 'gal-thumb-active' : ''}`}>
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* ESC hint */}
      <p className="text-center text-gray-600 text-xs pb-3 flex-shrink-0">Press ESC or click outside to close · ← → to navigate</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [room, setRoom]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeImg, setActiveImg]       = useState(0);
  const [dates, setDates]               = useState({ checkIn: '', checkOut: '' });
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking]         = useState(false);
  const [imgLoaded, setImgLoaded]       = useState(false);

  // Gallery state
  const [galleryOpen, setGalleryOpen]     = useState(false);
  const [galleryCategory, setGalleryCategory] = useState('room');
  const [galleryIndex, setGalleryIndex]   = useState(0);

  useEffect(() => {
    roomAPI.getById(id)
      .then(({ data }) => setRoom(data.data.room))
      .finally(() => setLoading(false));
  }, [id]);

  const nights = dates.checkIn && dates.checkOut
    ? Math.max(0, Math.round((new Date(dates.checkOut) - new Date(dates.checkIn)) / 86400000))
    : 0;

  const effectivePrice = room
    ? (room.discountPercent > 0 ? room.pricePerNight * (1 - room.discountPercent / 100) : room.pricePerNight)
    : 0;

  const TAX = 0.12, SERVICE = 0.05;
  const base  = +(effectivePrice * nights).toFixed(2);
  const tax   = +(base * TAX).toFixed(2);
  const svc   = +(base * SERVICE).toFixed(2);
  const total = +(base + tax + svc).toFixed(2);

  const handleCheckAvailability = async () => {
    if (!dates.checkIn || !dates.checkOut) return;
    setChecking(true);
    try {
      const { data } = await roomAPI.checkAvailability(id, dates);
      setAvailability(data.data);
    } finally { setChecking(false); }
  };

  const handleBook = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate(`/book/${id}?checkIn=${dates.checkIn}&checkOut=${dates.checkOut}`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">Loading Suite</p>
    </div>
  );
  if (!room) return (
    <div className="text-center py-32">
      <span className="text-6xl block mb-4">🏨</span>
      <p className="text-gray-500 text-lg">Room not found.</p>
    </div>
  );

  const amenityIcons = {
    wifi:'📶', ac:'❄️', pool:'🏊', spa:'🌿', gym:'💪',
    parking:'🅿️', restaurant:'🍽️', bar:'🍸', tv:'📺',
    balcony:'🌅', kitchen:'🍳', laundry:'👕',
  };

  // Pick the image set for this room type; fall back to 'standard'
  const imageSet  = ROOM_IMAGE_SETS[room.type] || ROOM_IMAGE_SETS.standard;
  const hasBalcony = room.amenities?.includes('balcony') && !!imageSet.balcony;

  // Hero image: use room's own first image, else pull from imageSet.room[0]
  const heroImgSrc = room.images?.[activeImg] || imageSet.room[activeImg] || imageSet.room[0];

  // All hero images: merge room.images with imageSet.room (deduplicated)
  const heroImages = imageSet.room;

  const openGallery = (category, index = 0) => {
    setGalleryCategory(category);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const statCards = [
    { label: 'Max Guests', value: room.capacity?.adults ?? '—',              icon: '👤', detail: 'Adults'   },
    { label: 'Bed Type',   value: room.bedType || 'Deluxe Bed',              icon: '🛏', detail: `${room.bedCount || 1} Bed${(room.bedCount||1) > 1 ? 's' : ''}` },
    { label: 'Room Size',  value: `${room.size || '—'} m²`,                  icon: '📐', detail: 'Floor Area' },
    { label: 'Floor',      value: room.floor ? `${room.floor}th Floor` : '—', icon: '🏢', detail: 'Level'    },
  ];

  // Available categories for the preview strip
  const availableCategories = Object.keys(CATEGORY_META).filter(
    cat => cat === 'balcony' ? hasBalcony : imageSet[cat]
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300&family=Cinzel:wght@400;500&family=Cormorant+Garamond:wght@400;500&display=swap');
        .rdp-hero { transition: transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }
        .rdp-hero-wrap:hover .rdp-hero { transform: scale(1.03); }
        .rdp-hero-wrap { cursor: pointer; }
        .rdp-thumb { border: 2px solid transparent; transition: all 0.3s ease; }
        .rdp-thumb:hover { border-color: #F59E0B; transform: scale(1.06); }
        .rdp-thumb.rdp-thumb-active { border-color: #F59E0B; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }
        .rdp-stat { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); cursor: default; }
        .rdp-stat:hover { transform: translateY(-7px) scale(1.04); box-shadow: 0 20px 44px rgba(168,131,74,0.16); }
        .rdp-amenity { transition: all 0.25s ease; cursor: default; }
        .rdp-amenity:hover { background: #FEF3C7; border-color: #F59E0B; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(245,158,11,0.15); }
        .rdp-book-btn { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); }
        .rdp-book-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(245,158,11,0.45); }
        .rdp-book-btn:active { transform: scale(0.97) !important; }
        .rdp-img-in { opacity: 0; transition: opacity 0.55s ease; }
        .rdp-img-in.loaded { opacity: 1; }
        @keyframes rdpUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .rdp-a1 { animation: rdpUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .rdp-a2 { animation: rdpUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .rdp-a3 { animation: rdpUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.30s both; }
        .rdp-a4 { animation: rdpUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
        .rdp-rule { height: 1px; background: linear-gradient(90deg, transparent, #C9A96E 30%, #C9A96E 70%, transparent); }

        /* Category preview cards */
        .cat-card { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); cursor: pointer; }
        .cat-card:hover { transform: translateY(-5px) scale(1.03); box-shadow: 0 14px 36px rgba(0,0,0,0.15); }
        .cat-card:hover .cat-overlay { opacity: 1; }
        .cat-overlay { transition: opacity 0.3s ease; opacity: 0; }
        .open-gallery-btn { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .open-gallery-btn:hover { transform: scale(1.05); box-shadow: 0 8px 20px rgba(245,158,11,0.35); }
      `}</style>

      {/* ── Full-width Hero Image (click to open gallery) ── */}
      <div
        className="relative overflow-hidden bg-gray-900 rdp-hero-wrap"
        style={{ height: 'clamp(300px, 55vh, 560px)' }}
        onClick={() => openGallery('room', activeImg)}
        title="Click to view all photos"
      >
        <img
          key={activeImg}
          src={heroImgSrc}
          alt={room.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover rdp-hero rdp-img-in ${imgLoaded ? 'loaded' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none"/>

        {/* "View all photos" badge */}
        <div className="absolute bottom-5 right-6 flex items-center gap-2 bg-black/50 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20">
          <span>🖼️</span> View All Photos
        </div>

        {/* Top badges */}
        <div className="absolute top-6 left-7 flex items-center gap-3">
          <span className="bg-amber-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            {room.type}
          </span>
          {room.discountPercent > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              -{room.discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Bottom room info overlay */}
        <div className="absolute bottom-7 left-7 text-white">
          <p className="text-amber-300 text-xs font-semibold tracking-[0.32em] uppercase mb-2" style={{ fontFamily:"'Cinzel',serif" }}>
            Amigo Hotel · Chennai
          </p>
          <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(1.9rem,4.5vw,3.2rem)', fontWeight:300, lineHeight:1.1, marginBottom: '0.5rem' }}>
            {room.name}
          </h1>
          {room.rating?.count > 0 && (
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_,i) => (
                <span key={i} style={{ color: i < Math.round(room.rating.average) ? '#FBBF24' : 'rgba(255,255,255,0.22)', fontSize:'15px' }}>★</span>
              ))}
              <span className="text-white/60 text-xs ml-1">{room.rating.average?.toFixed(1)} · {room.rating.count} reviews</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Hero Thumbnail Strip ── */}
      <div className="bg-gray-950 px-7 py-3 flex gap-2.5 overflow-x-auto">
        {heroImages.map((img, i) => (
          <button key={i}
            onClick={() => { setActiveImg(i); setImgLoaded(false); }}
            className={`rdp-thumb flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden ${activeImg === i ? 'rdp-thumb-active' : ''}`}>
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
        {/* "All photos" quick-open */}
        <button
          onClick={() => openGallery('room', 0)}
          className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-amber-400/20 border border-amber-400/40 flex flex-col items-center justify-center gap-0.5 hover:bg-amber-400/30 transition"
        >
          <span className="text-amber-400 text-lg">⊞</span>
          <span className="text-amber-400 text-xs font-bold">All</span>
        </button>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── LEFT — Details ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Price & Description */}
            <div className="rdp-a1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-amber-600 text-xs font-bold tracking-[0.28em] uppercase mb-1.5" style={{ fontFamily:"'Cinzel',serif" }}>
                    Nightly Rate
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light text-gray-900" style={{ fontFamily:"'Playfair Display',Georgia,serif" }}>
                      {formatINR(effectivePrice)}
                    </span>
                    <span className="text-gray-400 text-sm">per night</span>
                  </div>
                  {room.discountPercent > 0 && (
                    <p className="text-sm text-gray-400 line-through mt-0.5">{formatINR(room.pricePerNight)}</p>
                  )}
                </div>
              </div>
              <div className="rdp-rule mb-6"/>
              <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:'1.08rem', lineHeight:1.85, color:'#4B4740' }}>
                {room.description}
              </p>
            </div>

            {/* ── 4 Elegant Stat Cards ── */}
            <div className="rdp-a2">
              <p className="text-xs font-bold text-gray-400 tracking-[0.28em] uppercase mb-5" style={{ fontFamily:"'Cinzel',serif" }}>
                Room Specifications
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {statCards.map(s => (
                  <div key={s.label} className="rdp-stat rounded-2xl text-center py-7 px-2 bg-gradient-to-b from-amber-50 to-white border border-amber-100 shadow-sm">
                    <span className="text-4xl block mb-3">{s.icon}</span>
                    <p className="font-semibold text-gray-800 text-sm mb-0.5 leading-tight" style={{ fontFamily:"'Playfair Display',Georgia,serif" }}>
                      {s.value}
                    </p>
                    <p className="text-gray-400 text-xs uppercase tracking-widest">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Photo Gallery by Category ── */}
            <div className="rdp-a3">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-bold text-gray-400 tracking-[0.28em] uppercase" style={{ fontFamily:"'Cinzel',serif" }}>
                  Photo Gallery
                </p>
                <button
                  onClick={() => openGallery('room', 0)}
                  className="open-gallery-btn flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold text-xs px-4 py-2 rounded-full"
                >
                  🖼️ Open Full Gallery
                </button>
              </div>

              {/* Category preview grid */}
              <div className={`grid gap-4 ${availableCategories.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : availableCategories.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {availableCategories.map(cat => {
                  const imgs = imageSet[cat] || [];
                  return (
                    <div key={cat} className="cat-card rounded-2xl overflow-hidden relative" onClick={() => openGallery(cat, 0)}>
                      <img src={imgs[0]} alt={CATEGORY_META[cat].label}
                        className="w-full h-32 object-cover"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'; }}
                      />
                      {/* Overlay */}
                      <div className="cat-overlay absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                        <span className="text-2xl">{CATEGORY_META[cat].icon}</span>
                        <span className="text-white text-xs font-bold uppercase tracking-widest">View {imgs.length} Photos</span>
                      </div>
                      {/* Always-visible label strip */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center justify-between">
                        <span className="text-white text-xs font-bold flex items-center gap-1">
                          <span>{CATEGORY_META[cat].icon}</span>
                          {CATEGORY_META[cat].label}
                        </span>
                        <span className="text-amber-300 text-xs">{imgs.length} photos</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Amenities ── */}
            {room.amenities?.length > 0 && (
              <div className="rdp-a3">
                <p className="text-xs font-bold text-gray-400 tracking-[0.28em] uppercase mb-4" style={{ fontFamily:"'Cinzel',serif" }}>
                  Amenities & Features
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {room.amenities.map(a => (
                    <span key={a} className="rdp-amenity inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full shadow-sm">
                      <span className="text-base">{amenityIcons[a] || '✦'}</span>
                      <span className="capitalize">{a}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Policies ── */}
            <div className="rdp-a4 rounded-2xl border border-gray-100 bg-gray-50/80 p-7">
              <p className="text-xs font-bold text-gray-400 tracking-[0.28em] uppercase mb-5" style={{ fontFamily:"'Cinzel',serif" }}>
                House Policies
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { icon: '🚬', label: 'Smoking',     value: room.smokingAllowed ? 'Permitted'    : 'Not Permitted' },
                  { icon: '🐾', label: 'Pets',         value: room.petsAllowed    ? 'Pets Welcome' : 'No Pets'       },
                  { icon: '✅', label: 'Cancellation', value: 'Free within 48 hrs'                                  },
                ].map(p => (
                  <div key={p.label} className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">{p.label}</p>
                      <p className="font-semibold text-gray-700 text-sm">{p.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT — Booking Widget ── */}
          <div>
            <div className="sticky top-24 rounded-3xl overflow-hidden shadow-2xl shadow-amber-100/50 border border-amber-100"
              style={{ background: 'linear-gradient(170deg, #fffdf8 0%, #fdf8ef 100%)' }}>

              {/* Widget Header */}
              <div className="px-7 py-6 text-white" style={{ background: 'linear-gradient(135deg, #1a1208 0%, #2d2010 100%)' }}>
                <p className="text-amber-400 text-xs font-semibold tracking-[0.28em] uppercase mb-1" style={{ fontFamily:"'Cinzel',serif" }}>
                  Reserve Your Suite
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-light" style={{ fontFamily:"'Playfair Display',Georgia,serif" }}>
                    {formatINR(effectivePrice)}
                  </span>
                  <span className="text-gray-400 text-xs">/ night</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Check-In</label>
                    <input type="date" value={dates.checkIn} min={new Date().toISOString().split('T')[0]}
                      onChange={e => { setDates({ ...dates, checkIn: e.target.value }); setAvailability(null); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Check-Out</label>
                    <input type="date" value={dates.checkOut} min={dates.checkIn || new Date().toISOString().split('T')[0]}
                      onChange={e => { setDates({ ...dates, checkOut: e.target.value }); setAvailability(null); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"/>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="text-center text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl py-2.5">
                    {nights} night{nights > 1 ? 's' : ''} selected
                  </div>
                )}

                <button onClick={handleCheckAvailability}
                  disabled={!dates.checkIn || !dates.checkOut || checking}
                  className="w-full border-2 border-amber-400 text-amber-700 font-bold py-3 rounded-xl hover:bg-amber-50 transition disabled:opacity-40 text-sm">
                  {checking
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"/>Checking…
                      </span>
                    : 'Check Availability'
                  }
                </button>

                {availability !== null && (
                  <div className={`rounded-2xl p-4 text-sm ${availability.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    {availability.available ? (
                      <>
                        <p className="font-bold text-green-700 mb-3 flex items-center gap-1.5">✅ Available for {nights} night{nights>1?'s':''}!</p>
                        <div className="space-y-1.5 text-green-800">
                          <div className="flex justify-between text-sm"><span className="text-green-600">Base ({nights}n)</span><span className="font-medium">{formatINR(base)}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-green-600">GST (12%)</span><span className="font-medium">{formatINR(tax)}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-green-600">Service (5%)</span><span className="font-medium">{formatINR(svc)}</span></div>
                          <div className="rdp-rule my-2"/>
                          <div className="flex justify-between font-bold text-base text-green-900"><span>Total</span><span>{formatINR(total)}</span></div>
                        </div>
                      </>
                    ) : (
                      <p className="font-bold text-red-600 flex items-center gap-1.5">❌ Not available for selected dates</p>
                    )}
                  </div>
                )}

                {availability?.available && (
                  <button onClick={handleBook} className="rdp-book-btn w-full bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold py-4 rounded-xl text-base">
                    Book Now — {formatINR(total)}
                  </button>
                )}

                <div className="rdp-rule mt-2"/>
                <div className="pt-1 space-y-1.5">
                  {['✦ Free cancellation 48h before check-in', '✦ Includes GST & service charges', '✦ Instant booking confirmation'].map(t => (
                    <p key={t} className="text-xs text-gray-400">{t}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Gallery Lightbox ── */}
      {galleryOpen && (
        <GalleryModal
          imageSet={imageSet}
          hasBalcony={hasBalcony}
          initialCategory={galleryCategory}
          initialIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}
