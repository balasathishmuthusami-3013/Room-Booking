# AR Tourist Explorer — Integration Guide
## Aurum Grand Hotel Booking System

---

## Files Delivered

```
frontend/
├── public/
│   └── ar-explorer.html          ← Standalone AR page (zero-dependency fallback)
└── src/
    └── components/
        └── ar/
            └── ARExplorer.jsx    ← React component (primary integration)
```

---

## Quick Integration (RoomDetailPage.jsx)

### Step 1 — Import the component

```jsx
// frontend/src/pages/Customer/RoomDetailPage.jsx
import ARExplorer from '../../components/ar/ARExplorer';
```

### Step 2 — Add the button row to your room detail JSX

Find the section where you show room actions/buttons and replace or add:

```jsx
{/* ── Room Action Buttons ── */}
<ARExplorer
  hotelLat={1.2868}       {/* ← Your actual hotel latitude  */}
  hotelLng={103.8545}     {/* ← Your actual hotel longitude */}
  onViewPhotos={() => setPhotoModalOpen(true)}
  on360Tour={() => window.open('/360-tour', '_blank')}
/>
```

The component renders **three buttons** in a row:
- `[ 🖼️ View Photos ]` → calls `onViewPhotos` prop
- `[ 🔄 360° Room Tour ]` → calls `on360Tour` prop
- `[ 📡 Explore Nearby in AR ]` → opens fullscreen AR overlay

---

## How It Works

### Technology Stack
| Feature | Technology |
|---|---|
| Camera | `navigator.mediaDevices.getUserMedia({ facingMode: 'environment' })` |
| GPS / Location | `navigator.geolocation.watchPosition()` |
| Compass + Gyro | `window.addEventListener('deviceorientation')` |
| Nearby Places | OpenStreetMap Overpass API (free, no API key) |
| AR Rendering | Canvas + DOM overlay (no WebXR dependency) |

### Architecture Flow

```
User clicks "Explore Nearby in AR"
         │
         ▼
   AROverlay mounts
         │
   ┌─────┴─────┐
   │           │
Camera      GPS
starts      starts
   │           │
   └─────┬─────┘
         │
   Fetch nearby places
   (Overpass API → 5–10km radius)
         │
   deviceorientation fires
         │
   RAF loop: renderMarkers()
   • angleDiff = heading − placeBearing
   • x = screen_center + (angleDiff / halfFOV) × halfWidth
   • Show marker if |angleDiff| < 37.5°
         │
   User rotates phone → heading changes → markers reposition
```

### Marker Visibility Logic

A place appears as an AR floating label when:
```
|compass_heading − place_bearing| < 37.5°   (within 75° FOV)
AND
  marker_y > 80px (above top bar)
AND
  marker_y < window.height − 140px (above bottom chips)
```

---

## Configuring Hotel Location

In `ARExplorer.jsx`, default props are:
```jsx
export default function ARExplorer({ hotelLat = 1.2868, hotelLng = 103.8545, ... })
```

For `ar-explorer.html`, update the `CONFIG` object at the top of the `<script>`:
```js
const CONFIG = {
  hotelLat: YOUR_LAT,
  hotelLng: YOUR_LNG,
  searchRadiusKm: 8,   // How far to scan (km)
  maxPlaces: 20,        // Max attractions shown
  fovDeg: 75,           // Camera field of view (degrees)
};
```

---

## Upgrading to Google Places API (Optional)

The current implementation uses OpenStreetMap Overpass API (free, no key).

To upgrade to Google Places Nearby Search:

```js
// Replace fetchNearbyPlaces() with:
async function fetchNearbyPlaces(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
    + `?location=${lat},${lng}`
    + `&radius=${CONFIG.searchRadiusKm * 1000}`
    + `&type=tourist_attraction`
    + `&key=YOUR_GOOGLE_PLACES_API_KEY`;

  const res = await fetch(url);
  const data = await res.json();

  return data.results.map(p => ({
    id: p.place_id,
    name: p.name,
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
    dist: haversine(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
    bearing: bearingTo(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
    icon: '📍',
    rating: p.rating || 4.0,
  }));
}
```

> ⚠️ Google Places API requires billing enabled and exposes your API key client-side.
> Consider proxying through your backend: `GET /api/places/nearby?lat=&lng=`

---

## Device Permissions Required

| Permission | Why | Fallback |
|---|---|---|
| Camera | AR camera feed | Black/gradient background |
| Location | Real-time user position | Hotel coordinates used |
| Device Orientation | Compass for directional AR | Desktop mouse-drag simulation |

### iOS 13+ Orientation Permission

On iOS Safari, `DeviceOrientationEvent.requestPermission()` must be triggered
by a user gesture. The component handles this automatically — it requests
permission when the AR overlay mounts.

---

## Standalone HTML (ar-explorer.html)

For **desktop testing** or as a **fallback**, serve `ar-explorer.html` directly:

```
http://localhost:3000/ar-explorer.html
```

Or link from anywhere on the site:
```html
<a href="/ar-explorer.html" target="_blank">Open AR Explorer</a>
```

In the React app you can also open it as a popup:
```jsx
<button onClick={() => window.open('/ar-explorer.html', '_blank', 'width=400,height=800')}>
  Open AR
</button>
```

---

## HTTPS Requirement

Camera and DeviceOrientation APIs **require HTTPS** in production.

For local development: `localhost` is treated as secure by browsers.

For deployment, ensure your hosting (Vercel, Render, Nginx) serves over HTTPS.

---

## Browser Support

| Browser | Camera | Compass | Notes |
|---|---|---|---|
| Chrome Android | ✅ | ✅ | Full support |
| Safari iOS 13+ | ✅ | ✅ | Needs orientation permission tap |
| Firefox Android | ✅ | ✅ | Full support |
| Chrome Desktop | ✅ | ❌ | Drag-to-rotate simulation |
| Safari Desktop | ✅ | ❌ | Drag-to-rotate simulation |

---

## Troubleshooting

**Camera shows black screen**
→ Ensure HTTPS or localhost; check browser permissions

**No places loading**
→ Overpass API may be rate-limited; demo fallback data activates automatically

**Compass not working on iOS**
→ Requires user gesture to request permission; component handles this automatically

**Markers not appearing**
→ Rotate device (or drag on desktop); markers appear when facing a place's direction
