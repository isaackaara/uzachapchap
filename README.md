# ⚡ UzaChapChap

> Multi-channel commerce platform for Instagram sellers in Kenya.
> Sell faster. Get paid smarter. Manage everything in one place.

---

## Overview

UzaChapChap helps Kenyan Instagram sellers manage products, customers, orders, and payments — all from a single dashboard. Connect your Instagram account, list products, and accept Paystack payments with automatic order tracking.

### Key Features
- 📸 **Instagram Integration** — Connect your IG account, sync posts as products, send DMs automatically
- 💰 **Paystack Payments** — Generate payment links, verify webhooks, track revenue
- 👥 **Customer CRM** — Track every buyer, flag VIPs, search contacts
- 📦 **Order Management** — Full lifecycle from pending → paid → fulfilled
- 📊 **Analytics Dashboard** — Revenue, orders count, top products at a glance
- 🤖 **Background Jobs** — Async IG caption updates and DM sends via job queue
- 🔐 **JWT Auth** — Access tokens (15m) + refresh tokens (7d) with rotation

---

## Project Structure

```
uzachapchap/
├── frontend/          # React + Vite + TypeScript SPA
├── backend/           # Node.js + Express + TypeScript API
├── shared/            # Shared TypeScript types
├── docker-compose.yml # Local PostgreSQL + pgAdmin
├── railway.json       # Railway deployment config
├── .env.example       # Root env template
└── README.md
```

---

## Quick Start

### 1. Start the Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port `5432` and pgAdmin on `http://localhost:5050`.
pgAdmin credentials: `admin@uzachapchap.com` / `admin`

### 2. Set Up Backend

```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your credentials
npm run migrate    # Run DB migrations
npm run dev        # Start dev server on port 3001
```

### 3. Set Up Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL should point to backend (default: http://localhost:3001)
npm run dev        # Start Vite dev server on port 5173
```

### 4. Open the App

Navigate to `http://localhost:5173` and register a seller account.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (min 32 chars) |
| `PAYSTACK_SECRET_KEY` | Paystack API secret key (`sk_live_...` or `sk_test_...`) |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack webhook signing secret |
| `INSTAGRAM_APP_ID` | Facebook/IG App ID |
| `INSTAGRAM_APP_SECRET` | Facebook/IG App Secret |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Token to verify IG webhook subscriptions |
| `SMTP_HOST` | SMTP host (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (e.g., `587`) |
| `SMTP_USER` | SMTP username/email |
| `SMTP_PASS` | SMTP password or app password |
| `FRONTEND_URL` | Frontend origin for CORS |
| `PORT` | Backend port (default `3001`) |

### Frontend (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

---

## API Routes

### Auth — `/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register seller, returns tokens |
| POST | `/login` | Login, returns tokens |
| POST | `/refresh` | Rotate refresh token |
| POST | `/logout` | Revoke refresh token |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Reset with token |

### Products — `/products` (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List products (`?status=`, `?page=`, `?limit=`) |
| POST | `/` | Create product |
| GET | `/:id` | Get product |
| PUT | `/:id` | Update product |
| DELETE | `/:id` | Soft delete (sets status=hidden) |
| PATCH | `/:id/mark-sold` | Mark sold, enqueue IG jobs |

### Customers — `/customers` (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (`?search=`, `?page=`, `?limit=`) |
| POST | `/` | Create customer |
| GET | `/:id` | Get customer |
| PUT | `/:id` | Update customer |
| DELETE | `/:id` | Delete customer |
| GET | `/:id/orders` | Get customer's orders |

### Orders — `/orders` (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (`?status=`, `?page=`, `?limit=`) |
| POST | `/` | Create order |
| GET | `/:id` | Get order |
| PUT | `/:id` | Update order |
| DELETE | `/:id` | Delete order |

### Channels — `/channels` (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List connected channels |
| DELETE | `/:id` | Disconnect channel |
| POST | `/instagram/connect` | Exchange OAuth code for token |

### Analytics — `/analytics` (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/summary` | Revenue, orders, sold today, top products |

### Webhooks — `/webhooks` (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/instagram` | Hub verify challenge |
| POST | `/instagram` | Handle IG events (comments) |
| POST | `/paystack` | Handle payment events |

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `sellers` | Seller accounts (email, password_hash, plan) |
| `refresh_tokens` | JWT refresh tokens with revocation |
| `password_reset_tokens` | One-time password reset tokens (1h expiry) |
| `channels` | Connected social channels (Instagram, WhatsApp, TikTok) |
| `products` | Products with status lifecycle (available→sold) |
| `customers` | Buyer CRM with spend tracking |
| `orders` | Orders linked to products, customers, Paystack refs |
| `messages` | Inbound/outbound messages via channels |
| `auto_replies` | Trigger-based reply templates |
| `jobs` | Background job queue (async IG actions) |

All tables use UUIDs as primary keys and include `created_at`/`updated_at` timestamps.

### Key Design Decisions
- **No ORM** — Raw parameterized SQL (`$1`, `$2`, ...) throughout
- **Soft deletes** — Products use `status='hidden'` instead of DELETE
- **Token hashing** — Refresh + reset tokens stored as SHA-256 hashes
- **Seller isolation** — Every query includes `seller_id = req.seller.id`
- **Job queue** — PostgreSQL-backed queue polled every 30s for async ops

---

## Deployment (Railway)

1. Push to GitHub
2. Create a new Railway project and link the repo
3. Add PostgreSQL service in Railway
4. Set all environment variables (copy from `.env.example`)
5. Railway will use `railway.json` to build and deploy automatically

The `railway.json` runs migrations on every deploy before starting the server.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TypeScript, TanStack Query, Zustand, React Router v6, Axios |
| Backend | Node.js, Express, TypeScript, pg (node-postgres) |
| Database | PostgreSQL 15 (raw SQL migrations) |
| Auth | JWT (access 15m + refresh 7d) + bcryptjs |
| Payments | Paystack (transaction init + webhook verification) |
| Social | Instagram Graph API v18.0 |
| Email | Nodemailer (SMTP) |
| Deployment | Railway (backend) + Railway/Vercel (frontend) |
| Local Dev | Docker Compose (PostgreSQL + pgAdmin) |
