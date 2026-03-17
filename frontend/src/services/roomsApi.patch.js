/**
 * ============================================================
 *  frontend/src/services/roomsApi.patch.js
 *  ─────────────────────────────────────────────────────────
 *  AMIGO — Drop-in patch for your existing Rooms page API call
 *
 *  YOUR EXISTING ROOMS PAGE probably has code like this:
 *
 *    const response = await fetch(`${API}/api/rooms?type=${type}&...`);
 *    // or
 *    const { data } = await roomsAPI.getRooms({ type, minPrice, ... });
 *
 *  ─────────────────────────────────────────────────────────
 *  HOW TO INTEGRATE IN 3 STEPS:
 *
 *  STEP 1 — Find your existing rooms fetch call.
 *           It's in one of: RoomsPage.jsx, CustomerRooms.jsx,
 *           Rooms.jsx, or a service file like api.js / roomsApi.js
 *
 *  STEP 2 — ADD this import at the top of that file:
 *           import { getLiveRooms, getSupportedCities } from '../services/hotelsApi';
 *
 *  STEP 3 — ADD this code BEFORE or INSTEAD OF your existing fetch:
 *
 *    // ── Amigo: Load live Amadeus rooms ──────────────────
 *    const [amadeusCity, setAmadeusCity] = useState('Chennai');
 *    const [amadeusCheckIn,  setAmadeusCheckIn]  = useState('');
 *    const [amadeusCheckOut, setAmadeusCheckOut] = useState('');
 *    const [cities, setCities] = useState([]);
 *
 *    useEffect(() => {
 *      getSupportedCities().then(setCities).catch(() => {});
 *    }, []);
 *
 *    // Call this when user changes city / dates:
 *    const loadLiveRooms = async () => {
 *      const result = await getLiveRooms({
 *        city:     amadeusCity,
 *        checkIn:  amadeusCheckIn,
 *        checkOut: amadeusCheckOut,
 *        adults:   2,
 *        type:     currentTypeFilter,    // optional
 *        minPrice: currentMinPrice,      // optional
 *        maxPrice: currentMaxPrice,      // optional
 *      });
 *      setRooms(result.rooms);   // same shape as your existing rooms!
 *    };
 *
 *  ─────────────────────────────────────────────────────────
 *  NO OTHER CHANGES NEEDED.
 *  The rooms returned by getLiveRooms() have the exact same
 *  fields as your existing MongoDB rooms:
 *    _id, name, type, description, pricePerNight, discountPercent,
 *    capacity, size, floor, images, amenities, rating, bedType,
 *    bedCount, isAvailable, effectivePrice
 * ============================================================
 */

// This file is documentation only — no code to import.
// Follow the 3 steps above in your existing Rooms page.
