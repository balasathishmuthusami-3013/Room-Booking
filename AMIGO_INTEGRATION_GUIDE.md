# AMIGO — Complete Integration Guide

## What was fixed in this version

| Problem | Fix |
|---------|-----|
| `getDashboard` / `getUsers` / `toggleUserStatus` duplicated in admin.controller.js | Removed duplicates — single clean version |
| Amadeus hotels not showing on the Rooms page | Added `/api/rooms/live` and `/api/rooms/cities` endpoints |
| Room controller didn't connect to Amadeus | `room.controller.js` now imports and calls `amadeus.service.js` |
| "Amigo" brand name still in backend | Renamed to "Amigo" in server.js, package.json, .env.example |

---

## STEP 1 — Install dependencies & set up .env

```bash
cd backend
npm install
cp .env.example .env
```

The `.env.example` already has the Amadeus credentials filled in.
Fill in the rest (MongoDB, JWT secret, etc.).

---

## STEP 2 — Add the Amigo search panel to your existing Rooms page

This is the only change you need to make to your existing frontend.

**Find your existing rooms page file.** It is probably one of:
- `frontend/src/pages/Customer/RoomsPage.jsx`
- `frontend/src/pages/Customer/Rooms.jsx`
- `frontend/src/pages/Customer/CustomerRooms.jsx`

**Add 2 lines:**

```jsx
// ADD at the top of that file, with your other imports:
import AmigoRoomsIntegration from './AmigoRoomsIntegration';

// ADD inside your JSX, just ABOVE your existing room cards grid:
<AmigoRoomsIntegration />
```

That's it. The component is self-contained — it has its own search form,
shows live Amadeus hotel rooms, and handles bookings with demo payment.
It doesn't touch or replace anything existing.

---

## STEP 3 — Rename "Amigo" to "Amigo" in your frontend

Search your frontend code for "Amigo" (case-insensitive) and replace with "Amigo".

The most likely places:
- `src/App.js` or `src/index.js` — title, meta tags
- Your Navbar component — logo text
- Any page title like `<title>Amigo</title>` in `public/index.html`

**Quick search command (run from your frontend folder):**
```bash
grep -r "amigo\|Amigo\|AMIGO" src/ public/ --include="*.js" --include="*.jsx" --include="*.html" -l
```

---

## How the integration works

```
User visits /rooms page
       ↓
AmigoRoomsIntegration component loads
       ↓
User enters city + dates → clicks "Search Hotels"
       ↓
Frontend: GET /api/rooms/live?city=Chennai&checkIn=...&checkOut=...
       ↓
Backend room.controller.js → amadeus.service.js:
  Step 1: OAuth token (cached 29 min)
  Step 2: GET /v1/reference-data/locations/hotels/by-city?cityCode=MAA
  Step 3: GET /v3/shopping/hotel-offers?hotelIds=...
       ↓
Each offer mapped to same shape as MongoDB room document
       ↓
Frontend renders hotel rooms in your existing card UI
       ↓
User clicks "Book Now" → demo payment modal → booking saved to MongoDB
```

---

## New API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/rooms/cities` | Supported TN cities list |
| GET | `/api/rooms/live?city=Chennai&checkIn=...&checkOut=...` | Live Amadeus rooms in room shape |
| GET | `/api/hotels/cities` | Same (alternate route) |
| GET | `/api/hotels?city=...&checkIn=...` | Full hotel search |
| GET | `/api/hotels/:hotelId/rooms?...` | Single hotel room list |
| POST | `/api/hotels/book` | Create Amadeus booking |
| PATCH | `/api/hotels/bookings/:id/confirm-demo` | Confirm demo payment |
| GET | `/api/hotels/my-bookings` | User's Amigo bookings |

---

## Files changed

| File | Change |
|------|--------|
| `backend/controllers/admin.controller.js` | **Fixed** — removed duplicate functions |
| `backend/controllers/room.controller.js` | **Enhanced** — added `getLiveRooms`, `getCities` |
| `backend/routes/room.routes.js` | **Enhanced** — added `/live` and `/cities` routes |
| `backend/services/amadeus.service.js` | Unchanged (was already correct) |
| `backend/controllers/hotels.controller.js` | Unchanged |
| `backend/routes/hotels.routes.js` | Unchanged |
| `backend/models/Booking.js` | Unchanged |
| `backend/models/RateOverride.js` | Unchanged |
| `backend/services/booking.service.js` | Unchanged |
| `backend/server.js` | Renamed to Amigo |
| `backend/package.json` | Renamed to amigo |
| `frontend/src/services/hotelsApi.js` | Added `getLiveRooms`, `getSupportedCities` |
| `frontend/src/pages/Customer/AmigoRoomsIntegration.jsx` | **NEW** — drop-in panel |

---

## Supported Tamil Nadu Cities

| City | IATA Code |
|------|-----------|
| Chennai | MAA |
| Madurai | IXM |
| Coimbatore | CJB |
| Trichy | TRZ |
| Salem | SXV |

---

## Troubleshooting

**"Cannot find module 'multer'"**
```bash
cd backend && npm install
```

**Hotels not loading**
- Check that `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` are set in your `.env`
- Amadeus test tier: ~2,000 calls/month. If exhausted, try next day.
- Check console for the exact error message from `amadeus.service.js`

**"Amigo" still showing in the browser**
- Check `public/index.html` → change `<title>` tag
- Check your Navbar component
- Run the grep command in Step 3 above
