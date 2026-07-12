# AssetFlow 📦

**Enterprise Asset & Resource Management System**

AssetFlow is a centralized, role-based ERP platform designed to simplify and digitize how organizations track, allocate, and maintain their physical assets (laptops, vehicles, furniture) and shared resources (meeting rooms, projectors). 

Built for modern enterprises, it eliminates chaotic spreadsheets by enforcing strict state-machine lifecycles, hard-conflict prevention for bookings, and an unalterable global activity audit trail.

---

## ✨ Core Features

*   🔐 **Role-Based Access Control (RBAC):** Four distinct tiers (Admin, Asset Manager, Department Head, Employee) ensuring secure, least-privilege operations.
*   🔄 **Strict Asset Lifecycles:** Assets transition safely through rigid states (`AVAILABLE`, `ALLOCATED`, `UNDER_MAINTENANCE`, `LOST`).
*   🛡️ **Hard-Conflict Prevention:** Physically prevents double-allocating assets. Time-overlap algorithms reject double-booking of shared resources.
*   🤝 **Peer-to-Peer Transfers:** Automated workflows allow employees to transfer assets directly to peers, with manager approval automatically updating the database allocations.
*   🛠️ **Maintenance Workflows:** Repair tickets automatically sync with asset databases, instantly removing broken items from the bookable pool.
*   📊 **KPI Dashboard & Analytics:** Real-time metrics, department-wise allocation breakdowns, maintenance frequency charts, and top-used asset leaderboards.
*   🕵️ **Company-Wide Audits (Stretch Goal):** Admins can launch physical inventory cycles. Items marked missing automatically sync to a `LOST` state globally.
*   📜 **Global Spy Logger (Stretch Goal):** Custom API middleware silently logs every mutating action (Create/Update/Delete) across the entire platform, creating an unalterable paper trail.

---

## 🛠️ Technology Stack

**Frontend Architecture (Vite + React)**
*   **Core:** React 18, TypeScript, Vite
*   **UI/Styling:** Tailwind CSS, Shadcn UI, Lucide Icons
*   **Routing:** React Router DOM
*   **Data Fetching & State:** Tanstack Query (React Query)
*   **Forms & Validation:** React Hook Form + Zod
*   **Visualizations & Calendars:** Recharts, React Calendar

**Backend Architecture (Node.js)**
*   **Core:** Node.js, Express.js, TypeScript
*   **Database ORM:** Prisma
*   **Security:** JWT (JSON Web Tokens), bcryptjs for password hashing
*   **Architecture:** Modular Controller-Route pattern with strict Middleware verification.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables. Create a `.env` file in the `backend` folder:
   ```env
   DATABASE_URL="file:./dev.db" # Or your PostgreSQL connection string
   JWT_SECRET="your_super_secret_key"
   PORT=5000
   ```
4. Push the Prisma schema to create the database:
   ```bash
   npx prisma db push
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 3. Demo Credentials & Admin Access
Because the system is secure, you cannot sign up as an Admin directly. However, the database is pre-seeded with a super-admin account for testing purposes.

**Admin Credentials:**
*   **Email:** `admin@assetflow.com`
*   **Password:** `Admin@123`

*(If you wish to create a custom admin, use the frontend signup page to create an Employee account, run `npx prisma studio` in the backend terminal, and manually change your role in the `User` table to `ADMIN`.)*

---

## 📁 Project Structure

```text
AssetFlow/
├── backend/
│   ├── prisma/             # Database schema
│   ├── src/
│   │   ├── config/         # Prisma client instantiation
│   │   ├── controllers/    # Business logic (Assets, Bookings, Audits, etc.)
│   │   ├── middlewares/    # JWT Auth, RBAC Roles, Global Activity Logger
│   │   └── routes/         # Express API route definitions
│   └── .env                # Backend secrets
└── frontend/
    ├── src/
    │   ├── components/     # Reusable Shadcn UI components
    │   ├── pages/          # Full page views (Dashboard, Asset Directory, etc.)
    │   ├── services/       # Axios/Fetch API wrappers
    │   └── utils/          # Helper functions & Zod schemas
    └── .env                # Frontend environment variables
```

---

*Built with ❤️ for the Hackathon*
