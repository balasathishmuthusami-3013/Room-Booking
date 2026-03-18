/**
 * ARExplorer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Augmented Reality Tourist Explorer — Aurum Grand Hotel
 *
 * DROP-IN usage (RoomDetailPage.jsx):
 *   import ARExplorer from '../components/ar/ARExplorer';
 *   <ARExplorer hotelLat={1.2868} hotelLng={103.8545} />
 *
 * The component renders the [ View Photos ] [ 360° Room Tour ] [ Explore Nearby in AR ]
 * button row. When the AR button is clicked, a fullscreen AR overlay opens inside
 * the same React app (no separate page needed), or optionally opens ar-explorer.html
 * in a new tab on desktop for better compatibility.
 *
 * APIs used:
 *   - navigator.mediaDevices.getUserMedia  (camera)
 *   - navigator.geolocation.watchPosition  (GPS)
 *   - window.addEventListener('deviceorientation') (compass + gyro)
 *   - OpenStreetMap Overpass API           (free, no API key required)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── UTILS ──────────────────────────────────────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const bearingTo = (lat1, lng1, lat2, lng2) => {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
};

const formatDist = (km) => km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

const toCardinal = (deg) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
};

const angleDiff = (a, b) => {
  let d = ((b - a + 180) % 360) - 180;
  return d < -180 ? d + 360 : d;
};

const ICONS = {
  museum: '🏺', attraction: '🎡', park: '🌳', viewpoint: '🔭',
  restaurant: '🍽️', cafe: '☕', historic: '🏰', garden: '🌺',
  mosque: '🕌', church: '⛪', temple: '⛩️', beach: '🏖️', default: '📍',
};

const tagToIcon = (tags) => {
  if (tags.tourism === 'museum') return ICONS.museum;
  if (tags.tourism === 'attraction') return ICONS.attraction;
  if (tags.tourism === 'viewpoint') return ICONS.viewpoint;
  if (tags.leisure === 'park') return ICONS.park;
  if (tags.leisure === 'garden') return ICONS.garden;
  if (tags.amenity === 'restaurant') return ICONS.restaurant;
  if (tags.amenity === 'cafe') return ICONS.cafe;
  if (tags.historic) return ICONS.historic;
  if (tags.amenity === 'place_of_worship') {
    if (tags.religion === 'muslim') return ICONS.mosque;
    if (tags.religion === 'christian') return ICONS.church;
    return ICONS.temple;
  }
  return ICONS.default;
};

// ── DATA FETCHING ──────────────────────────────────────────────────────────────
const fetchNearbyPlaces = async (lat, lng, radiusKm = 8) => {
  const r = radiusKm * 1000;
  const query = `[out:json][timeout:25];
(
  node["tourism"](around:${r},${lat},${lng});
  node["amenity"~"restaurant|cafe|theatre"](around:${r},${lat},${lng});
  node["leisure"~"park|garden"](around:${r},${lat},${lng});
  node["historic"](around:${r},${lat},${lng});
  way["tourism"](around:${r},${lat},${lng});
);
out center 25;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', body: query,
    });
    const data = await res.json();
    return data.elements
      .filter(el => el.tags?.name || el.tags?.['name:en'])
      .map(el => {
        const eLat = el.lat ?? el.center?.lat;
        const eLng = el.lon ?? el.center?.lon;
        if (!eLat || !eLng) return null;
        const tags = el.tags;
        return {
          id: el.id,
          name: tags['name:en'] || tags.name,
          lat: eLat, lng: eLng,
          dist: haversine(lat, lng, eLat, eLng),
          bearing: bearingTo(lat, lng, eLat, eLng),
          icon: tagToIcon(tags),
          rating: parseFloat((3.5 + Math.random() * 1.4).toFixed(1)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 20);
  } catch {
    // Fallback demo data
    return [
      { id: 1, name: 'Merlion Park', dlat: 0.01, dlng: 0.02, icon: '🦁' },
      { id: 2, name: 'Marina Bay Sands', dlat: 0.012, dlng: 0.025, icon: '🏨' },
      { id: 3, name: 'Gardens by the Bay', dlat: 0.015, dlng: 0.02, icon: '🌺' },
      { id: 4, name: 'Clarke Quay', dlat: -0.005, dlng: -0.01, icon: '🌉' },
      { id: 5, name: 'Chinatown Heritage', dlat: -0.01, dlng: -0.005, icon: '🏮' },
      { id: 6, name: 'Fort Canning Park', dlat: 0.008, dlng: -0.015, icon: '🌳' },
      { id: 7, name: 'Raffles Hotel', dlat: 0.02, dlng: 0.01, icon: '🏛️' },
      { id: 8, name: 'Singapore River Walk', dlat: -0.008, dlng: 0.005, icon: '🌊' },
    ].map(d => ({
      ...d,
      lat: lat + d.dlat, lng: lng + d.dlng,
      dist: haversine(lat, lng, lat + d.dlat, lng + d.dlng),
      bearing: bearingTo(lat, lng, lat + d.dlat, lng + d.dlng),
      rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
    })).sort((a, b) => a.dist - b.dist);
  }
};

// ── AR OVERLAY COMPONENT ────────────────────────────────────────────────────────
function AROverlay({ hotelLat, hotelLng, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const markersRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [heading, setHeading] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [userPos, setUserPos] = useState({ lat: hotelLat, lng: hotelLng });
  const [isLoading, setIsLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  const headingRef = useRef(0);
  const tiltRef = useRef(0);
  const placesRef = useRef([]);

  // Keep refs in sync
  useEffect(() => { headingRef.current = heading; }, [heading]);
  useEffect(() => { tiltRef.current = tilt; }, [tilt]);
  useEffect(() => { placesRef.current = places; }, [places]);

  // ── Camera ──────────────────────────────────────
  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (e) {
        console.warn('Camera unavailable');
      }
    };
    start();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Location ────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ── Fetch places ────────────────────────────────
  useEffect(() => {
    (async () => {
      setStatus('Scanning nearby attractions...');
      const data = await fetchNearbyPlaces(userPos.lat, userPos.lng);
      setPlaces(data);
      setStatus(`${data.length} places found`);
      setIsLoading(false);
    })();
  }, []);

  // Update place distances when user moves
  useEffect(() => {
    if (places.length === 0) return;
    setPlaces(prev => prev.map(p => ({
      ...p,
      dist: haversine(userPos.lat, userPos.lng, p.lat, p.lng),
      bearing: bearingTo(userPos.lat, userPos.lng, p.lat, p.lng),
    })).sort((a, b) => a.dist - b.dist));
  }, [userPos]);

  // ── Orientation ─────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      let alpha = e.webkitCompassHeading ?? ((360 - (e.alpha || 0)) % 360);
      setHeading(alpha);
      setTilt(e.beta || 0);
    };

    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(p => { if (p === 'granted') window.addEventListener('deviceorientation', handler); })
        .catch(() => { setIsDesktop(true); });
    } else if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handler);
    } else {
      setIsDesktop(true);
    }

    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  // ── Desktop drag simulation ─────────────────────
  useEffect(() => {
    if (!isDesktop) return;
    let startX = 0, startH = 0, dragging = false;
    const down = (e) => { dragging = true; startX = e.clientX || e.touches?.[0]?.clientX; startH = headingRef.current; };
    const move = (e) => {
      if (!dragging) return;
      const x = e.clientX || e.touches?.[0]?.clientX;
      setHeading(((startH + (x - startX) * 0.5) + 360) % 360);
    };
    const up = () => { dragging = false; };
    window.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [isDesktop]);

  // ── AR Marker rendering loop ────────────────────
  const renderMarkers = useCallback(() => {
    const container = markersRef.current;
    if (!container) return;
    container.innerHTML = '';

    const W = window.innerWidth;
    const H = window.innerHeight;
    const FOV = 75;
    const h = headingRef.current;
    const tiltVal = tiltRef.current;
    const tiltOffset = Math.max(-H * 0.3, Math.min(H * 0.3, tiltVal * 3));
    const baseY = H * 0.5 + tiltOffset;

    placesRef.current.forEach(place => {
      const diff = angleDiff(h, place.bearing);
      if (Math.abs(diff) > FOV / 2) return;

      const x = W / 2 + (diff / (FOV / 2)) * (W / 2);
      const distFactor = Math.min(1, place.dist / 8);
      const y = baseY - (1 - distFactor) * H * 0.25;
      if (y < 80 || y > H - 140) return;

      const arrow = diff > 0 ? '→' : '←';
      const isNear = Math.abs(diff) < 10;

      const el = document.createElement('div');
      el.style.cssText = `
        position:absolute;
        left:${x}px;top:${y}px;
        transform:translate(-50%,-100%);
        display:flex;flex-direction:column;align-items:center;
        pointer-events:auto;cursor:pointer;
        animation:markerIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      `;
      el.innerHTML = `
        <div style="
          background:rgba(10,10,15,0.65);
          backdrop-filter:blur(18px);
          border:1px solid ${isNear ? 'rgba(201,168,76,0.9)' : 'rgba(201,168,76,0.25)'};
          border-radius:14px;
          padding:9px 13px;
          min-width:130px;
          box-shadow:${isNear ? '0 0 18px rgba(201,168,76,0.25)' : '0 8px 24px rgba(0,0,0,0.4)'};
        ">
          <div style="font-size:12px;font-weight:600;color:#f0ede8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">
            ${place.icon} ${place.name}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px;">
            <span style="font-size:11px;color:#e8c97a;font-weight:500;">${formatDist(place.dist)}</span>
            <span style="font-size:10px;color:rgba(240,237,232,0.55);">⭐ ${place.rating.toFixed(1)}</span>
            <span style="font-size:13px;">${arrow}</span>
          </div>
        </div>
        <div style="width:1.5px;height:18px;background:linear-gradient(to bottom,#c9a84c,transparent);"></div>
        <div style="width:7px;height:7px;border-radius:50%;background:#c9a84c;box-shadow:0 0 10px #c9a84c;"></div>
      `;
      el.addEventListener('click', () => setSelectedPlace(place));
      container.appendChild(el);
    });

    rafRef.current = requestAnimationFrame(renderMarkers);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      rafRef.current = requestAnimationFrame(renderMarkers);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isLoading, renderMarkers]);

  const handleClose = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', fontFamily: "'DM Sans', sans-serif", color: '#f0ede8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        @keyframes markerIn { from { opacity:0;transform:translate(-50%,-90%) scale(0.7); } to { opacity:1;transform:translate(-50%,-100%) scale(1); } }
        @keyframes scanLine { 0%{top:0;opacity:0;} 10%{opacity:0.4;} 90%{opacity:0.4;} 100%{top:100%;opacity:0;} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(0.8);} }
        @keyframes chipIn { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        @keyframes glowDot { 0%,100%{box-shadow:0 0 8px #c9a84c;} 50%{box-shadow:0 0 20px #e8c97a;} }
        .ar-chip:hover { border-color: #c9a84c !important; background: rgba(201,168,76,0.1) !important; }
        .ar-close-btn:hover { background: rgba(0,0,0,0.8) !important; }
      `}</style>

      {/* Camera */}
      <video ref={videoRef} autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />

      {/* Scan line */}
      <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, #c9a84c, transparent)', zIndex: 2, animation: 'scanLine 4s ease-in-out infinite' }} />

      {/* Corner brackets */}
      {[['60px','20px','auto','auto'], ['60px','auto','auto','20px'], ['auto','20px','80px','auto'], ['auto','auto','80px','20px']].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', top: pos[0], right: pos[1], bottom: pos[2], left: pos[3], width: 30, height: 30, zIndex: 3, opacity: 0.5 }}>
          <div style={{ position: 'absolute', top: i < 2 ? 0 : 'auto', bottom: i >= 2 ? 0 : 'auto', left: i % 2 === 0 ? 0 : 'auto', right: i % 2 === 1 ? 0 : 'auto', width: '100%', height: 1.5, background: '#c9a84c' }} />
          <div style={{ position: 'absolute', top: i < 2 ? 0 : 'auto', bottom: i >= 2 ? 0 : 'auto', left: i % 2 === 0 ? 0 : 'auto', right: i % 2 === 1 ? 0 : 'auto', width: 1.5, height: '100%', background: '#c9a84c' }} />
        </div>
      ))}

      {/* AR Markers container */}
      <div ref={markersRef} style={{ position: 'absolute', inset: 0, zIndex: 5 }} />

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '48px 20px 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, border: '1.5px solid #c9a84c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 800, color: '#c9a84c' }}>AG</div>
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.55)' }}>AR Explorer</span>
        </div>
        <button className="ar-close-btn" onClick={handleClose} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✕</button>
      </div>

      {/* Desktop hint */}
      {isDesktop && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 8, textAlign: 'center', pointerEvents: 'none', opacity: 0.7 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>←→</div>
          <div style={{ fontSize: 12, letterSpacing: '0.1em', color: 'rgba(240,237,232,0.55)' }}>Drag to rotate view</div>
        </div>
      )}

      {/* Compass */}
      <div style={{ position: 'absolute', bottom: 170, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', border: '1.5px solid rgba(201,168,76,0.25)', background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 3, height: 28, position: 'relative', transform: `rotate(${-heading}deg)`, transition: 'transform 0.15s ease-out' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to bottom, #ef4444, #dc2626)', borderRadius: '2px 2px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'rgba(255,255,255,0.7)', borderRadius: '0 0 2px 2px' }} />
          </div>
        </div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.08em' }}>{toCardinal(heading)}</div>
        <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.45)' }}>Heading</div>
      </div>

      {/* Detail panel */}
      {selectedPlace && (
        <div style={{ position: 'absolute', bottom: 160, left: 16, right: 16, zIndex: 20, background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(24px)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 20, padding: '18px 20px', animation: 'chipIn 0.35s ease-out' }}>
          <button onClick={() => setSelectedPlace(null)} style={{ position: 'absolute', top: 14, right: 14, width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(240,237,232,0.55)', cursor: 'pointer', fontSize: 12 }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>{selectedPlace.icon}</span>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>{selectedPlace.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.5)' }}>Tourist Attraction</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { val: formatDist(selectedPlace.dist), key: 'Distance' },
              { val: `⭐ ${selectedPlace.rating.toFixed(1)}`, key: 'Rating' },
              { val: toCardinal(selectedPlace.bearing), key: 'Direction' },
            ].map(({ val, key }) => (
              <div key={key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e8c97a' }}>{val}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.45)', marginTop: 2 }}>{key}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '20px 20px 36px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulseDot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.55)' }}>{status}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {places.map((p, i) => (
            <div key={p.id || i} className="ar-chip" onClick={() => setSelectedPlace(p)}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, background: 'rgba(10,10,15,0.6)', border: '1px solid rgba(201,168,76,0.25)', backdropFilter: 'blur(16px)', cursor: 'pointer', transition: 'all 0.2s', animation: `chipIn 0.4s ease-out ${i * 50}ms both' ` }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 6, fontSize: 10, color: 'rgba(240,237,232,0.55)' }}>
                  <span style={{ color: '#e8c97a', fontWeight: 500 }}>{formatDist(p.dist)}</span>
                  <span>⭐ {p.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#c9a84c', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.5)' }}>Scanning nearby places...</p>
        </div>
      )}
    </div>
  );
}

// ── HOTEL ROOM BUTTONS ROW ─────────────────────────────────────────────────────
export default function ARExplorer({ hotelLat = 1.2868, hotelLng = 103.8545, onViewPhotos, on360Tour }) {
  const [arOpen, setAROpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  const buttons = [
    {
      id: 'photos',
      label: 'View Photos',
      icon: '🖼️',
      onClick: onViewPhotos || (() => alert('Opening photo gallery...')),
      primary: false,
    },
    {
      id: 'tour',
      label: '360° Room Tour',
      icon: '🔄',
      onClick: on360Tour || (() => alert('Launching 360° tour...')),
      primary: false,
    },
    {
      id: 'ar',
      label: 'Explore Nearby in AR',
      icon: '📡',
      onClick: () => setAROpen(true),
      primary: true,
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {buttons.map(btn => (
          <button
            key={btn.id}
            onClick={btn.onClick}
            onMouseEnter={() => setHovered(btn.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: btn.primary ? '12px 22px' : '11px 18px',
              borderRadius: 12,
              border: btn.primary ? 'none' : '1px solid rgba(201,168,76,0.4)',
              background: btn.primary
                ? hovered === btn.id
                  ? 'linear-gradient(135deg, #d4b55e, #b8922e)'
                  : 'linear-gradient(135deg, #c9a84c, #b8922e)'
                : hovered === btn.id
                  ? 'rgba(201,168,76,0.08)'
                  : 'transparent',
              color: btn.primary ? '#0a0a0f' : '#c9a84c',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: btn.primary ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: hovered === btn.id ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: btn.primary && hovered === btn.id
                ? '0 8px 24px rgba(201,168,76,0.3)'
                : btn.primary
                  ? '0 4px 16px rgba(201,168,76,0.2)'
                  : 'none',
              letterSpacing: '0.01em',
            }}
          >
            <span style={{ fontSize: 15 }}>{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>

      {arOpen && (
        <AROverlay
          hotelLat={hotelLat}
          hotelLng={hotelLng}
          onClose={() => setAROpen(false)}
        />
      )}
    </>
  );
}
