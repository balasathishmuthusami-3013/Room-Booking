# AMIGO Hotel Booking — Amadeus Integration Setup Guide

## What was built

Amigo adds **real-time hotel search** to your existing website using the Amadeus Hotel API.
It touches **only 6 files**. Every other file (rooms, bookings, payments, admin) is unchanged.

---

## Step 1 — Install the one missing package

```bash
cd backend
npm install
```

`multer` is now included in `package.json` so this also fixes the multer error.

---

## Step 2 — Create your .env file

```bash
cp .env.example .env
```

The Amadeus keys are already filled in `.env.example`:
```
AMADEUS_API_KEY=LBzJn6kepD4T20JAcz6p9m4W646ScDf3
AMADEUS_API_SECRET=jymNhpJ5IbG539yk
AMADEUS_ENV=test
```

Fill in the rest (MongoDB, JWT, etc.) and you're done.

---

## Step 3 — Add 2 routes to your React Router (App.js)

```jsx
import HotelSearchPage from './pages/Customer/HotelSearchPage';
import HotelRoomsPage  from './pages/Customer/HotelRoomsPage';

// Inside your <Routes>:
<Route path="/hotels"                element={<HotelSearchPage />} />
<Route path="/hotels/:hotelId/rooms" element={<HotelRoomsPage />} />
```

---

## Step 4 — Add a nav link

In your navbar or homepage, add:
```jsx
<Link to="/hotels">Find Hotels</Link>
// or
<a href="/hotels">Find Hotels</a>
```

---

## Files changed / added

| File | Change |
|------|--------|
| `backend/package.json` | Added `multer`, renamed app to `amigo-hotel-booking-backend` |
| `backend/.env.example` | Added Amadeus keys |
| `backend/server.js` | Renamed to Amigo, no logic changes |
| `backend/services/amadeus.service.js` | **Core** — OAuth token + hotel search + offers |
| `backend/controllers/hotels.controller.js` | **Core** — all hotel endpoints |
| `backend/routes/hotels.routes.js` | **Core** — route definitions |
| `frontend/src/services/hotelsApi.js` | All API calls from React |
| `frontend/src/pages/Customer/HotelSearchPage.jsx` | Hotel list page |
| `frontend/src/pages/Customer/HotelRoomsPage.jsx` | Hotel detail + room offers |
| `frontend/src/pages/Admin/AdminRateOverrides.jsx` | Admin rate override panel |

All other files (Booking.js, booking.service.js, admin.controller.js, admin.routes.js,
RateOverride.js) were already correct from the previous session and are included unchanged.

---

## API Endpoints

### Public (no login)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/hotels/cities` | List of supported TN cities |
| GET | `/api/hotels?city=Chennai&checkIn=2025-09-01&checkOut=2025-09-03` | Hotel list with rooms |
| GET | `/api/hotels/:hotelId/rooms?checkIn=...&checkOut=...` | Rooms for one hotel |

### Authenticated (Bearer token)
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/hotels/book` | Create booking |
| PATCH | `/api/hotels/bookings/:id/confirm-demo` | Confirm demo payment |
| GET | `/api/hotels/my-bookings` | User's bookings |

### Admin
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/admin/amadeus-bookings` | All Amigo bookings |
| GET/POST/PUT/DELETE | `/api/admin/rate-overrides` | Manage price overrides |

---

## How Amigo talks to Amadeus (3-step flow)

```
Browser → GET /api/hotels?city=Chennai&checkIn=...&checkOut=...
              ↓
         Amigo Step 1: POST /v1/security/oauth2/token
                       → access_token (cached 29 mins)
              ↓
         Amigo Step 2: GET /v1/reference-data/locations/hotels/by-city?cityCode=MAA
                       → list of hotelIds
              ↓
         Amigo Step 3: GET /v3/shopping/hotel-offers?hotelIds=...
                       → live room prices
              ↓
         Amigo enriches with admin rate overrides + tax breakdown
              ↓
         Returns clean JSON with: hotel name, ID, star rating,
         room types, prices, amenities, location
```

---

## Supported Cities

| City | IATA Code |
|------|-----------|
| Chennai | MAA |
| Madurai | IXM |
| Coimbatore | CJB |
| Trichy | TRZ |
| Salem | SXV |

Both city name and IATA code work: `?city=Chennai` or `?city=MAA`

---

## Going to Production

1. Create a Production app on [developers.amadeus.com](https://developers.amadeus.com)
2. Change `.env`: `AMADEUS_ENV=production`
3. Update the Amadeus keys to your production credentials
