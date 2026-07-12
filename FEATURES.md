# AssetFlow Feature Tracker

This document tracks our progress in building the backend APIs for the 10 core screens specified in the official hackathon problem statement.

## 🟢 1. Login / Signup Screen (COMPLETED)
- [x] `POST /api/auth/signup`: Create Employee account only
- [x] `POST /api/auth/login`: Email/password login with JWT generation
- [x] `GET /api/auth/me`: Session validation (protected route)
- [x] `POST /api/auth/forgot-password`: Password reset token generation

## 🟢 2. Dashboard / Home Screen
- [x] `GET /api/dashboard/kpis`: Aggregate counts (Available, Allocated, Maintenance, etc.)
- [x] Highlight overdue returns (Handled via `GET /api/allocations/overdue`)

## 🟡 3. Organization Setup (Admin Only)
**Tab A - Department Management**
- [x] Create/edit/deactivate departments
- [x] Assign hierarchy (Parent/Child) and Department Heads
**Tab B - Asset Category Management**
- [x] Create/edit categories with optional extra fields
**Tab C - Employee Directory**
- [x] View all employees with filtering
- [x] `PATCH /api/employees/:id/role`: Admin promotes users to Dept Head / Asset Manager

## ⚪ 4. Asset Registration & Directory
- [x] `POST /api/assets`: Register asset, auto-generate tag (e.g., AF-0001)
- [x] `GET /api/assets`: Search/filter by tag, serial, category, etc.
- [x] `GET /api/assets/:id`: View asset details, lifecycle status, and history (allocation + maintenance)

## ⚪ 5. Asset Allocation & Transfer
- [x] `POST /api/allocations`: Allocate asset (with **hard conflict rule** preventing double-allocation)
- [x] `POST /api/allocations/:id/return`: Mark returned, update condition notes, revert to Available
- [x] `POST /api/transfers`: Initiate transfer workflow
- [x] `PATCH /api/transfers/:id/approve`: Approve transfer and auto-reallocate
- [x] Auto-flag overdue allocations

## ⚪ 6. Resource Booking
- [x] `POST /api/bookings`: Book time slot (with **hard overlap validation** preventing double-booking)
- [x] `GET /api/bookings`: View calendar bookings for a resource
- [x] `PATCH /api/bookings/:id/cancel`: Cancel or reschedule

## ⚪ 7. Maintenance Management
- [x] `POST /api/maintenance`: Raise repair request with priority and photos
- [x] `PATCH /api/maintenance/:id/approve`: Approve/reject request (auto-updates asset to Under Maintenance)
- [x] `PATCH /api/maintenance/:id/resolve`: Resolve request (auto-updates asset to Available)

## ⚪ 8. Asset Audit (Stretch Goal)
- [x] Create Audit Cycle (date range, scope)
- [x] Assign Auditors
- [x] Log verified/missing/damaged items per cycle
- [x] Generate discrepancy reports & close cycle (updates missing to 'Lost')

## 🟢 9. Reports & Analytics (Stretch Goal)
- [x] Utilization trends and heatmap queries (Top most used assets)
- [x] Maintenance frequency and department allocation aggregations
- [x] Served securely via `/api/dashboard/analytics`s

## 🟢 10. Activity Logs & Notifications
- [x] Trigger notifications for bookings, approvals, and overdue alerts
- [x] Global activity logging middleware for Admin auditing
