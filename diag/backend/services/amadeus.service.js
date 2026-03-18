/**
 * services/amadeus.service.js
 * Amadeus Hotel API wrapper with smart fallback for test-environment
 * "NO ROOMS AVAILABLE AT REQUESTED PROPERTY" errors.
 *
 * Strategy:
 *  1. Try the requested hotel with requested dates
 *  2. If empty/error, retry with shifted dates (+7 days, +30 days)
 *  3. If still empty, return curated fallback rooms so the UI always works
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Amadeus = require('amadeus');
const logger  = require('../utils/logger');

// ── Tamil Nadu city → IATA code map ─────────────────────────
const TN_CITIES = {
  MAA: { name: 'Chennai',    iata: 'MAA' },
  CJB: { name: 'Coimbatore', iata: 'CJB' },
  IXM: { name: 'Madurai',    iata: 'IXM' },
  TRZ: { name: 'Trichy',     iata: 'TRZ' },
  SXV: { name: 'Salem',      iata: 'SXV' },
};

// ── Curated fallback rooms shown when Amadeus test env has no inventory ──
const FALLBACK_ROOMS = [
  {
    offerId:     'FALLBACK-STD-001',
    roomType:    'STANDARD',
    roomName:    'Standard Double Room',
    bedType:     'DOUBLE',
    beds:        1,
    description: 'Comfortable standard room with modern amenities, air conditioning, flat-screen TV, and complimentary Wi-Fi.',
    currency:    'INR',
    basePrice:   2800,
    totalPrice:  3200,
    taxes:       [{ code: 'TAX', amount: 400 }],
    policies: {
      cancellation: 'Free cancellation up to 24 hours before check-in.',
      checkIn:  '14:00',
      checkOut: '11:00',
    },
    amenities: ['WIFI', 'AIR_CONDITIONING', 'TELEVISION', 'SAFE'],
    adults:    2,
    isFallback: true,
  },
  {
    offerId:     'FALLBACK-DLX-002',
    roomType:    'DELUXE',
    roomName:    'Deluxe King Room',
    bedType:     'KING',
    beds:        1,
    description: 'Spacious deluxe room with king-size bed, city view, mini-bar, and premium bath amenities.',
    currency:    'INR',
    basePrice:   4500,
    totalPrice:  5200,
    taxes:       [{ code: 'TAX', amount: 700 }],
    policies: {
      cancellation: 'Free cancellation up to 48 hours before check-in.',
      checkIn:  '14:00',
      checkOut: '12:00',
    },
    amenities: ['WIFI', 'AIR_CONDITIONING', 'MINIBAR', 'TELEVISION', 'SAFE', 'BATHTUB'],
    adults:    2,
    isFallback: true,
  },
  {
    offerId:     'FALLBACK-STE-003',
    roomType:    'SUITE',
    roomName:    'Executive Suite',
    bedType:     'KING',
    beds:        1,
    description: 'Luxurious suite with separate living area, panoramic views, butler service, and premium in-room dining.',
    currency:    'INR',
    basePrice:   8500,
    totalPrice:  9800,
    taxes:       [{ code: 'TAX', amount: 1300 }],
    policies: {
      cancellation: 'Free cancellation up to 72 hours before check-in.',
      checkIn:  '12:00',
      checkOut: '12:00',
    },
    amenities: ['WIFI', 'AIR_CONDITIONING', 'MINIBAR', 'TELEVISION', 'SAFE', 'BATHTUB', 'BUTLER_SERVICE'],
    adults:    3,
    isFallback: true,
  },
  {
    offerId:     'FALLBACK-TWN-004',
    roomType:    'TWIN',
    roomName:    'Twin Room',
    bedType:     'TWIN',
    beds:        2,
    description: 'Comfortable twin room with two single beds, perfect for colleagues or friends travelling together.',
    currency:    'INR',
    basePrice:   3200,
    totalPrice:  3700,
    taxes:       [{ code: 'TAX', amount: 500 }],
    policies: {
      cancellation: 'Free cancellation up to 24 hours before check-in.',
      checkIn:  '14:00',
      checkOut: '11:00',
    },
    amenities: ['WIFI', 'AIR_CONDITIONING', 'TELEVISION'],
    adults:    2,
    isFallback: true,
  },
];

let client = null;

function getClient() {
  if (client) return client;

  const apiKey    = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    const missing = [];
    if (!apiKey)    missing.push('AMADEUS_API_KEY');
    if (!apiSecret) missing.push('AMADEUS_API_SECRET');
    const msg =
      `Amadeus credentials missing: ${missing.join(', ')}. ` +
      `Ensure backend/.env exists and contains these variables.`;
    logger.error('[Amadeus] ' + msg);
    throw new Error(msg);
  }

  client = new Amadeus({
    clientId:     apiKey,
    clientSecret: apiSecret,
    hostname:     process.env.AMADEUS_ENV === 'production' ? 'production' : 'test',
    logLevel:     process.env.NODE_ENV === 'development' ? 'warn' : 'silent',
  });

  logger.info('[Amadeus] Client initialised successfully');
  return client;
}

// ── Date helpers ─────────────────────────────────────────────
const fmt = (d) => new Date(d).toISOString().split('T')[0];
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return fmt(d);
};

// ── Exported: list of supported cities ──────────────────────
exports.getSupportedCities = () =>
  Object.values(TN_CITIES).map(c => ({ code: c.iata, name: c.name }));

// ── Exported: search hotels by IATA city code ───────────────
exports.searchHotels = async (cityCode) => {
  const code = cityCode.toUpperCase();
  if (!TN_CITIES[code]) {
    throw new Error(
      `Unsupported city: "${code}". Supported codes: ${Object.keys(TN_CITIES).join(', ')}`
    );
  }

  const amadeus = getClient();
  logger.info(`[Amadeus] Searching hotels in ${code} (${TN_CITIES[code].name})`);

  try {
    const response = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode:    code,
      radius:      50,
      radiusUnit:  'KM',
      hotelSource: 'ALL',
    });

    const hotels = (response.data || []).slice(0, 20).map(h => ({
      hotelId:      h.hotelId,
      name:         h.name,
      cityCode:     h.address?.cityCode   || code,
      cityName:     TN_CITIES[code]?.name || code,
      country:      h.address?.countryCode || 'IN',
      latitude:     h.geoCode?.latitude,
      longitude:    h.geoCode?.longitude,
      distance:     h.distance?.value,
      distanceUnit: h.distance?.unit,
      amenities:    h.amenities || [],
      rating:       h.rating    || null,
      image: `https://source.unsplash.com/600x400/?hotel,${encodeURIComponent(TN_CITIES[code]?.name || code)}`,
    }));

    logger.info(`[Amadeus] Found ${hotels.length} hotels in ${code}`);
    return hotels;
  } catch (err) {
    const detail = err?.description?.[0]?.detail || err.message || 'Unknown error';
    logger.error(`[Amadeus] Hotel search failed for ${code}: ${detail}`);
    throw new Error(detail);
  }
};

// ── Try one specific date range for offers ───────────────────
async function tryFetchOffers(amadeus, hotelId, checkIn, checkOut, adults) {
  const params = {
    hotelIds:     hotelId,
    adults:       Math.max(1, Number(adults) || 1),
    checkInDate:  checkIn,
    checkOutDate: checkOut,
    roomQuantity: 1,
    currency:     'INR',
    bestRateOnly: false,   // false = return ALL available offers, not just cheapest
  };

  const response  = await amadeus.shopping.hotelOffersSearch.get(params);
  const hotelData = (response.data || [])[0];
  return hotelData || null;
}

// ── Exported: get room offers with automatic date fallback ───
exports.getHotelOffers = async (hotelId, checkIn, checkOut, adults = 1) => {
  const amadeus = getClient();

  // Pre-validate hotelId format — Amadeus test env requires alphanumeric IDs
  // typically 8+ chars. Empty or clearly malformed IDs go straight to fallback.
  if (!hotelId || hotelId.length < 3) {
    logger.warn(`[Amadeus] Invalid hotelId "${hotelId}" — using fallback rooms`);
    return {
      hotel: { hotelId, name: 'Hotel', amenities: [], rating: null, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80' },
      offers: FALLBACK_ROOMS,
      usedCheckIn: checkIn,
      usedCheckOut: checkOut,
      isFallbackData: true,
    };
  }

  // Build today / tomorrow as safe defaults
  const todayStr    = fmt(new Date());
  const tomorrowStr = addDays(todayStr, 1);

  const ciBase = checkIn  || todayStr;
  const coBase = checkOut || tomorrowStr;

  // Ensure checkout is always after checkin
  const ciSafe = ciBase >= todayStr ? ciBase : todayStr;
  const coSafe = coBase > ciSafe    ? coBase : addDays(ciSafe, 1);

  // Date strategies to try in order:
  // 1. Exactly what the user asked for
  // 2. One week from now  (+7 days)
  // 3. One month from now (+30 days)
  const attempts = [
    { ci: ciSafe,              co: coSafe              },
    { ci: addDays(todayStr, 7),  co: addDays(todayStr, 8)  },
    { ci: addDays(todayStr, 30), co: addDays(todayStr, 31) },
  ];

  let hotelData = null;
  let usedCheckIn  = ciSafe;
  let usedCheckOut = coSafe;

  for (const attempt of attempts) {
    try {
      logger.info(`[Amadeus] Trying offers for ${hotelId} | ${attempt.ci} → ${attempt.co}`);
      hotelData = await tryFetchOffers(amadeus, hotelId, attempt.ci, attempt.co, adults);

      if (hotelData && hotelData.offers && hotelData.offers.length > 0) {
        usedCheckIn  = attempt.ci;
        usedCheckOut = attempt.co;
        logger.info(`[Amadeus] Found ${hotelData.offers.length} offers on attempt dates ${attempt.ci}`);
        break; // success — stop trying
      }

      logger.info(`[Amadeus] No offers for ${hotelId} on ${attempt.ci}, trying next date range...`);
      hotelData = null;
    } catch (err) {
      const code   = err?.description?.[0]?.code;
      const detail = err?.description?.[0]?.detail || err.message || '';

      // Known test-environment errors — skip to fallback immediately (no point retrying)
      // 3553 / 1257 = INVALID PROPERTY CODE — hotel ID not valid in test sandbox
      // 3526         = NO ROOMS AVAILABLE AT REQUESTED PROPERTY
      // 4082         = MAXIMUM NUMBER OF ITINERARIES EXCEEDED (rate limit)
      const isKnownTestError =
        code === 3526 || code === 3553 || code === 1257 || code === 4082 ||
        detail.toLowerCase().includes('no rooms') ||
        detail.toLowerCase().includes('not available') ||
        detail.toLowerCase().includes('invalid property') ||
        detail.toLowerCase().includes('invalid hotel') ||
        detail.toLowerCase().includes('property code');

      if (isKnownTestError) {
        logger.info(`[Amadeus] ${hotelId} skipped (code ${code}: ${detail.substring(0,80)}), using fallback`);
        break; // No point retrying — go straight to fallback rooms
      }

      // Any other error (auth, network, etc.) — surface it immediately
      logger.error(`[Amadeus] Unexpected offers error for ${hotelId}: ${detail}`);
      throw new Error(detail || 'Failed to fetch hotel offers from Amadeus');
    }
  }

  // ── Build hotel metadata ─────────────────────────────────
  const h = hotelData?.hotel || {};
  const hotelMeta = {
    hotelId:   h.hotelId   || hotelId,
    name:      h.name      || 'Hotel',
    cityCode:  h.cityCode  || '',
    latitude:  h.latitude,
    longitude: h.longitude,
    phone:     h.contact?.phone,
    email:     h.contact?.email,
    amenities: h.amenities || [],
    rating:    h.rating    || null,
    image:     'https://source.unsplash.com/600x400/?hotel,luxury',
  };

  // ── If Amadeus returned real offers, map and return them ─
  if (hotelData && hotelData.offers && hotelData.offers.length > 0) {
    const offers = hotelData.offers.map(o => ({
      offerId:     o.id,
      roomType:    o.room?.type || 'ROOM',
      roomName:    o.room?.typeEstimated?.bedType
        ? `${o.room.typeEstimated.bedType} Room`
        : (o.room?.description?.text || 'Standard Room'),
      bedType:     o.room?.typeEstimated?.bedType || 'DOUBLE',
      beds:        o.room?.typeEstimated?.beds    || 1,
      description: o.room?.description?.text      || '',
      currency:    o.price?.currency              || 'INR',
      basePrice:   parseFloat(o.price?.base  || 0),
      totalPrice:  parseFloat(o.price?.total || 0),
      taxes: (o.price?.taxes || []).map(t => ({
        code:   t.code,
        amount: parseFloat(t.amount || 0),
      })),
      policies: {
        cancellation: o.policies?.cancellations?.[0]?.description?.text || 'See hotel policy',
        checkIn:      o.policies?.checkInOut?.checkIn  || '14:00',
        checkOut:     o.policies?.checkInOut?.checkOut || '11:00',
      },
      amenities:  o.room?.amenities || [],
      adults:     o.guests?.adults  || 1,
      isFallback: false,
    }));

    return { hotel: hotelMeta, offers, usedCheckIn, usedCheckOut };
  }

  // ── All date attempts exhausted — use curated fallback rooms ─
  logger.warn(`[Amadeus] No availability found for ${hotelId} across all date attempts. Using fallback rooms.`);
  return {
    hotel:       hotelMeta,
    offers:      FALLBACK_ROOMS,
    usedCheckIn: ciSafe,
    usedCheckOut: coSafe,
    isFallbackData: true,
  };
};
