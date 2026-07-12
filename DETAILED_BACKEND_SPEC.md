# AssetFlow — Comprehensive Backend Specification & Build Plan

> **Scope Note:** This document is the ultimate reference for building the AssetFlow backend for the hackathon. It combines the complete product requirements, technical specifications, API contracts, and team collaboration rules. As a backend developer, your primary goal is to implement the API exactly as specified here, ensuring business logic (conflict prevention) is strictly enforced server-side.

---

## PART 1: PROJECT OVERVIEW

### The Problem
Organizations with physical assets and shared resources (equipment, furniture, vehicles, rooms) currently track them manually. This causes:
- No real-time visibility into who holds what, where it is, or its condition
- Double-allocation of assets (two people assigned the same laptop)
- Double-booking of shared resources (two teams booking the same room)
- No structured approval trail for maintenance/repairs
- No systematic way to audit assets and catch discrepancies
- No visibility into overdue returns, bookings, or maintenance

### The Solution: AssetFlow
AssetFlow is a centralized Enterprise Asset & Resource Management (ERP-style) platform digitizing the asset lifecycle:
- Structured org setup (departments, categories, employee directory).
- Explicit asset lifecycle states: `AVAILABLE → ALLOCATED → RESERVED → UNDER_MAINTENANCE → LOST → RETIRED → DISPOSED`.
- Allocation with **hard conflict prevention**.
- Resource booking with **hard overlap prevention**.
- Maintenance requests routed through an approval workflow.
- Scheduled audit cycles with discrepancy reports.
- Role-based access control (Admin, Asset Manager, Department Head, Employee).

*(Out of scope for this hackathon: purchasing, invoicing, accounting.)*

---

## PART 2: TECHNOLOGY STACK & SCOPE

- **Runtime/Framework:** Node.js + Express
- **Database:** PostgreSQL
- **ORM:** Prisma
  - *Required Entities:* User, Department, AssetCategory, Asset, Allocation, TransferRequest, Booking, MaintenanceRequest, AuditCycle, AuditAssignment, AuditRecord, Notification, ActivityLog
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs` for password hashing
- **CORS:** Enabled for frontend origin
- **Validation:** Server-side validation of every request body (types, enums, dates, required fields). Do not trust client input.
- **Data Source:** All endpoints must serve dynamic data from PostgreSQL via Prisma. No static/mock JSON.

---

## PART 3: BUILD ORDER & IMPLEMENTATION PLAN (5-6 Hour Plan)

Follow this sequence strictly to unblock the frontend developer progressively.

**Phase 1 — Foundation (Hour 1)**
- **Backend:** Auth (signup/login/JWT), DB schema + migrate + seed data.
- **Frontend Unlocks:** Screen 1 (Login/Signup).

**Phase 2 — Org Setup (Hour 2)**
- **Backend:** Departments, Categories, Employee Directory, Role promotion APIs.
- **Frontend Unlocks:** Screen 3 (Organization Setup).

**Phase 3 — Assets Core (Hour 3)**
- **Backend:** Asset CRUD, search/filter, auto asset-tag generation.
- **Frontend Unlocks:** Screen 4 (Asset Registration & Directory).

**Phase 4 — Allocation + Booking (Hour 4)**
- **Backend:** Allocation (with conflict check), Transfer workflow, Booking (with overlap check).
- **Frontend Unlocks:** Screens 5 & 6 (Allocation, Transfer, Resource Booking). *This is the core differentiator.*

**Phase 5 — Maintenance + Dashboard (Hour 5)**
- **Backend:** Maintenance workflow, Dashboard KPI aggregation queries (needs data from everything else).
- **Frontend Unlocks:** Screens 7 & 2 (Maintenance, Dashboard).

**Phase 6 — Integration + Polish (Hour 6, buffer)**
- Full run-through: both servers up, fix mismatches.
- **Stretch Goals (Audit & Notifications):** Build only if ahead of schedule.
- **Cut List (if time runs out):** Reports/Analytics → Activity Logs → Audit Cycle → Notifications → Technician assignment step.

---

## PART 4: DETAILED API CONTRACT

**Base URL:** `http://localhost:5000/api`
**Auth:** All routes except `/auth/signup` and `/auth/login` require header: `Authorization: Bearer <token>`

### Standard Formats
**Response Shapes:**
- Success: `{ "data": { ... } }` or `{ "data": [ ... ], "count": 10 }`
- Error: `{ "error": "ERROR_CODE", "message": "Human readable message" }`

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `VALIDATION_ERROR` (400)

**Enums (Case-sensitive, use exactly as shown):**
- Role: `EMPLOYEE`, `DEPARTMENT_HEAD`, `ASSET_MANAGER`, `ADMIN`
- Status: `ACTIVE`, `INACTIVE`
- AssetStatus: `AVAILABLE`, `ALLOCATED`, `RESERVED`, `UNDER_MAINTENANCE`, `LOST`, `RETIRED`, `DISPOSED`
- AllocationStatus: `ACTIVE`, `RETURNED`
- TransferStatus: `REQUESTED`, `APPROVED`, `REJECTED`
- BookingStatus: `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`
- MaintenanceStatus: `PENDING`, `APPROVED`, `REJECTED`, `TECHNICIAN_ASSIGNED`, `IN_PROGRESS`, `RESOLVED`
- Priority: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

---

### Endpoints Dictionary

#### 1. Auth
- `POST /auth/signup`
  - Body: `{ "name": "...", "email": "...", "password": "..." }`
  - Notes: Creates Employee only. Role cannot be set here.
- `POST /auth/login`
  - Body: `{ "email": "...", "password": "..." }`
  - Returns: Token and user object.
- `GET /auth/me`
- `POST /auth/forgot-password` (Stub)

#### 2. Departments & Categories (Admin Write-only)
- `GET /departments`
- `POST /departments`
- `PUT /departments/:id`
- `PATCH /departments/:id/status` — `{ "status": "INACTIVE" }`
- `GET /categories`
- `POST /categories`

#### 3. Employee Directory (Admin)
- `GET /employees?department=&role=&status=`
- `PATCH /employees/:id/role`
  - Body: `{ "role": "DEPARTMENT_HEAD" }`

#### 4. Assets
- `POST /assets` (Asset Manager)
  - Registers asset. Generates `assetTag` (e.g., AF-0001).
- `GET /assets?tag=&serial=&category=&status=&department=&location=`
- `GET /assets/:id`
  - Includes `allocationHistory` and `maintenanceHistory`.
- `PATCH /assets/:id/status` — `{ "status": "RETIRED" }`

#### 5. Allocation & Transfer
- `POST /allocations`
  - **Rule:** Conflict check. Reject (409) if asset already has an `ACTIVE` allocation.
- `POST /allocations/:id/return`
  - **Rule:** Reverts asset status to `AVAILABLE`.
- `POST /transfers`
- `PATCH /transfers/:id/approve`
  - **Rule:** Close old allocation, create new `ACTIVE` allocation, update asset history.
- `PATCH /transfers/:id/reject`

#### 6. Resource Booking
- `POST /bookings`
  - **Rule:** Overlap check. Reject (409) if time range overlaps existing `UPCOMING`/`ONGOING` booking for the asset.
- `GET /bookings?assetId=&from=&to=`
- `PATCH /bookings/:id/cancel`

#### 7. Maintenance
- `POST /maintenance`
- `PATCH /maintenance/:id/approve`
  - **Rule:** Sets asset status to `UNDER_MAINTENANCE`.
- `PATCH /maintenance/:id/reject`
- `PATCH /maintenance/:id/resolve`
  - **Rule:** Sets asset status to `AVAILABLE`.

#### 8. Dashboard & Notifications
- `GET /dashboard/kpis`
  - Returns aggregate counts and overdue returns list.
- `GET /notifications`
- `PATCH /notifications/:id/read`

---

## PART 5: NON-NEGOTIABLE BUSINESS RULES

1. **Strict Validation:** Validate every request body (required fields, types, enum values, date logic e.g., `endTime > startTime`).
2. **Role Security:** Never trust the client to send a role. Roles are ONLY set via `PATCH /employees/:id/role` by an Admin.
3. **Hard Constraint Enforcement:** 
   - Allocation conflict check must be enforced server-side.
   - Booking overlap check must be enforced server-side.
4. **Data Integrity:** No hardcoded JSON. All data must be fetched and persisted via Prisma/PostgreSQL.

---

## PART 6: RULES OF ENGAGEMENT (Frontend & Backend Collaboration)

1. **No Silent Changes:** Don’t change a response shape without telling the frontend. If you rename a field, message them immediately.
2. **Postman Verification:** Backend builds → tests in Postman → tells frontend "X is live" before frontend swaps their mock call.
3. **Keep Docs Updated:** If either of you deviates from this contract during the hackathon, update this document immediately. 
4. **Exact Enums:** Enum values are case-sensitive and exact. Copy them straight from this document (e.g. `AVAILABLE` not `Available`).
