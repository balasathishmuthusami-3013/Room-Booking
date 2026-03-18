# ✅ What To Do Now — Fix Blank White Page

## Why It Was Blank
Netlify treats build warnings as ERRORS (CI=true by default).
React shows warnings during build → Netlify fails silently → blank page, no console errors.

## These Files Were Fixed
- `frontend/package.json`         → build script now has CI=false
- `frontend/.env.production`      → cleaned up (no comments)
- `frontend/netlify.toml`         → added base directory + CI=false
- `frontend/public/_redirects`    → backup SPA routing fix
- `netlify.toml` (root)           → for if your repo root is hotel-v7/
- `backend/server.js`             → added root / route (no more "not found")
- `backend/render.yaml`           → fixed start command

---

## Step 1 — Copy These 3 Files Into Your GitHub Repo

These are the critical fixes. Open your GitHub repo and update:

### File 1: `frontend/package.json` — change the build line
```json
"scripts": {
  "start": "react-scripts start",
  "build": "CI=false react-scripts build"
}
```

### File 2: `frontend/netlify.toml` — replace entire file with:
```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = "frontend/build"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS    = "--legacy-peer-deps"
  CI           = "false"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

### File 3: `frontend/public/_redirects` — create this new file:
```
/*    /index.html   200
```

---

## Step 2 — Check Netlify Build Settings

Go to: **Netlify → Your Site → Site Settings → Build & Deploy → Build Settings**

Make sure these match EXACTLY:
```
Base directory:   frontend
Build command:    npm run build  
Publish directory: frontend/build
```

⚠️ If your GitHub repo root IS the frontend folder (not hotel-v7), then:
```
Base directory:   (leave empty)
Build command:    npm run build
Publish directory: build
```

---

## Step 3 — Check Netlify Environment Variables

Go to: **Netlify → Site Settings → Environment Variables**

Must have exactly this (no spaces, no quotes):
```
Key:   REACT_APP_API_URL
Value: https://room-booking-umcy.onrender.com/api
```

---

## Step 4 — Trigger a Fresh Deploy

1. Netlify → **Deploys** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Watch the build log — should end with "Site is live"

---

## Step 5 — Check Render Environment Variables

Go to: **Render → Your Service → Environment**

Must have ALL of these:
```
PORT            = 10000
NODE_ENV        = production
MONGODB_URI     = mongodb+srv://youruser:yourpass@cluster0.xxx.mongodb.net/room-booking?retryWrites=true&w=majority
JWT_SECRET      = (any long random string, min 32 chars)
JWT_REFRESH_SECRET = (different long random string)
JWT_EXPIRES_IN  = 7d
JWT_REFRESH_EXPIRES_IN = 30d
CLIENT_URL      = https://your-netlify-site.netlify.app
AMADEUS_API_KEY = LBzJn6kepD4T20JAcz6p9m4W646ScDf3
AMADEUS_API_SECRET = jymNhpJ5IbG539yk
AMADEUS_ENV     = test
TAX_RATE        = 0.12
SERVICE_CHARGE_RATE = 0.05
```

---

## Step 6 — Test

1. Open your Netlify URL → should show the hotel homepage (not blank)
2. Open `https://your-render-url.onrender.com/` → should show:
   ```json
   { "message": "🏨 Amigo Hotel API is running", "status": "OK" }
   ```
3. Try Register → Login → should work

---

## Quick Diagnosis — Tell Me Which Step Fails

| What you see | What it means |
|---|---|
| Blank white page | Build failed silently — CI=false not applied yet |
| Homepage shows but login fails | REACT_APP_API_URL wrong or CORS error |
| `{"error":"Route / not found"}` on Render | ✅ Normal with old code — fixed in new server.js |
| `{"message":"🏨 Amigo Hotel API is running"}` | ✅ Backend working perfectly |
| 404 on /admin after page refresh | `_redirects` or `netlify.toml` not committed |

