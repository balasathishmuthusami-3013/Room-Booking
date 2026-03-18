# 🚀 Amigo Hotel — Full Deployment Guide
### Render (Backend) + Netlify (Frontend) + MongoDB Atlas

---

## 📋 What's Already Done For You

These files have been pre-configured in this package:

| File | What It Does |
|------|-------------|
| `backend/server.js` | CORS fixed — accepts your Netlify URL |
| `backend/config/database.js` | Atlas-ready connection with retry logic |
| `backend/render.yaml` | Render service config |
| `backend/.env.production` | All backend env vars (fill in your values) |
| `frontend/.env.production` | Frontend API URL pointing to Render |
| `frontend/.env` | Local dev config |
| `frontend/netlify.toml` | Build settings + SPA routing fix |
| `backend/.gitignore` | Prevents secrets leaking to GitHub |
| `frontend/.gitignore` | Prevents node_modules on GitHub |

---

## 🔐 STEP 0 — Secure MongoDB Atlas First

**Do this before anything else.**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Change your database password:**
   - Database Access → Edit user → Change password → Save
3. **Whitelist all IPs (for Render):**
   - Network Access → Add IP Address → Allow Access from Anywhere → `0.0.0.0/0` → Confirm
4. **Copy your new connection string:**
   - Clusters → Connect → Drivers → Node.js → Copy URI
   - Looks like: `mongodb+srv://myuser:NEWPASS@cluster0.fjikz2v.mongodb.net/room-booking?retryWrites=true&w=majority`

---

## 🖥️ STEP 1 — Deploy Backend to Render

### 1a. Push backend to GitHub

```bash
# In your terminal, from the hotel-v7 folder:
cd backend
git init
git add .
git commit -m "Initial backend deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hotel-booking-backend.git
git push -u origin main
```

### 1b. Create Render Web Service

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name:** `hotel-booking-api`
   - **Region:** Singapore (closest to India)
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 1c. Add Environment Variables in Render

Go to your service → **Environment** → Add each variable:

```
PORT                    = 10000
NODE_ENV                = production
MONGODB_URI             = mongodb+srv://myuser:NEWPASS@cluster0.fjikz2v.mongodb.net/room-booking?retryWrites=true&w=majority
JWT_SECRET              = [run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
JWT_REFRESH_SECRET      = [run same command again — different value]
JWT_EXPIRES_IN          = 7d
JWT_REFRESH_EXPIRES_IN  = 30d
AMADEUS_API_KEY         = LBzJn6kepD4T20JAcz6p9m4W646ScDf3
AMADEUS_API_SECRET      = jymNhpJ5IbG539yk
AMADEUS_ENV             = test
TAX_RATE                = 0.12
SERVICE_CHARGE_RATE     = 0.05
FULL_REFUND_HOURS       = 48
PARTIAL_REFUND_HOURS    = 24
PARTIAL_REFUND_PERCENT  = 50
CLIENT_URL              = https://YOUR-SITE.netlify.app   ← fill AFTER step 2
```

> ⚠️ **Leave `CLIENT_URL` blank for now** — fill it after Netlify deploy in Step 2.

### 1d. Note your Render URL

After deploy succeeds, your backend URL is:
```
https://room-booking-umcy.onrender.com
```
Test it: `https://room-booking-umcy.onrender.com/health` → should return `{"status":"OK",...}`

---

## 🌐 STEP 2 — Deploy Frontend to Netlify

### 2a. Push frontend to GitHub

```bash
# From hotel-v7/frontend folder:
cd frontend
git init
git add .
git commit -m "Initial frontend deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hotel-booking-frontend.git
git push -u origin main
```

### 2b. Create Netlify Site

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Select your frontend GitHub repo
3. Build settings (auto-detected from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `build`

### 2c. Add Environment Variable in Netlify

Go to **Site Settings → Environment Variables → Add variable:**

```
Key:   REACT_APP_API_URL
Value: https://room-booking-umcy.onrender.com/api
```

> ⚠️ After adding env vars, you must **trigger a redeploy**: Deploys → Trigger deploy → Deploy site

### 2d. Note your Netlify URL

Your site is live at something like:
```
https://amigo-hotel-booking.netlify.app
```

---

## 🔄 STEP 3 — Connect Frontend ↔ Backend

### 3a. Update CORS in Render

Go back to Render → Environment → Update:
```
CLIENT_URL = https://amigo-hotel-booking.netlify.app
```
Click **Save Changes** → Render will auto-redeploy.

### 3b. Test the connection

Open your Netlify site → try to **Register** or **Login**.

If it works: ✅ you're done!

If you see CORS errors in the browser console → double-check CLIENT_URL in Render.

---

## ✅ Quick Verification Checklist

```
□ MongoDB Atlas password changed
□ Atlas IP whitelist → 0.0.0.0/0
□ Render backend deployed → /health returns OK
□ All env vars added in Render
□ Netlify frontend deployed
□ REACT_APP_API_URL set in Netlify env vars
□ Netlify redeployed after adding env var
□ CLIENT_URL updated in Render with your Netlify URL
□ Login/Register working on live site
□ Admin panel accessible at /admin
```

---

## 🐛 Common Problems & Fixes

### Problem: White screen on Netlify
**Fix:** Add `netlify.toml` to your frontend root (already included in this package).
The `[[redirects]]` rule is essential for React Router to work on direct URLs.

### Problem: CORS error in browser
```
Access to XMLHttpRequest at 'https://room-booking-umcy.onrender.com/api/...'
from origin 'https://your-site.netlify.app' has been blocked by CORS policy
```
**Fix:** In Render environment, set `CLIENT_URL` = your exact Netlify URL (with `https://`, no trailing slash).

### Problem: 401 Unauthorized after login
**Fix:** Check `JWT_SECRET` is set in Render. Also check REACT_APP_API_URL ends in `/api`.

### Problem: MongoDB connection failed
```
MongoServerError: bad auth
```
**Fix:** URL-encode special characters in your password. E.g. `@` → `%40`, `#` → `%23`.

### Problem: Render sleeps after 15 minutes (Free tier)
**Fix:** First request after sleep takes ~30 seconds. To keep it awake (optional):
- Use [UptimeRobot](https://uptimerobot.com) → monitor `https://room-booking-umcy.onrender.com/health` every 5 minutes (free).

### Problem: Build fails on Netlify — peer dependency errors
**Fix:** Already handled in `netlify.toml` with `NPM_FLAGS = "--legacy-peer-deps"`

### Problem: /admin shows 404 after refresh
**Fix:** The `netlify.toml` `[[redirects]]` rule handles this. Make sure `netlify.toml` is committed to your repo.

---

## 🔑 Generating Secure JWT Secrets

Run this in any terminal with Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run it twice — use one for `JWT_SECRET`, another for `JWT_REFRESH_SECRET`.

---

## 🌏 Architecture Summary

```
User Browser
     │
     ▼
Netlify CDN (React App)
     │  HTTPS API calls to /api/...
     ▼
Render Web Service (Express.js)
  PORT=10000
  NODE_ENV=production
     │  mongoose.connect()
     ▼
MongoDB Atlas (Cloud Database)
  cluster0.fjikz2v.mongodb.net
```

---

## 📁 File Structure Reference

```
hotel-v7/
├── backend/
│   ├── .env.production          ← Fill & add to Render env vars
│   ├── .gitignore               ← Keeps .env off GitHub ✅
│   ├── render.yaml              ← Render config
│   ├── server.js                ← CORS fixed ✅
│   ├── config/database.js       ← Atlas-ready ✅
│   └── ...
└── frontend/
    ├── .env                     ← Local dev (localhost:5000)
    ├── .env.production          ← Production (your Render URL)
    ├── .gitignore               ← Keeps secrets off GitHub ✅
    ├── netlify.toml             ← SPA routing fix + build config ✅
    └── ...
```

---

*Generated for Amigo Hotel Booking — Render + Netlify + MongoDB Atlas*
