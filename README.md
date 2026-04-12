# ♻ SmartWaste — GIFT City

> Cloud-Based Waste Collection Optimization System  
> **City:** Gandhinagar GIFT City | **Sprint:** Accelerated Prototype | **Team Size:** 4 Members | **v2.0**

---

## 🌐 Pages

| Page | Path | Description |
|------|------|-------------|
| **Home** | `/pages/home.html` | Public home page — features, how it works, team info |
| **Login** | `/pages/login.html` | Authentication access |
| **Signup** | `/pages/signup.html` | New user registration |
| **Dashboard** | `/pages/dashboard.html` | Protected map, charts, routing, and stats interface |

**Flow:** `home.html` → `login.html` → `dashboard.html` (protected)

---

## 🚀 How to Run

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
psql -U postgres -d smartwaste -f database/schema.sql
psql -U postgres -d smartwaste -f database/seed.sql
```

### 4. Start Server

By default, the Node server serves both API and frontend static files on port 3000.

```bash
npm run dev
# Server running at: http://localhost:3000
# Home Page: http://localhost:3000/pages/home.html
```

---

## 📁 Project Structure

```
Cloud_Project/
├── backend/                    ← Node.js + Express API
│   ├── controllers/            ← Logic for handling API requests
│   ├── middleware/             ← Auth & error handling
│   ├── routes/                 ← API endpoint definitions
│   ├── services/               ← Core business logic, routing algorithms
│   └── server.js               ← Entry point (serves API + Frontend)
│
├── frontend/                   ← Front-end Assets
│   ├── css/                    ← Modular stylesheets
│   ├── js/                     ← Frontend logic (dashboard, map layers, etc.)
│   └── pages/                  ← Application views (Home, Login, Dashboard, etc.)
│
├── database/                   ← PostgreSQL Setup
│   ├── migrations/
│   ├── queries/
│   ├── schema.sql              ← DB structures
│   └── seed.sql                ← Initial GIFT City bins and data
│
├── data/                       ← Local JSON data models / offline fallback
│   ├── bins.json
│   └── users.json
│
├── .env.example                ← Template for environment variables
├── package.json                ← NPM configuration
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/bins` | Retrieve all bins and current status |
| `POST`| `/api/bins/simulate` | Trigger real-time waste fill simulation |
| `GET` | `/api/route/today` | Fetch optimized daily collection route |
| `GET` | `/api/health` | Service health check |
| `POST`| `/api/auth/login` | User login |
| `POST`| `/api/auth/register`| User registration |

*(Note: API paths are routed through Express from `backend/routes/`)*

---

## 🧠 Smart Routing & Interactive Map

The route simulation prioritizes efficiency and urgency to prevent overflow scenarios:

1. **High-Fill Prioritization**: The system actively targets red-flagged bins (high-fill percentage, usually >75%). These are integrated into the primary collection sequence to ensure they are cleared before overflow, overriding simple distance mapping if their urgency is critical.
2. **Efficient Travel Distance**: Uses a weighted priority formula combining node proximity and waste urgency (e.g., greedy nearest-neighbour logic) ensuring fuel-efficient routing across the whole region rather than restrictive zone-by-zone clearing.
3. **Interactive Map Tools**: The dashboard map features live toggle controls for layers including **Satellite**, **Light**, and **Dark** modes for enhanced situational awareness and visual clarity.

---

## 👥 Team Responsibilities

| Member | Focus Area | Deliverables |
|--------|------------|--------------|
| **Member 1** | Frontend UI/UX | Home page, login/signup flows, multi-tab dashboard |
| **Member 2** | Backend API | Node/Express foundation, routing endpoints, simulation |
| **Member 3** | Database | Postgres schema, seeds, queries, and project deployment |
| **Member 4** | Advanced Logic | AI routing formula prioritization, map layer integration |

---

*SmartWaste — GIFT City ♻ | v2.0 | Integration-First Build*
