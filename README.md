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

### Option A: Using Docker (Recommended)

1. Make sure Docker Desktop is running.
2. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```
3. Initialize the database schema and sample data:
   **Windows (Command Prompt / PowerShell)**
   ```bash
   cmd.exe /c "docker exec -i smartwaste-db psql -U postgres -d smartwaste < database\schema.sql"
   cmd.exe /c "docker exec -i smartwaste-db psql -U postgres -d smartwaste < database\seed.sql"
   ```
   **Mac/Linux**
   ```bash
   docker exec -i smartwaste-db psql -U postgres -d smartwaste < database/schema.sql
   docker exec -i smartwaste-db psql -U postgres -d smartwaste < database/seed.sql
   ```
4. Access the application directly at [http://localhost/](http://localhost/).

---

### Option B: Local Development (Without Docker)

1. **Install dependencies**: `npm install`
2. **Configure environment**: `copy .env.example .env` (update with your PostgreSQL credentials)
3. **Set up PostgreSQL**:
   ```bash
   psql -U postgres -c "CREATE DATABASE smartwaste;"
   psql -U postgres -d smartwaste -f database/schema.sql
   psql -U postgres -d smartwaste -f database/seed.sql
   ```
4. **Start Server**:
   ```bash
   npm run dev
   # Server running at: http://localhost:3000
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
├── Dockerfile                  ← Multi-stage Node.js build config
├── docker-compose.yml          ← Orchestrates NodeJS and PostgreSQL containers
├── .dockerignore               ← Build exclusions
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
