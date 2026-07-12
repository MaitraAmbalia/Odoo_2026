<p align="center">
  <img src="https://img.shields.io/badge/AssetFlow-Donezo_Green-0e623b?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0yMCA2SDRjLTEuMSAwLTIgLjktMiAydjhjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY4YzAtMS4xLS45LTItMi0yek0yMCAxNkg0VjhoMTZ2OHoiLz48L3N2Zz4=" alt="AssetFlow" />
</p>

<h1 align="center">
  🏢 AssetFlow
</h1>

<p align="center">
  <strong>Enterprise Asset & Resource Management System</strong><br/>
  <em>Built with the Donezo forest-green design language · Light & Dark modes</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Express.js-5-000000?style=flat-square&logo=express" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat-square&logo=socket.io" />
</p>

---

## 🌟 Overview

**AssetFlow** is a full-stack enterprise platform that enables organizations to manage their entire physical asset lifecycle — from asset registration and QR tagging through departmental allocation, resource booking, maintenance coordination, audit compliance, and operational reporting — all from a single, real-time dashboard.

---

## 📈 ER Diagram

Below is the ER Diagram video walkthrough. Click the preview to watch the full-quality video:

[![ER Diagram Walkthrough](./assets/ER_Diagram.gif)](./assets/ER_Diagram.mp4)

*If the animation above does not load, you can view the [raw video file](./assets/ER_Diagram.mp4) directly.*

---
## 🏗️ Architecture

```
Odoo_2026/
├── frontend/                       # React 19 + Vite + TypeScript + Tailwind CSS 4
│   ├── src/
│   │   ├── features/
│   │   │   ├── dashboard/          # KPI cards + Recharts analytics + activity feed
│   │   │   ├── assets/             # Asset registry with table, drawer, QR codes
│   │   │   ├── allocations/        # Allocate/return assets + transfer requests
│   │   │   ├── bookings/           # Interactive timeline calendar with conflict detection
│   │   │   ├── maintenance/        # Kanban board: Pending → Approved → Resolved
│   │   │   ├── audits/             # Audit cycles: plan, execute, close
│   │   │   ├── org-setup/          # Departments, categories, employee management
│   │   │   ├── reports/            # Monthly analytics + CSV export
│   │   │   ├── notifications/      # Real-time alerts via Socket.io
│   │   │   └── auth/               # Login with JWT authentication
│   │   ├── components/
│   │   │   ├── layout/             # Sidebar navigation + theme toggle
│   │   │   ├── ui/                 # Radix UI primitives (dialog, select, toast, etc.)
│   │   │   └── shared/             # StatusBadge, reusable components
│   │   ├── hooks/                  # Custom hooks (useAssets, useBookings, useTheme, etc.)
│   │   └── api/                    # Axios client with JWT auto-refresh
│   └── tailwind.config.js          # Extended theme: Donezo green tokens
│
├── backend/                        # Express 5 + Prisma 7 + TypeScript
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Login, register, JWT refresh, password reset
│   │   │   ├── dashboard/          # KPI aggregation + recent activity
│   │   │   ├── assets/             # CRUD + QR generation + asset tagging
│   │   │   ├── allocations/        # Allocate, return, transfer workflows
│   │   │   ├── bookings/           # Time-slot booking with overlap detection
│   │   │   ├── maintenance/        # Ticket lifecycle with technician assignment
│   │   │   ├── audits/             # Audit cycle management + item verification
│   │   │   ├── departments/        # Department CRUD + head assignment
│   │   │   ├── categories/         # Dynamic asset categories with custom schemas
│   │   │   ├── employees/          # Employee directory + role promotion
│   │   │   ├── reports/            # Monthly aggregates + CSV export
│   │   │   ├── notifications/      # Real-time Socket.io notifications
│   │   │   └── activity-logs/      # Centralized audit trail logging
│   │   ├── middleware/             # JWT auth, Zod validation, request logging
│   │   ├── jobs/                   # Cron: automated overdue return sweeps
│   │   └── server.ts              # Express server + Socket.io attachment
│   ├── prisma/
│   │   ├── schema.prisma           # 15+ models, 10 enums, full relations
│   │   ├── migrations/             # Sequential PostgreSQL migrations
│   │   └── seed.ts                 # Rich demo data seeder
│   └── .env                        # Environment configuration
│
├── assets/                         # ER diagram media
└── .gitignore
```

---

## 🔐 Role-Based Access Control

AssetFlow implements strict RBAC with four distinct roles:

| Role | Dashboard | Assets | Allocations | Bookings | Maintenance | Audits | Reports | Org Setup |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Admin** | ✅ Full | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ Full | ✅ Full |
| **Asset Manager** | ✅ Full | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ Full | 📖 Read |
| **Department Head** | ✅ Dept | 📖 Read | ✅ Dept | ✅ CRUD | ✅ Raise | 📖 Read | 📖 Dept | ❌ |
| **Employee** | ✅ Own | 📖 Read | 📖 Own | ✅ Own | ✅ Raise | ❌ | ❌ | ❌ |

---

## 🔄 Maintenance Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING: Raise request
    PENDING --> APPROVED: Manager approves
    PENDING --> REJECTED: Manager rejects
    APPROVED --> TECHNICIAN_ASSIGNED: Assign technician
    TECHNICIAN_ASSIGNED --> IN_PROGRESS: Start work
    IN_PROGRESS --> RESOLVED: Mark resolved
    REJECTED --> [*]
    RESOLVED --> [*]
```

**Automated side-effects:**
- **Approve**: Asset status → `UNDER_MAINTENANCE`
- **Resolve**: Asset status → `AVAILABLE`, returns to allocation pool
- **Overdue Sweep**: Cron job flags overdue allocations & expired bookings automatically
- **Conflict Detection**: Booking overlap validation prevents double-reservations

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** 15+ (running on port `5432`)
- **npm**

### 1. Clone & Install

```bash
git clone https://github.com/MaitraAmbalia/Odoo_2026.git
cd Odoo_2026

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Environment Variables

```bash
# In /backend, create .env:
cp .env.example .env
```

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/assetflow
PORT=4000
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLIENT_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
```

### 3. Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with demo data
npm run prisma:seed
```

### 4. Run

```bash
# Terminal 1 — Backend (port 4000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** and sign in with any demo account below.

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin (IT Head)** | `admin@assetflow.local` | `Password@123` |
| **Asset Manager** | `manager@assetflow.local` | `Password@123` |
| **Finance Head** | `finance.head@assetflow.local` | `Password@123` |
| **IT Employee** | `neha@assetflow.local` | `Password@123` |
| **Finance Employee** | `amit@assetflow.local` | `Password@123` |
| **Sales Employee** | `rahul@assetflow.local` | `Password@123` |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create new user account |
| `POST` | `/api/auth/login` | Login → `accessToken` + `refreshToken` |
| `POST` | `/api/auth/refresh` | Rotate access token |
| `POST` | `/api/auth/logout` | Invalidate refresh token |

### Asset Management
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/assets` | List (filterable) / Register new asset |
| `GET` | `/api/assets/:id` | Get asset details + full history |
| `PATCH/DELETE` | `/api/assets/:id` | Update / Retire asset |
| `GET/POST` | `/api/categories` | List / Create asset categories |

### Allocations & Transfers
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/allocations` | List / Allocate asset to user/dept |
| `POST` | `/api/allocations/:id/return` | Return allocated asset |
| `GET/POST` | `/api/transfers` | List / Request peer-to-peer transfer |
| `PATCH` | `/api/transfers/:id` | Approve / Reject transfer |

### Resource Booking
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/bookings` | List / Create time-slot booking |
| `DELETE` | `/api/bookings/:id` | Cancel booking |

### Maintenance
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/maintenance` | List / Raise maintenance request |
| `PATCH` | `/api/maintenance/:id/status` | Approve / Reject / Assign / Resolve |

### Audits
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/audits` | List / Create audit cycle |
| `POST` | `/api/audits/:id/items` | Verify audit items |
| `PATCH` | `/api/audits/:id/close` | Close audit cycle |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/kpis` | Real-time asset KPIs |
| `GET` | `/api/dashboard/overdue` | Overdue allocations & bookings |
| `GET` | `/api/dashboard/recent-activity` | Latest activity feed |
| `GET` | `/api/reports/summary` | Monthly aggregate report |
| `GET` | `/api/reports/export?format=csv` | Export as CSV |

### System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET/PATCH` | `/api/notifications` | List / Mark notifications as read |
| `GET` | `/api/activity-logs` | Full activity audit trail |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React | 19.2 |
| **Build Tool** | Vite | 6.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Primitives** | Radix UI (shadcn/ui) | Latest |
| **State** | TanStack React Query | 5.x |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Charts** | Recharts | 3.x |
| **Calendar** | React Big Calendar | 1.x |
| **Routing** | React Router | 7.x |
| **Backend** | Express.js | 5.x |
| **ORM** | Prisma | 7.x |
| **Database** | PostgreSQL | 15+ |
| **Auth** | JWT (access + refresh) | — |
| **Real-time** | Socket.io | 4.x |
| **File Upload** | Multer | 2.x |
| **Validation** | Zod | 4.x |
| **QR Codes** | qrcode | 1.x |
| **Logging** | Pino | 10.x |
| **Cron Jobs** | node-cron | 4.x |

---

## 📄 License

This project was built for the **Odoo Hackathon 2026**.

---

<p align="center">
  <strong>Built with 🏢 by <a href="https://github.com/MaitraAmbalia">Team MaitraAmbalia</a></strong><br/>
  <sub>Powered by the Donezo Green Design System</sub>
</p>
