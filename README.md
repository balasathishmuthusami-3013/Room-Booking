# 🏨 Aurum Grand — Hotel Booking Web Application

A complete, production-ready full-stack hotel booking system with AI chatbot, dual payment gateways (Stripe + Razorpay), role-based access, and analytics dashboard.

---

## 📁 Project Structure

```
hotel-booking/
│
├── backend/                        # Node.js + Express API
│   ├── config/
│   │   └── database.js             # MongoDB connection with retry logic
│   ├── controllers/
│   │   ├── auth.controller.js      # Register, Login, Refresh, Logout
│   │   ├── room.controller.js      # Room CRUD + availability
│   │   ├── booking.controller.js   # Booking create, list, cancel
│   │   ├── payment.controller.js   # Stripe + Razorpay handlers
│   │   ├── chat.controller.js      # AI chatbot endpoint
│   │   └── admin.controller.js     # Dashboard analytics, user mgmt
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect + authorize + optionalAuth
│   │   └── errorHandler.js         # Global error formatter
│   ├── models/
│   │   ├── User.js                 # User schema (bcrypt, roles)
│   │   ├── Room.js                 # Room schema (pricing, amenities)
│   │   ├── Booking.js              # Booking schema (pricing breakdown)
│   │   ├── Payment.js              # Payment transactions (Stripe/Razorpay)
│   │   └── ChatHistory.js          # Chat sessions storage
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── room.routes.js
│   │   ├── booking.routes.js
│   │   ├── payment.routes.js
│   │   ├── chat.routes.js
│   │   ├── admin.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   ├── booking.service.js      # Core business logic
│   │   ├── payment.service.js      # Stripe + Razorpay integration
│   │   └── chat.service.js         # OpenAI + mock chatbot
│   ├── utils/
│   │   ├── AppError.js             # Custom error class
│   │   ├── logger.js               # Winston logger
│   │   └── seeder.js               # DB seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js                   # Entry point
│
└── frontend/                       # React.js + Tailwind CSS
    └── src/
        ├── components/
        │   ├── chat/ChatWidget.jsx       # Floating AI chatbot UI
        │   ├── common/Navbar.jsx         # Responsive navigation
        │   ├── common/Footer.jsx
        │   ├── payment/PaymentGateway.jsx # Stripe + Razorpay UI
        │   └── rooms/RoomCard.jsx        # Room listing card
        ├── context/
        │   └── AuthContext.jsx           # Global auth state
        ├── pages/
        │   ├── Auth/LoginPage.jsx
        │   ├── Auth/RegisterPage.jsx
        │   ├── Customer/HomePage.jsx
        │   ├── Customer/RoomsPage.jsx    # Filter + search
        │   ├── Customer/RoomDetailPage.jsx
        │   ├── Customer/BookingPage.jsx  # Multi-step booking + payment
        │   ├── Customer/MyBookingsPage.jsx
        │   ├── Customer/BookingDetailPage.jsx
        │   ├── Customer/ProfilePage.jsx
        │   ├── Admin/AdminDashboard.jsx  # Analytics + charts
        │   ├── Admin/AdminRooms.jsx      # Room CRUD
        │   ├── Admin/AdminBookings.jsx
        │   └── Admin/AdminUsers.jsx
        ├── services/
        │   └── api.js                    # Axios + interceptors + typed APIs
        ├── App.jsx                       # Router + guards
        └── index.js
```

---

## ⚙️ Business Logic

### 🔒 Double Booking Prevention
The overlap detection uses this condition:
```
existingCheckIn < newCheckOut AND existingCheckOut > newCheckIn
```
This covers all 4 overlap cases (full, partial left, partial right, contained).

### 💰 Pricing Formula
```
baseAmount     = pricePerNight × nights × (1 - discount%)
taxAmount      = baseAmount × 12%
serviceCharge  = baseAmount × 5%
totalAmount    = baseAmount + taxAmount + serviceCharge
```

### 💸 Refund Policy
| Time Before Check-in | Refund |
|---|---|
| > 48 hours | 100% refund |
| 24–48 hours | 50% refund |
| < 24 hours | No refund |

### 💳 Payment Flows

**Stripe:**
1. Backend creates PaymentIntent → returns `clientSecret`
2. Frontend confirms with `stripe.confirmCardPayment(clientSecret)`
3. Stripe fires `payment_intent.succeeded` webhook → backend confirms booking

**Razorpay:**
1. Backend creates Order → returns `orderId`
2. Frontend opens Razorpay checkout → user pays → receives `paymentId + signature`
3. Backend verifies `HMAC_SHA256(orderId|paymentId, secret)` → confirms booking

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account (test keys)
- Razorpay account (test keys)

### Backend Setup

```bash
cd hotel-booking/backend
npm install
cp .env.example .env
# Fill in your values in .env

# Seed database with rooms + admin user
node utils/seeder.js

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd hotel-booking/frontend
npm install
cp .env.example .env
# Add your Stripe publishable key

npm start
```

### Default Admin Credentials
```
Email:    admin@hotelapp.com
Password: Admin@123456
```

---

## 🔐 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout        [protected]
GET    /api/auth/me            [protected]
```

### Rooms
```
GET    /api/rooms              [public]   ?type=&minPrice=&maxPrice=&minRating=&sort=
GET    /api/rooms/:id          [public]
GET    /api/rooms/:id/availability?checkIn=&checkOut=
POST   /api/rooms              [admin]
PUT    /api/rooms/:id          [admin]
DELETE /api/rooms/:id          [admin]
```

### Bookings
```
POST   /api/bookings           [customer]
GET    /api/bookings/my        [customer]
GET    /api/bookings/:id       [customer/admin]
PATCH  /api/bookings/:id/cancel [customer/admin]
GET    /api/bookings           [admin]
```

### Payments
```
POST   /api/payments/stripe/create-intent   [customer]
POST   /api/payments/stripe/webhook         [public, raw body]
POST   /api/payments/razorpay/create-order  [customer]
POST   /api/payments/razorpay/verify        [customer]
POST   /api/payments/refund/:bookingId      [admin]
```

### Chat
```
POST   /api/chat/message       [public/optional auth]
GET    /api/chat/history/:sessionId
```

### Admin
```
GET    /api/admin/dashboard    [admin]
GET    /api/admin/users        [admin]
PATCH  /api/admin/users/:id/toggle-status [admin]
```

---

## ☁️ Deployment

### Backend — Render / Railway / EC2

```bash
# Set environment variables on host
# Then:
npm install --production
npm start
```

For **Stripe webhooks** in production:
```bash
stripe listen --forward-to https://your-api.com/api/payments/stripe/webhook
```

### Frontend — Vercel

```bash
cd frontend
npm run build
# Deploy /build folder to Vercel
# Set REACT_APP_API_URL=https://your-backend.com/api
# Set REACT_APP_STRIPE_PUBLISHABLE_KEY
```

### MongoDB — Atlas
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/hotel_booking?retryWrites=true
```

### Environment Variables Checklist
- [ ] `JWT_SECRET` — min 32 chars, random
- [ ] `STRIPE_SECRET_KEY` — from Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` — from `stripe listen` output
- [ ] `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — from Razorpay dashboard
- [ ] `OPENAI_API_KEY` — optional (falls back to mock chatbot)
- [ ] `MONGODB_URI` — Atlas connection string
- [ ] `CLIENT_URL` — your frontend URL (for CORS)

---

## 🤖 Chatbot

The chatbot has two modes:
- **OpenAI Mode** (when `OPENAI_API_KEY` is set): Uses GPT-3.5-turbo with a hotel-specific system prompt
- **Mock Mode** (fallback): Rule-based intent detection with pre-scripted, helpful responses

Intents detected: `availability`, `pricing`, `booking`, `cancel`, `amenities`, `escalate`

Chat history is persisted per session in MongoDB `ChatHistory` collection.

---

## 🛡️ Security Features

- Helmet (HTTP security headers)
- CORS restricted to frontend origin
- Rate limiting: 200 req/15min globally, 20 req/15min for auth
- JWT access token (7d) + refresh token (30d)
- Bcrypt password hashing (12 rounds)
- Mongoose input validation + express-validator
- Stripe webhook signature verification
- Razorpay HMAC-SHA256 signature verification
- Soft deletes (rooms never hard-deleted)
- Role-based route protection

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Payment | Stripe, Razorpay |
| Chatbot | OpenAI GPT-3.5-turbo + intelligent mock fallback |
| Logging | Winston |
| Charts | Recharts |
| HTTP | Axios with auto token refresh |
