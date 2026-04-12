# ♻ SmartWaste — PROJECT CONTEXT
> Cloud-Based Waste Collection Optimization System
> **City:** Gandhinagar GIFT City | **Sprint:** 3-Day Rapid Prototype | **Team Size:** 4 Members | **Version:** v2.0

---

## 1. What is SmartWaste?

SmartWaste replaces fixed garbage collection schedules with a **data-driven dispatch system**. Instead of sending trucks on fixed routes regardless of bin fill levels, the system:

1. Continuously **simulates** (or in production, reads from IoT sensors) the fill level of every bin across a city zone
2. **Computes a priority score** for each bin based on fill level + urgency factor
3. **Produces an optimized, ordered collection route** that drivers can act on immediately

**Goal of the Prototype:** Make every part connect end-to-end and demo it convincingly. A running, explainable system — not perfect code.

> 📌 **Integration-First Principle:** Every member builds their piece so it connects cleanly to the others. No component is an island. We integrate continuously — not just on Day 3.

---

## 2. The Problem Being Solved

Current municipal waste systems use fixed schedules — every bin is collected at the same time regardless of fill level. This causes:

- **Over-collection** — trucks visit empty bins, wasting fuel and labour
- **Under-collection** — bins overflow before the next scheduled visit
- **No visibility** — operations teams can't tell which areas need attention without physical inspection
- **No adaptability** — local events (markets, festivals) that fill bins early are invisible to the system

---

## 3. System Architecture

SmartWaste is a **three-tier web application**:

| Tier | Technology | Responsibility |
|------|-----------|----------------|
| **Frontend** | HTML + Tailwind CSS + Vanilla JS | UI. Fetches data from the API and renders bin list, fill levels, priority scores, and today's route. No business logic. |
| **Backend** | Node.js + Express | Business logic. Exposes REST API endpoints. Handles simulation, priority calculation, and route generation. Talks to the DB. |
| **Database** | PostgreSQL | Persistent storage. Holds bin metadata and historical fill records. Queried by backend only — frontend never talks to DB directly. |

### Request Flow (Simulate button click → UI update)

```
User clicks Simulate
  → POST /api/bins/simulate to Express
    → Simulation service generates random fill values
      → New fill values written to PostgreSQL (fill_history table)
        → Express returns fresh bin data (id, location, fill%) as JSON
          → Browser re-renders bin table
            → Browser calls GET /api/route/today
              → Express reads bins from DB, sorts by priority
                → Browser renders route list with urgency highlights
```

---

## 4. API Contract

> ⚠️ **This is the handshake between Member 1 (Frontend) and Member 2 (Backend). Field names must NEVER change without immediate team communication. A silent field rename breaks the UI with no error.**

| Method | Endpoint | Purpose | Response Shape |
|--------|----------|---------|----------------|
| `GET` | `/api/bins` | Fetch all bins with current fill % and priority | `[{ id, location, fill_pct, priority }]` |
| `POST` | `/api/bins/simulate` | Generate new random fill data for all bins | `{ message: "ok", bins: [...] }` |
| `GET` | `/api/route/today` | Return sorted priority route for today | `[{ id, location, fill_pct, priority, rank }]` |

These shapes are **locked on Day 1** during the end-of-day sync. Any change after that requires both Member 1 and Member 2 to update simultaneously.

---

## 5. Core Business Logic

### Simulation
```js
function simulateBins(bins) {
  return bins.map(bin => ({
    ...bin,
    fill_pct: parseFloat((Math.random() * 100).toFixed(2))
  }));
}
```
> Simulation output **must be written to the database** — the routing endpoint reads from DB, so in-memory-only simulation produces stale routes.

### Priority Calculation
```
priority = (fill_pct × 0.1) + random(0, 2)
```
- `fill_pct × 0.1` → converts fill % to a 0–10 scale (80% fill = 8.0)
- `random(0, 2)` → injects urgency noise (weather, proximity, overflow risk)
- **Combined range:** 0 to 12
- **Threshold:** Bins scoring **≥ 7.0** are included in today's route

### Route Generation
```js
function generateRoute(bins, threshold = 7.0, topN = 10) {
  return bins
    .filter(bin => bin.priority >= threshold)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, topN)
    .map((bin, index) => ({ ...bin, rank: index + 1 }));
}
```

---

## 6. Project Folder Structure

```
smartwaste/
├── src/
│   ├── index.js                ← Express entry point          [Member 2]
│   ├── db/
│   │   └── pool.js             ← pg Pool config               [Member 2]
│   ├── routes/
│   │   ├── binRouter.js        ← /api/bins routes             [Member 2]
│   │   └── routeRouter.js      ← /api/route routes            [Lead]
│   └── services/
│       ├── binService.js       ← simulation + DB queries      [Member 2]
│       ├── routeService.js     ← priority + route logic       [Lead + Member 4]
│       ├── predictionService.js← optional fill prediction     [Member 4]
│       └── alertEngine.js      ← optional overflow alerts     [Member 4]
├── public/                     ← *** MEMBER 1 OWNS THIS ENTIRELY ***
│   ├── index.html              ← entire frontend UI
│   ├── app.js                  ← all fetch calls + DOM rendering
│   └── style.css               ← custom styles beyond Tailwind
├── db/
│   ├── schema.sql              ← CREATE TABLE statements      [Member 3]
│   ├── seed.sql                ← 20+ seeded bins              [Member 3]
│   └── migrations/             ← schema changes post Day 1   [Member 3]
├── .env                        ← DB credentials — NEVER commit to Git
├── .gitignore
├── docker-compose.yml          ← optional Docker             [Member 3]
├── README.md                   ← run instructions            [Lead]
└── package.json
```

---

## 7. Team Roles & Responsibilities

### 👑 Lead — System Lead + Integration Owner
- **Owns:** `routeService.js`, `routeRouter.js`, `errorHandler.js`, `README.md`
- **Interfaces with Member 1:** Provides stub API on Day 1 (hardcoded JSON) so frontend can build immediately without waiting for real backend. Must confirm stub URL is accessible.
- **Interfaces with Member 2:** Coordinates route endpoint integration with simulation data on Day 2.
- **Interfaces with Member 4:** Plugs `calculatePriority()` and `generateRoute()` into the live route service.

### 💻 Member 1 — Frontend Developer *(MY ROLE)*
- **Owns:** `public/index.html`, `public/app.js`, `public/style.css`
- **Interfaces with Lead:** Uses stub API on Day 1 to build and test UI without real backend. Confirms stub response shapes match the API contract.
- **Interfaces with Member 2:** Switches fetch calls to real API on Day 2. Reports any mismatches in field names or response structures immediately.
- **Interfaces with Member 4 (optional):** If alert engine is built on Day 3, renders alert banners for bins above 90% fill.
- **My rule:** Never wait for the real API to start building. Use stubs and swap in the real thing on Day 2.

### ⚙️ Member 2 — Backend Developer
- **Owns:** `src/index.js`, `binRouter.js`, `binService.js`, `db/pool.js`
- **Interfaces with Member 1:** Shares localhost URL + stub JSON on Day 1. Gives advance notice of any field name changes. Adds CORS headers so Member 1's frontend can call the API.
- **Interfaces with Member 3:** Receives the DB connection string + schema on Day 1. Uses Member 3's latest-fill query for `/api/bins`.
- **Interfaces with Lead/Member 4:** Integrates `calculatePriority()` and `generateRoute()` into the route service on Day 2.

### 🗄️ Member 3 — Database & Deployment
- **Owns:** `db/schema.sql`, `db/seed.sql`, `db/migrations/`, `docker-compose.yml`
- **Interfaces with Member 2:** Shares DB connection string on Day 1. Provides the latest-fill-per-bin JOIN query on Day 2. Communicates any schema changes via `db/migrations/`.
- **Interfaces with all members:** If deploying to cloud on Day 3, shares the new connection string with everyone.

### 🧠 Member 4 — Logic, AI & Extras
- **Owns:** `routeService.js` (co-owned with Lead), `predictionService.js`, `alertEngine.js`
- **Interfaces with Lead:** Hands off `calculatePriority()` and `generateRoute()` as drop-in functions on Day 1.
- **Interfaces with Member 1 (optional):** If alert engine is ready on Day 3, defines the alert object shape so Member 1 can render it. Shape: `{ bin_id, location, fill_pct, alert: "OVERFLOW_RISK" }`.

---

## 8. Integration Touchpoints — Day by Day

> 🔑 **Golden Rule:** Never block on a teammate. Build against a stub, then swap in the real implementation. This is how professional teams work.

---

### Day 1 — Foundation & Stubs
**Goal:** Every member has something running. All stubs are in place so no one is blocked.

| Who | What to deliver | Hands off to |
|-----|----------------|-------------|
| **Lead** | Repo created, folder structure set up, stub API running on `localhost:3000` returning hardcoded JSON for all 3 endpoints | → **Member 1** (can now build UI against stubs) |
| **Member 1 (me)** | Static HTML dashboard with Tailwind. Bins table populated from hardcoded JSON. Simulate button present. Fetch calls wired to stub API URL. | → Confirm stub shapes match API contract with **Lead + Member 2** |
| **Member 2** | Express server running. All 3 endpoints return stub JSON. CORS enabled. Share `localhost:3000` URL. | → **Member 1** (frontend can switch to this) |
| **Member 3** | PostgreSQL running. `schema.sql` + `seed.sql` executed. 20+ bins in DB. Connection string shared. | → **Member 2** |
| **Member 4** | `calculatePriority()` + `generateRoute()` written as standalone functions with 5+ test cases passing. | → **Lead** (to plug into route service) |

> 📋 **End-of-Day 1 Sync (15 min — everyone shows screen):**
> - Lead confirms stub API is live and accessible from Member 1's browser
> - Member 1 confirms table renders correctly from stub data
> - Member 2 confirms CORS is working
> - Member 3 confirms Member 2 can connect to the DB
> - **Lock the API response shapes — no field changes after this without full-team notice**

---

### Day 2 — Integration & Real Data
**Goal:** Real data flowing through the entire system. Simulate button triggers actual DB writes and live UI updates.

| Who | What to deliver | Hands off to |
|-----|----------------|-------------|
| **Lead** | Route endpoint connected to real DB. Priority engine using real bin data. Full flow tested end-to-end. | Coordinates with everyone |
| **Member 1 (me)** | Fetch calls switched from stub to real API. Colour-coded fill level badges. Route panel rendered. Both tables update on Simulate click. | Report any field mismatch to **Member 2** immediately |
| **Member 2** | Simulation writes to `fill_history`. `/api/bins` reads latest fill via JOIN. All endpoints return live data. | → **Member 1** (real API ready) |
| **Member 3** | Confirm DB writes are correct post-simulation. Provide Member 2 with latest-fill JOIN query. Optionally start Docker setup. | → **Member 2** |
| **Member 4** | Functions integrated into route service. Verify different simulations produce different routes. Start prediction service if time allows. | → **Lead** |

> 📋 **End-of-Day 2 Sync (run the full demo flow together):**
> - Click Simulate 3 times
> - Confirm bin table updates each time
> - Confirm route panel changes each time
> - If route doesn't change → simulation isn't writing to DB correctly → Member 2 + Member 3 debug together
> - If UI doesn't update → check fetch calls + CORS → Member 1 + Member 2 debug together

---

### Day 3 — Polish, Hardening & Demo Prep
**Goal:** Demo-ready. Clean, no crashes, fully explainable.

| Who | What to deliver | Coordinates with |
|-----|----------------|-----------------|
| **Lead** | All integration bugs fixed. Demo rehearsed twice. README updated with run instructions. | Everyone |
| **Member 1 (me)** | Loading spinner during fetches. Error states handled (API down, empty route). Tested on Chrome, Firefox, mobile viewport. Zero console errors. | If Member 4 has alerts ready → render alert banners |
| **Member 2** | Correct HTTP status codes (400, 404, 500). Server doesn't crash on bad input. CORS configured for demo URL. | → **Member 1** (confirm demo URL works from frontend) |
| **Member 3** | DB stable and accessible. Test clean start from `docker-compose up` if Docker is set up. Optional cloud deployment. | → Share new connection string with all if deploying to cloud |
| **Member 4** | Alert engine (optional): bins above 90% trigger alert object in API response. Prepare 2-min priority explanation for demo. | → **Member 1** (alert shape: `{ bin_id, location, fill_pct, alert: "OVERFLOW_RISK" }`) |

---

## 9. Member 1 — Frontend Integration Checklist

### API Integration Points
```js
// Pattern for ALL fetch calls in app.js
document.getElementById('simulate-btn').addEventListener('click', async () => {
  // Step 1: Trigger simulation (writes to DB)
  await fetch('/api/bins/simulate', { method: 'POST' });

  // Step 2: Fetch updated bin data
  const bins = await fetch('/api/bins').then(r => r.json());

  // Step 3: Fetch updated route
  const route = await fetch('/api/route/today').then(r => r.json());

  // Step 4: Re-render both panels
  renderBinsTable(bins);
  renderRoutePanel(route);
});
```

### UI Components & Data Sources

| Component | Data Fields | Source Endpoint | Endpoint Owner |
|-----------|------------|-----------------|---------------|
| Bin status table | `id`, `location`, `fill_pct`, `priority` | `GET /api/bins` | Member 2 |
| Today's route list | `rank`, `id`, `location`, `fill_pct`, `priority` | `GET /api/route/today` | Lead |
| Simulate button | none | `POST /api/bins/simulate` | Member 2 |
| Fill level badge | `fill_pct` | Derived locally | — |
| Alert banners (optional) | `bin_id`, `location`, `fill_pct`, `alert` | Embedded in route response | Member 4 |

### Fill Level Colour Coding
| fill_pct | Colour | Tailwind Classes | Meaning |
|----------|--------|-----------------|---------|
| < 40% | 🟢 Green | `bg-green-100 text-green-700` | Low — skip |
| 40–75% | 🟡 Amber | `bg-amber-100 text-amber-700` | Monitor |
| > 75% | 🔴 Red | `bg-red-100 text-red-700` | Critical — in route |

### Day-by-Day Task Checklist

**Day 1**
- [ ] Build static HTML shell with Tailwind layout
- [ ] Create bins table with hardcoded placeholder rows
- [ ] Add Simulate button (no real API yet)
- [ ] Wire fetch calls to Lead's stub API — confirm table renders
- [ ] Attend end-of-day sync — confirm stub shapes, lock API contract

**Day 2**
- [ ] Switch all fetch calls to Member 2's real API
- [ ] Implement colour-coded fill level badges
- [ ] Build route panel (second table with rank + priority)
- [ ] Confirm both panels update on Simulate click
- [ ] Report any `field_name` mismatches to Member 2 immediately
- [ ] Attend end-of-day sync — run demo flow 3 times together

**Day 3**
- [ ] Add loading spinner while fetches are in progress
- [ ] Handle error states (API down → show message; empty route → show "No bins require collection today")
- [ ] Test on Chrome, Firefox, mobile viewport
- [ ] Zero console errors in Chrome DevTools
- [ ] If Member 4's alert engine is ready → render warning banners for `OVERFLOW_RISK` bins
- [ ] Rehearse demo script with the team

---

## 10. Demo Script (5 Steps)

| # | Action | What to say |
|---|--------|------------|
| 1 | Open dashboard, show bin table | "This is our SmartWaste dashboard. It shows all bins in the GIFT City zone with their current fill level and priority score." |
| 2 | Click Simulate | "We click Simulate. This would normally read from IoT sensors — in our prototype, it generates realistic fill data. Watch the fill levels change." |
| 3 | Point to colour-coded levels | "Green bins are under 40% — we skip those. Amber bins need monitoring. Red bins above 75% are critical and automatically enter today's route." |
| 4 | Scroll to route panel | "This is today's optimized route. The system has ranked the top priority bins. A driver follows this order — no wasted stops, no missed overflows." |
| 5 | Click Simulate again | "If I simulate again — new data, new route. The system adapts instantly. No human intervention required." |

> ✅ **Anticipated question:** *"How is the priority calculated?"*
> **Answer:** "Priority equals fill percentage scaled to a 0–10 range, plus a small randomised urgency factor between 0 and 2. Bins scoring above 7 are included in today's route, sorted highest first."

---

## 11. Definition of Done

The project is complete when ALL five are true:

- [ ] Simulate button generates new fill data and writes it to the database
- [ ] Bin table in the UI updates immediately after simulation
- [ ] Route panel shows a sorted list of high-priority bins
- [ ] Route changes when Simulate is run again
- [ ] Any team member can explain the priority formula to an evaluator without checking notes

---

## 12. Non-Negotiable Rules

| ✅ DO | ❌ DO NOT |
|-------|----------|
| Build stubs first, then replace with real logic | Wait for another member to finish before starting |
| Test each endpoint with curl before wiring to UI | Build full ML models or complex AI |
| Communicate schema/field changes immediately | Change API response shapes without telling the team |
| Commit code at end of each day | Depend on AWS or cloud service until Day 3 |
| Run full demo flow together at end of Day 2 | Save debugging for Day 3 morning |
| Keep `.env` out of Git | Hardcode credentials in source files |

---

## 13. Common Integration Failures & Prevention

| Failure | Root Cause | Who Fixes It |
|---------|-----------|-------------|
| Route doesn't change after Simulate | Simulation not writing to DB | Member 2 + Member 3 |
| UI shows empty table | CORS missing or field name mismatch | Member 1 + Member 2 |
| API returns 500 on demo machine | DB not connected on demo machine | Member 2 + Member 3 |
| Fill levels don't colour-code | Wrong field name (`fill` vs `fill_pct`) | Member 1 checks contract with Member 2 |
| Route panel empty even after simulate | Priority threshold too high, or route endpoint not reading from DB | Lead + Member 4 |

---

*SmartWaste — GIFT City ♻ | v2.0 | 3-Day Rapid Prototype | Integration-First Build*
