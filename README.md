# ♻ SmartWaste — GIFT City

> Cloud-Based Waste Collection Optimization System  
> **City:** Gandhinagar GIFT City | **Sprint:** 3-Day Rapid Prototype | **Team Size:** 4 Members | **v2.0**

---

## 🌐 Pages

| Page | URL | Description |
|------|-----|-------------|
| **Landing** | `/landing.html` | Public home page — features, how it works, team info |
| **Login / Signup** | `/login.html` | Auth page — localStorage-based for prototype |
| **Dashboard** | `/dashboard.html` | Protected 4-tab dashboard (redirects to login if no session) |

**Flow:** `landing.html` → `login.html` → `dashboard.html` (protected)

---

## 🚀 Quick Start (No Backend — Stub Mode)

Only needs Python installed. Perfect for frontend demo:

```bash
cd Cloud_Project/public
python -m http.server 8765
```

Open: http://localhost:8765/landing.html  
Demo credentials: `demo@smartwaste.in` / `demo123`

> The dashboard works fully in **stub mode** (USE_STUB = true in app.js) without any backend or database.

---

## ⚙ Full Stack Setup (With Express + PostgreSQL)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
copy .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Set up PostgreSQL

```bash
# Create database
psql -U postgres -c "CREATE DATABASE smartwaste;"

# Run schema + seed
psql -U postgres -d smartwaste -f db/schema.sql
psql -U postgres -d smartwaste -f db/seed.sql
```

### 4. Start server

```bash
npm run dev
# Server: http://localhost:3000
# Dashboard: http://localhost:3000/landing.html
```

### 5. Switch frontend to real API

In `public/app.js`, change:
```js
const USE_STUB = false;
const API_BASE = 'http://localhost:3000';
```

---

## 🐳 Docker (Optional — Day 3)

```bash
docker-compose up -d
# PostgreSQL on port 5432
# API on port 3000
```

---

## 📁 Project Structure

```
Cloud_Project/
├── public/                     ← Member 1 — Frontend
│   ├── landing.html            ← Public home page
│   ├── landing.css             ← Landing page styles
│   ├── login.html              ← Login + Signup
│   ├── dashboard.html          ← Protected 4-tab dashboard
│   ├── app.js                  ← All dashboard logic
│   └── style.css               ← Dashboard design system
│
├── src/                        ← Member 2 — Backend
│   ├── index.js                ← Express entry point
│   ├── db/
│   │   └── pool.js             ← PostgreSQL pool config
│   ├── routes/
│   │   ├── binRouter.js        ← /api/bins routes
│   │   └── routeRouter.js      ← /api/route routes
│   └── services/
│       ├── binService.js       ← Simulation + DB queries
│       ├── routeService.js     ← Priority + route logic (Member 4)
│       ├── predictionService.js← Fill prediction (Member 4)
│       └── alertEngine.js      ← Overflow alerts (Member 4)
│
├── db/                         ← Member 3 — Database
│   ├── schema.sql              ← CREATE TABLE statements
│   ├── seed.sql                ← 22 GIFT City bins
│   └── migrations/
│       └── 001_add_indexes.sql
│
├── docker-compose.yml          ← Member 3 — Docker
├── .env.example                ← Copy to .env (never commit .env)
├── .gitignore
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose | Owner |
|--------|----------|---------|-------|
| `GET` | `/api/bins` | All bins with fill + priority | Member 2 |
| `POST` | `/api/bins/simulate` | Generate new fill data | Member 2 |
| `GET` | `/api/route/today` | Today's optimised route | Lead |
| `GET` | `/api/route/predictions` | Overflow predictions | Member 4 |
| `GET` | `/api/health` | Health check | Member 2 |

---

## 🧠 Priority Formula (Member 4)

```
priority = (fill_pct × 0.1) + urgency_noise(0–2)
```
- Bins scoring **≥ 7.0** qualify for today's route
- Top **10** selected as route candidates
- Visit order via **greedy nearest-neighbour**: `score = 0.6 × normFill − 0.4 × normDist`

---

## 🎤 5-Step Demo Script

1. Open dashboard → show bin table with fill levels
2. Click **Run Simulation** → watch map markers change colour
3. Point to colour-coded markers (🟢 <40%, 🟡 40–75%, 🔴 >75%)
4. Show route sidebar + dashed polyline — explain greedy ordering
5. Simulate again → new data, new route. System adapts instantly.

**Expected question:** *"How is priority calculated?"*  
**Answer:** "Fill% × 0.1 + urgency(0–2). Above 7.0 enters the route, ordered by waste urgency (60%) plus proximity (40%)."

---

## 👥 Team

| Member | Role | Deliverable |
|--------|------|-------------|
| **Member 1** | Frontend Developer | Landing page, login/signup, 4-tab dashboard |
| **Member 2** | Backend Developer | Express API, simulation service, CORS |
| **Member 3** | Database & Deployment | PostgreSQL schema, seed, Docker |
| **Member 4** | Logic, AI & Extras | Priority formula, route algorithm, predictions, alerts |

---

*SmartWaste — GIFT City ♻ | v2.0 | Integration-First Build*
