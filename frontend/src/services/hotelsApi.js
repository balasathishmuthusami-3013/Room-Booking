/**
 * frontend/src/services/hotelsApi.js
 *
 * Calls the Amadeus-backed hotel endpoints.
 * Uses the same auth token pattern as the rest of the app.
 *
 * Usage:
 *   import { getHotels, getRooms, bookHotel, confirmDemoPayment } from '../services/hotelsApi';
 */

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function request(path, options = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || data?.error || 'Request failed');
  return data;
}

// ─── GET /api/hotels/cities ────────────────────────────
export async function getSupportedCities() {
  const d = await request('/hotels/cities');
  return d.data.cities; // string[]
}

// ─── GET /api/hotels?city=MAA&checkIn=&checkOut= ───────
/**
 * @param {object} params
 *   city      {string}  city name OR IATA code — 'Chennai' | 'MAA'
 *   checkIn   {string}  'YYYY-MM-DD'
 *   checkOut  {string}  'YYYY-MM-DD'
 *   adults    {number}  default 2
 *   ratings   {string}  '3,4,5' | '4,5' | '5'
 *   minPrice  {number}  optional INR filter
 *   maxPrice  {number}  optional INR filter
 *   radius    {number}  km, default 20
 *
 * @returns {{ hotels: Hotel[], total: number, city, checkIn, checkOut }}
 */
export async function getHotels(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, v);
  });
  const d = await request(`/hotels?${qs}`);
  return d.data;
}

// ─── GET /api/hotels/:hotelId/rooms?checkIn=&checkOut= ─
/**
 * @param {string} hotelId   Amadeus hotel ID
 * @param {object} params    { checkIn, checkOut, adults }
 * @returns {{ hotel, rooms, nights, checkIn, checkOut }}
 */
export async function getRooms(hotelId, params) {
  const qs = new URLSearchParams(params);
  const d  = await request(`/hotels/${hotelId}/rooms?${qs}`);
  return d.data;
}

// ─── POST /api/hotels/book  [auth required] ────────────
export async function bookHotel(payload) {
  const d = await request('/hotels/book', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
  return d.data.booking;
}

// ─── PATCH /api/hotels/bookings/:id/confirm-demo ───────
export async function confirmDemoPayment(bookingId) {
  const d = await request(`/hotels/bookings/${bookingId}/confirm-demo`, {
    method: 'PATCH',
  });
  return d.data.booking;
}

// ─── GET /api/hotels/my-bookings  [auth required] ──────
export async function getMyHotelBookings(params = {}) {
  const qs = new URLSearchParams(params);
  const d  = await request(`/hotels/my-bookings?${qs}`);
  return d.data;
}

// ─── Admin: GET /api/admin/amadeus-bookings ────────────
export async function adminGetHotelBookings(params = {}) {
  const qs = new URLSearchParams(params);
  const d  = await request(`/admin/amadeus-bookings?${qs}`);
  return d.data;
}

// ─── Admin: Rate Overrides ─────────────────────────────
export async function getRateOverrides() {
  const d = await request('/admin/rate-overrides');
  return d.data.overrides;
}
export async function createRateOverride(payload) {
  const d = await request('/admin/rate-overrides', {
    method: 'POST', body: JSON.stringify(payload),
  });
  return d.data.override;
}
export async function updateRateOverride(id, payload) {
  const d = await request(`/admin/rate-overrides/${id}`, {
    method: 'PUT', body: JSON.stringify(payload),
  });
  return d.data.override;
}
export async function deleteRateOverride(id) {
  await request(`/admin/rate-overrides/${id}`, { method: 'DELETE' });
}
export async function toggleRateOverride(id) {
  const d = await request(`/admin/rate-overrides/${id}/toggle`, { method: 'PATCH' });
  return d.data.override;
}

// ─── UI Helpers ────────────────────────────────────────
export function formatINR(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

export function getRoomTypeLabel(code = '') {
  const MAP = {
    STANDARD: 'Standard Room', SUPERIOR: 'Superior Room',
    DELUXE: 'Deluxe Room', SUITE: 'Suite',
    EXECUTIVE: 'Executive Room', JUNIOR_SUITE: 'Junior Suite',
    PRESIDENTIAL_SUITE: 'Presidential Suite',
    STUDIO: 'Studio', PENTHOUSE: 'Penthouse',
    FAMILY: 'Family Room', DOUBLE: 'Double Room', TWIN: 'Twin Room',
  };
  return MAP[code.toUpperCase()] || code.replace(/_/g, ' ');
}

export function getStarDisplay(n) {
  const count = parseInt(n) || 0;
  return '★'.repeat(count) + '☆'.repeat(Math.max(0, 5 - count));
}
