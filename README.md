# 🛒 PROJECT NOVA — E-Commerce + Cybersecurity Lab

<div align="center">

![Project NOVA](https://img.shields.io/badge/PROJECT-NOVA-00d4ff?style=for-the-badge&logo=lightning&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Required-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)

**A realistic full-stack e-commerce platform with an integrated cybersecurity demonstration lab, built for hackathon.**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Application URLs](#application-urls)
- [Database Setup & Management](#database-setup--management)
- [Security Lab](#security-lab)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Overview

**PROJECT NOVA** is a full-stack e-commerce application that doubles as a cybersecurity education platform. It features:

- **📦 Nova Store** — A polished, realistic online shop with product listings, shopping cart, user authentication, and order management.
- **🔐 Security Lab** — An integrated, intentionally-vulnerable backend (`/security-lab`) for live demonstrations of OWASP Top 10 vulnerabilities — **SQL Injection, XSS, Broken Auth, IDOR, Mass Assignment**, and more — side-by-side with their secure counterparts.

The project is designed to show that the same business logic can be implemented both **insecurely** (vulnerable demo) and **securely** (production-quality), making it ideal for hackathon demonstrations around application security and developer awareness.

---

## 🏗 Architecture

```
nova-ecommerce/
│
├── frontend/                  # React 18 + Vite — Main e-commerce UI
│   └── ...                    # Also hosts /security-lab route
│
├── backend/                   # Node.js + Express — Secure production API
│   ├── src/
│   │   ├── routes/            # Auth, products, cart, orders
│   │   ├── middleware/        # JWT auth, rate limiting, validation
│   │   ├── db/                # PostgreSQL pool + query helpers
│   │   └── utils/             # Logging, helpers
│   └── package.json
│
├── security-lab/
│   ├── backend/               # Node.js + Express — Deliberately vulnerable API
│   │   ├── src/
│   │   │   ├── vulnerable/    # ⚠️ Intentionally broken endpoints
│   │   │   └── secure/        # ✅ Fixed equivalents for comparison
│   │   └── package.json
│   └── frontend/              # React lab UI (embedded in main frontend)
│
├── database/
│   ├── schema.sql             # Full DB schema
│   ├── seed.sql               # Base product & user data
│   └── demo_seed.sql          # Lab-specific demo data
│
├── docker-compose.yml         # PostgreSQL service
├── package.json               # Root orchestration scripts
├── .env.example               # Environment variable template
└── README.md
```

**Request Flow:**

```
Browser
  ├── http://localhost:3000        → React Frontend (Vite Dev Server)
  │     ├── /                     → Nova Store UI
  │     └── /security-lab         → Security Lab UI
  │
  ├── http://localhost:5000/api   → Secure Backend (Express)
  │     └── Connects to PostgreSQL (nova_admin role)
  │
  └── http://localhost:5001/lab   → Lab Backend (Express, vulnerable)
        └── Connects to PostgreSQL (nova_demo_readonly role)
```

---

## ✅ Prerequisites

Make sure you have the following installed **before** you begin:

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 18+ (LTS recommended) | https://nodejs.org |
| **npm** | 9+ (bundled with Node.js) | — |
| **Docker Desktop** | Latest | https://www.docker.com/products/docker-desktop |
| **Docker Compose** | v2 (bundled with Docker Desktop) | — |
| **Git** | Any recent version | https://git-scm.com |

Verify your environment:

```bash
node --version    # Should print v18.x.x or higher
npm --version     # Should print 9.x.x or higher
docker --version  # Should print Docker version 24.x.x or higher
docker compose version  # Should print v2.x.x
```

---

## 🛠 Installation

### 1. Clone the repository

```bash
git clone <your-repo-url> nova-ecommerce
cd nova-ecommerce
```

### 2. Configure environment variables

```bash
# Copy the example env file
cp .env.example .env
```

Open `.env` in your editor. The defaults work for local development — **change `JWT_SECRET` and `SESSION_SECRET`** to long random strings if you plan to expose this beyond localhost:

```bash
# On Linux/macOS you can generate secrets with:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Install all dependencies

From the project root, install dependencies for all workspaces at once:

```bash
npm run install:all
```

This runs `npm install` inside `backend/`, `security-lab/backend/`, `frontend/`, and `security-lab/frontend/`.

---

## ▶️ Running the Application

### Step 1 — Start the database

```bash
npm run db:up
```

This starts a PostgreSQL 15 container (`nova-postgres`) in the background. On first start, Docker will automatically run the SQL files in `database/` to create the schema and seed data. This takes about **10–20 seconds**.

Wait for the database to be healthy:

```bash
npm run db:logs
# Watch for: "database system is ready to accept connections"
# Press Ctrl+C to stop following logs
```

### Step 2 — Start all application servers

```bash
npm run dev
```

This starts three processes concurrently:
- **Main backend** on port `5000`
- **Security Lab backend** on port `5001`
- **React frontend** on port `3000`

You'll see colour-coded output from all three processes in the same terminal window.

### Alternative — Start services individually

```bash
# Backend only
npm run dev:backend

# Security Lab backend only
npm run dev:lab

# Frontend only
npm run dev:frontend
```

---

## 🌐 Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Nova Store** | http://localhost:3000 | Main e-commerce UI |
| **Security Lab UI** | http://localhost:3000/security-lab | Lab interface (served by frontend) |
| **Secure API** | http://localhost:5000/api | Production-quality backend API |
| **Lab API** | http://localhost:5001/lab | Vulnerable demo backend API |
| **API Health Check** | http://localhost:5000/api/health | Backend status |
| **Lab Health Check** | http://localhost:5001/lab/health | Lab status |

### Default Demo Accounts

After seeding, the following accounts are available for testing:

| Role | Email | Password |
|------|-------|----------|
| Customer | `alice@example.com` | `Password123!` |
| Customer | `bob@example.com` | `Password123!` |
| Admin | `admin@nova.store` | `Admin@Nova2024!` |

> ⚠️ These credentials are for local development only. Never use them in any public or production environment.

---

## 🗄 Database Setup & Management

The database is fully managed via Docker. SQL init scripts in `database/` are run automatically on first container start.

### Database Commands

```bash
# Start PostgreSQL container
npm run db:up

# Stop PostgreSQL container (data is preserved in Docker volume)
npm run db:down

# ⚠️  HARD RESET — destroys ALL data and re-seeds from scratch
npm run db:reset

# Follow live database logs
npm run db:logs
```

### Connecting manually with psql

If you have `psql` installed locally:

```bash
psql -h 127.0.0.1 -p 5432 -U nova_admin -d nova_db
# Password: <configured locally in .env>
```

Or connect via Docker:

```bash
docker exec -it nova-postgres psql -U nova_admin -d nova_db
```

### Database Schema Overview

| Table | Purpose |
|-------|---------|
| `users` | Customer and admin accounts |
| `products` | Product catalog with categories, pricing, stock |
| `product_images` | Product image URLs |
| `categories` | Product category hierarchy |
| `cart_items` | Per-user shopping cart |
| `orders` | Order headers |
| `order_items` | Line items for each order |
| `reviews` | Product reviews and ratings |
| `coupons` | Discount codes |
| `sessions` | Server-side session store |
| `audit_log` | Security event audit trail |

---

## 🔐 Security Lab

> [!CAUTION]
> The Security Lab backend (`security-lab/backend/`) contains **deliberately vulnerable code** for educational demonstration purposes.
>
> **DO NOT expose port 5001 to the internet or any network you do not fully control.** This server is designed to be exploitable and must only run on `localhost` during live demos.

### What the Lab Demonstrates

The Security Lab provides paired endpoints — a **vulnerable** version and a **secure** version — for each attack category:

| Vulnerability | OWASP Category | Lab Endpoint |
|--------------|---------------|--------------|
| SQL Injection | A03: Injection | `/lab/vuln/search` vs `/lab/secure/search` |
| Stored XSS | A03: Injection | `/lab/vuln/reviews` vs `/lab/secure/reviews` |
| Broken Authentication | A07: Auth Failures | `/lab/vuln/login` vs `/lab/secure/login` |
| IDOR | A01: Broken Access Control | `/lab/vuln/orders/:id` vs `/lab/secure/orders/:id` |
| Mass Assignment | A08: Data Integrity | `/lab/vuln/profile` vs `/lab/secure/profile` |
| Sensitive Data Exposure | A02: Cryptographic Failures | `/lab/vuln/users` vs `/lab/secure/users` |

### Using the Lab

1. Open http://localhost:3000/security-lab in your browser.
2. Select a vulnerability category from the sidebar.
3. The UI shows the vulnerable request panel on the left and secure panel on the right.
4. Try the suggested payloads in the vulnerable panel to see the attack succeed.
5. Try the same payload in the secure panel to see it blocked.
6. The source code diff for each pair is shown inline for educational context.

### Lab Architecture Notes

- The lab backend runs with a **read-only database role** (`nova_demo_readonly`) for most operations to limit blast radius.
- SQL Injection demos use a separate, isolated demo schema with synthetic data — **no real user data is used**.
- The lab backend only binds to `127.0.0.1`, not `0.0.0.0`.
- All lab endpoints require the `X-Lab-Key` header matching `LAB_SECRET_KEY` from `.env` — this prevents accidental exposure even if the port is reachable.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Node environment (`development` / `production`) |
| `PORT` | `5000` | Main backend port |
| `LAB_PORT` | `5001` | Security Lab backend port |
| `FRONTEND_PORT` | `3000` | React dev server port |
| `DB_HOST` | `127.0.0.1` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `nova_db` | Database name |
| `DB_USER` | `nova_admin` | Database superuser role |
| `DB_PASSWORD` | `<configured locally in .env>` | Database password |
| `DB_DEMO_USER` | `nova_demo_readonly` | Read-only role for lab |
| `DB_DEMO_PASSWORD` | `<configured locally in .env>` | Read-only role password |
| `JWT_SECRET` | *(must set)* | Secret for signing JWT tokens — minimum 64 characters |
| `SESSION_SECRET` | *(must set)* | Secret for Express session middleware |
| `BCRYPT_ROUNDS` | `12` | bcrypt hash rounds for password hashing |
| `ENABLE_DEMO_LAB` | `true` | Enables the security lab backend (`true` / `false`) |
| `LAB_SECRET_KEY` | `<configured locally in .env>` | Shared secret for lab endpoint access |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin for backend |
| `LOG_FILE` | `./logs/app.log.jsonl` | Path to JSON-Lines log file |
| `LOG_LEVEL` | `info` | Logging level (`debug` / `info` / `warn` / `error`) |

> [!IMPORTANT]
> You **must** change `JWT_SECRET` and `SESSION_SECRET` to strong, unique, random values before using this in any demo scenario where the URLs are publicly reachable. The defaults in `.env.example` are not secret.

---

## 🧪 Testing

### Run all tests

```bash
npm test
```

### Run backend API tests only

```bash
npm run test:api
```

### Run Security Lab tests only

```bash
npm run test:security
```

Tests use **Jest** with **Supertest** for HTTP integration testing. The backend test suite covers:
- Auth flows (register, login, JWT refresh)
- Product listing and search
- Cart operations
- Order creation and retrieval
- Input validation edge cases

The security lab test suite verifies:
- That vulnerable endpoints are genuinely exploitable (sanity checks)
- That secure endpoints correctly block each attack vector

---

## 📁 Project Structure (Full)

```
nova-ecommerce/
├── .env.example                   # Environment template
├── .gitignore
├── docker-compose.yml             # PostgreSQL service definition
├── package.json                   # Root workspace orchestration
├── README.md
│
├── logs/
│   └── .gitkeep                   # Ensures logs/ directory is tracked by git
│
├── database/
│   ├── schema.sql                 # CREATE TABLE statements
│   ├── seed.sql                   # Products, categories, demo users
│   └── demo_seed.sql              # Lab-specific synthetic data
│
├── backend/                       # ✅ Secure production API
│   ├── package.json
│   ├── src/
│   │   ├── index.js               # Express app entry point
│   │   ├── app.js                 # App factory (middleware, routes)
│   │   ├── config.js              # Env var validation & config object
│   │   ├── db/
│   │   │   ├── pool.js            # pg Pool instance
│   │   │   └── queries.js         # Parameterised query helpers
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification middleware
│   │   │   ├── validate.js        # Joi/Zod request validation
│   │   │   ├── rateLimiter.js     # express-rate-limit config
│   │   │   └── errorHandler.js    # Centralised error handler
│   │   ├── routes/
│   │   │   ├── auth.js            # POST /api/auth/register, /login, /logout
│   │   │   ├── products.js        # GET /api/products, /api/products/:id
│   │   │   ├── cart.js            # GET/POST/DELETE /api/cart
│   │   │   ├── orders.js          # GET/POST /api/orders
│   │   │   └── health.js          # GET /api/health
│   │   └── utils/
│   │       ├── logger.js          # Winston JSON-Lines logger
│   │       └── asyncHandler.js    # Async route wrapper (no try/catch boilerplate)
│   └── tests/
│       ├── auth.test.js
│       ├── products.test.js
│       └── orders.test.js
│
├── security-lab/
│   ├── backend/                   # ⚠️ Deliberately vulnerable API
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── app.js
│   │       ├── db/
│   │       │   └── pool.js        # Uses nova_demo_readonly role
│   │       ├── vulnerable/        # ⚠️ Intentionally broken endpoints
│   │       │   ├── sqli.js        # SQL injection demo
│   │       │   ├── xss.js         # Stored XSS demo
│   │       │   ├── auth.js        # Broken auth demo
│   │       │   ├── idor.js        # IDOR demo
│   │       │   └── massAssign.js  # Mass assignment demo
│   │       └── secure/            # ✅ Fixed versions for comparison
│   │           ├── sqli.js
│   │           ├── xss.js
│   │           ├── auth.js
│   │           ├── idor.js
│   │           └── massAssign.js
│   └── frontend/                  # Lab UI (built into main frontend)
│
└── frontend/                      # React 18 + Vite main UI
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── ProductList.jsx
        │   ├── ProductDetail.jsx
        │   ├── Cart.jsx
        │   ├── Checkout.jsx
        │   ├── OrderHistory.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── SecurityLab/       # /security-lab route
        │       ├── LabDashboard.jsx
        │       ├── SqlInjectionLab.jsx
        │       ├── XssLab.jsx
        │       ├── AuthLab.jsx
        │       ├── IdorLab.jsx
        │       └── MassAssignLab.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProductCard.jsx
        │   ├── CartDrawer.jsx
        │   └── lab/
        │       ├── LabLayout.jsx
        │       ├── VulnPanel.jsx
        │       └── SecurePanel.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   └── useCart.js
        ├── store/                 # Zustand state management
        │   ├── authStore.js
        │   └── cartStore.js
        └── api/
            ├── client.js          # Axios instance + interceptors
            ├── auth.js
            ├── products.js
            └── lab.js
```

---

## 🔧 Troubleshooting

### Docker / Database Issues

**Problem:** `npm run db:up` fails with "port 5432 already in use"

```bash
# Check what's using port 5432
netstat -ano | findstr :5432    # Windows
lsof -i :5432                   # macOS/Linux

# If another PostgreSQL instance is running locally, either stop it
# or change DB_PORT in .env and update the docker-compose.yml port mapping
```

**Problem:** Database container starts but schema/seed don't load

```bash
# Check init script logs
npm run db:logs

# If the volume exists from a previous run, the init scripts won't re-run.
# Hard reset to start fresh:
npm run db:reset
```

**Problem:** `ECONNREFUSED` errors from the backend connecting to the database

- Ensure `DB_HOST=127.0.0.1` in `.env` (not `localhost`, which may resolve to IPv6 `::1`)
- Ensure the database healthcheck is passing: `docker inspect nova-postgres | grep Status`

---

### Application Issues

**Problem:** `npm run install:all` fails for one of the workspaces

Install that workspace individually:

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix security-lab/backend
npm install --prefix security-lab/frontend
```

**Problem:** Frontend fails to proxy API requests (404 on `/api/...`)

- Confirm the backend is running on port `5000`
- Check `frontend/vite.config.js` proxy settings — it should forward `/api` to `http://localhost:5000`

**Problem:** Security lab endpoints return `403 Forbidden`

- Make sure `ENABLE_DEMO_LAB=true` is set in `.env`
- Requests to the lab API must include the header `X-Lab-Key: <LAB_SECRET_KEY value from .env>`

---

### Log Files

Application logs are written in JSON-Lines format to `logs/app.log.jsonl`. You can tail them with:

```bash
# PowerShell (Windows)
Get-Content -Wait -Tail 50 .\logs\app.log.jsonl

# macOS/Linux
tail -f logs/app.log.jsonl | jq '.'
```

---

## 🤝 Team

Built with ❤️ for **Kodikon 6.0** hackathon.

---

## ⚠️ Security Disclaimer

> [!CAUTION]
> **The `security-lab/backend/` directory contains intentionally vulnerable code.**
>
> This code is designed to be exploitable for educational demonstrations of OWASP Top 10 vulnerabilities.
>
> - **NEVER** deploy the security lab backend to any internet-accessible server.
> - **NEVER** expose port `5001` through a firewall, reverse proxy, or port forwarding.
> - **NEVER** use real user data or production databases with the lab backend.
> - This project is designed for **local development and controlled hackathon demos only**.
>
> The maintainers accept no responsibility for any use of the vulnerable lab code outside of its intended local educational context.

---

*PROJECT NOVA — Making security education hands-on and accessible.*
