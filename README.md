# Odoo_2026

# AssetFlow - Enterprise Asset & Resource Management System
AssetFlow is a comprehensive, real-time enterprise solution for managing physical assets, organizing department workflows, scheduling resource bookings, coordinating maintenance, and conducting audit compliance.

---

## 🚀 Features

### 1. Dashboard & Analytics
- Real-time KPIs for asset counts, allocation states, and active bookings.
- Interactive visualizations utilizing **Recharts** (utilization rates, maintenance frequencies, department allocation distribution).
- Live activity logs showing operations across the workspace.

### 2. Organizational Setup
- **Departments Directory**: Build hierarchical department structures with designated heads.
- **Dynamic Asset Categories**: Add categories (e.g., Laptops, Vehicles) with customizable metadata schemas (custom fields configuration).
- **Employee Directory**: Track employees, roles (Admin, Asset Manager, Department Head, Employee), and status.

### 3. Asset Master Data
- Generate unique tracking tags (e.g., `AF-0001`).
- Support custom schemas per asset category.
- Detailed asset history tracing all allocations, maintenance requests, and audits.
- Auto-generate QR codes for physical tagging.

### 4. Allocations & Transfers
- Allocate assets to individual users or whole departments with specified return dates.
- Conflict checks to prevent double-allocations.
- Peer-to-peer asset transfer requests with workflow approvals.

### 5. Resource Booking Calendar
- Interactive booking calendar using **React Big Calendar**.
- Book rooms, vehicles, or laptops for specific time windows.
- Automatic overlap detection to prevent booking conflicts.

### 6. Maintenance Management
- Raise maintenance tickets with descriptions, photo attachments, and priorities.
- Workflow: Approve requests, assign technicians, log updates, and record resolution notes.

### 7. Audit Cycles
- Plan and launch audit cycles scoped by location or department.
- Mark assets as Verified, Missing, or Damaged during a physical audit.
- Complete and close audit cycles.

### 8. Real-time Notifications
- Real-time alerts via **Socket.io** for actions like asset assignments, maintenance updates, and role modifications.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React (v19) + Vite + TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Components**: Radix UI (shadcn/ui layout pieces)
- **Charts**: Recharts
- **Calendar**: React Big Calendar
- **Real-time**: Socket.io-client

### Backend
- **Framework**: Node.js + Express + TypeScript
- **ORM**: Prisma ORM
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Jobs**: Node-cron (for automated overdue asset return checks)
- **Logging**: Pino

---

## ⚙️ Getting Started

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (Ensure your local database server is running on port 5432)

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```
   *By default, the template is set to:*
   ```env
   DATABASE_URL=postgresql://postgres:%2383477DHlak@localhost:5432/assetflow
   PORT=4000
   JWT_ACCESS_SECRET=change-me-access-secret
   JWT_REFRESH_SECRET=change-me-refresh-secret
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=7d
   CLIENT_ORIGIN=http://localhost:5173
   UPLOAD_DIR=./uploads
   ```
4. Run Database Migrations:
   Apply the migrations to sync the schema to your PostgreSQL database:
   ```bash
   npx prisma migrate dev
   ```
5. Seed Initial Data:
   Populate the database with initial users, departments, categories, and credentials:
   ```bash
   npm run prisma:seed
   ```
6. Start the Backend Development Server:
   ```bash
   npm run dev
   ```
   *The backend server will run on [http://localhost:4000](http://localhost:4000).*

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Frontend Development Server:
   ```bash
   npm run dev
   ```
   *The frontend server will run on [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Login Credentials

The seeding process creates the following default accounts for testing different user roles:

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@assetflow.local` | `Admin@123` |
| **Asset Manager** | `manager@assetflow.local` | `Manager@123` |
| **Department Head** | `finance.head@assetflow.local` | `DeptHead@123` |
| **Employee** | `amit@assetflow.local` | `Employee@123` |
| **Employee** | `neha@assetflow.local` | `Employee@123` |

---

## 📈 ER Diagram

Below is the ER Diagram video walkthrough. Click the preview to watch the full-quality video file, or view the animation directly:

[![ER Diagram Walkthrough](./assets/ER_Diagram.gif)](./assets/ER_Diagram.mp4)

*If the animation above does not load, you can watch the [raw video file](./assets/ER_Diagram.mp4) directly.*
