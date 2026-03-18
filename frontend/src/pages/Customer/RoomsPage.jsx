/**
 * src/pages/Customer/RoomsPage.jsx
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { roomAPI } from '../../services/api';
import RoomCard from '../../components/rooms/RoomCard';

const ROOM_TYPES = ['standard', 'deluxe', 'suite', 'penthouse', 'family'];

const ROOM_TYPE_ICONS = {
  standard:  { icon: '🛏️',  label: 'Standard' },
  deluxe:    { icon: '🌟',  label: 'Deluxe' },
  suite:     { icon: '🏛️', label: 'Suite' },
  penthouse: { icon: '👑',  label: 'Penthouse' },
  family:    { icon: '👨‍👩‍👧‍👦', label: 'Family' },
};

export default function RoomsPage() {
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    adults: searchParams.get('adults') || '',
    sort: '-rating.average',
    page: 1,
  });

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
        );
        const { data } = await roomAPI.getAll(params);
        setRooms(data.data.rooms);
        setTotal(data.data.total);
      } catch { /* handled globally */ }
      finally { setLoading(false); }
    };
    fetchRooms();
  }, [filters]);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  return (
    <div className="relative z-10">
      <style>{`
        @keyframes roomsHeaderIn { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes iconFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(-5deg)} }
        .rooms-header { animation: roomsHeaderIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .rooms-logo-icon { animation: iconFloat 3s ease-in-out infinite; display:inline-block; }
        .type-pill { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .type-pill:hover, .type-pill.active { transform: scale(1.08) translateY(-2px); }
        .filter-input { transition: all 0.2s ease; }
        .filter-input:focus { transform: scale(1.02); box-shadow: 0 0 0 3px rgba(251,191,36,0.25); }
        .room-grid-item { animation: roomCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes roomCardIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:none} }
        .clear-btn { transition: all 0.2s ease; }
        .clear-btn:hover { color: #EF4444; text-decoration: underline; transform: scale(1.05); }
      `}</style>

      {/* ── Page Header Banner ── */}
      <div className="bg-gradient-to-r from-gray-900 via-amber-950 to-gray-900 text-white py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'repeating-linear-gradient(45deg,#C9A96E 0,#C9A96E 1px,transparent 0,transparent 50%)',backgroundSize:'16px 16px'}}/>
        <div className="max-w-7xl mx-auto flex items-center gap-5 rooms-header relative z-10">
          <div className="rooms-logo-icon text-6xl select-none">🏨</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">Hoto.tours · Chennai</span>
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"/>
            </div>
            <h1 className="text-4xl font-bold text-white" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>
              Rooms &amp; <span className="text-amber-400 italic">Suites</span>
            </h1>
            <p className="text-gray-300 mt-1 text-sm">{total > 0 ? `${total} exquisite room${total !== 1 ? 's' : ''} available for you` : 'Discovering available rooms…'}</p>
          </div>
        </div>
        {/* Quick type chips */}
        <div className="max-w-7xl mx-auto mt-5 flex flex-wrap gap-2 relative z-10">
          <button
            onClick={() => updateFilter('type', '')}
            className={`type-pill flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition ${filters.type === '' ? 'active bg-amber-400 text-gray-900 border-amber-400' : 'bg-white/10 text-gray-200 border-white/20 hover:bg-white/20'}`}>
            🏠 All Rooms
          </button>
          {ROOM_TYPES.map(t => (
            <button key={t}
              onClick={() => updateFilter('type', t)}
              className={`type-pill flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition ${filters.type === t ? 'active bg-amber-400 text-gray-900 border-amber-400' : 'bg-white/10 text-gray-200 border-white/20 hover:bg-white/20'}`}>
              {ROOM_TYPE_ICONS[t]?.icon} {ROOM_TYPE_ICONS[t]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-6 sticky top-20">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Filters</h2>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Room Type</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" checked={filters.type === ''} onChange={() => updateFilter('type', '')} className="text-amber-400" />
                    <span className="text-sm text-gray-700 group-hover:text-amber-600 transition">🏠 All Types</span>
                  </label>
                  {ROOM_TYPES.map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={filters.type === t} onChange={() => updateFilter('type', t)} className="text-amber-400" />
                      <span className="text-sm text-gray-700 group-hover:text-amber-600 transition capitalize">
                        {ROOM_TYPE_ICONS[t]?.icon} {t}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Price Range / Night</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min ₹" value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="filter-input w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/>
                  <input type="number" placeholder="Max ₹" value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="filter-input w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/>
                </div>
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Min Rating</label>
                <select value={filters.minRating} onChange={(e) => updateFilter('minRating', e.target.value)}
                  className="filter-input w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                  <option value="">Any Rating</option>
                  {[3, 3.5, 4, 4.5].map((r) => (
                    <option key={r} value={r}>★ {r}+</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Sort By</label>
                <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}
                  className="filter-input w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                  <option value="-rating.average">Highest Rated</option>
                  <option value="pricePerNight">Price: Low to High</option>
                  <option value="-pricePerNight">Price: High to Low</option>
                  <option value="-createdAt">Newest</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({ type: '', minPrice: '', maxPrice: '', minRating: '', adults: '', sort: '-rating.average', page: 1 })}
                className="clear-btn w-full text-sm text-amber-600 font-semibold py-2 rounded-lg border border-amber-200 hover:bg-amber-50 transition">
                ✕ Clear All Filters
              </button>
            </div>
          </aside>

          {/* Room Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse skeleton" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <span className="text-6xl block mb-4" style={{animation:'iconFloat 2s ease-in-out infinite'}}>🔍</span>
                <p className="text-xl font-semibold text-gray-600 mb-2">No rooms match your filters</p>
                <p className="text-sm mb-6">Try adjusting your search criteria</p>
                <button
                  onClick={() => setFilters({ type: '', minPrice: '', maxPrice: '', minRating: '', adults: '', sort: '-rating.average', page: 1 })}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded-full transition hover:scale-105">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {rooms.map((room, i) => (
                  <div key={room._id} className="room-grid-item" style={{animationDelay:`${i * 0.07}s`}}>
                    <RoomCard room={room} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

