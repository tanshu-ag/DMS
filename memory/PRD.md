# DMS - Dealer Management System PRD

## Original Problem Statement
Import and build out a Dealer Management System (DMS) from GitHub repo `https://github.com/tanshu-ag/DMS`. The application manages dealer operations including appointments, customer relations, user management, settings, and branches.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Python
- **Database**: MongoDB (async Motor driver)
- **Architecture**: SPA with RESTful backend API

## Core Requirements
- User Management with role-based access (DP, CRM, CRE, Receptionist)
- Appointment scheduling and tracking with N-1 confirmation workflow
- Customer Relations module (Appointment, History, Vehicles)
- Settings management (branches, service types, sources, etc.)
- Dashboard with statistics

## What's Been Implemented

### Completed Features
1. **User Management Page** - Full CRUD, active/inactive tabs, lock/unlock, password reset, admin protection
2. **Settings Overview** - Zoho-inspired landing page
3. **Other Settings Page** - Dynamic dropdown management (sources, service types, facilities, etc.)
4. **Branches Page** - Branch CRUD with non-deletable primary branch
5. **Roles Page** - UI-only display of user roles with Facility column
6. **Customer Relations Navigation** - Restructured sidebar with Today, Upcoming, History, Vehicles sections
7. **History Page** - Tabbed interface (Date, Month, Year, Custom Range) with filter pop-ups
8. **Appointment (Today) Screen** - Wide 16-column table with horizontal scrolling, "Rescheduled / Cancelled in N-1" secondary table, filters
9. **Upcoming Page** - Placeholder page for future scheduled appointments (Feb 10, 2026)
10. **Sidebar Menu Update** - Renamed "Appointment" to "Today", added "Upcoming" submenu item (Feb 10, 2026)

### Key Data Models
- **users**: `{ user_id, username, name, role, department, is_active, is_locked, module_access, ... }`
- **appointments**: `{ appointment_id, branch, appointment_date, appointment_time, source, customer_name, customer_phone, vehicle_reg, vehicle_model, current_km, ots, service_type, allocated_sa, n_minus_1_confirmation, appointment_status, cre_name, lost_customer, rescheduled_in_n1, cancelled_in_n1, ... }`
- **settings**: Single document with lists for dynamic dropdowns
- **branches**: `{ branch_id, location, type, address, is_primary }`

### Key API Endpoints
- Auth: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- Users: `/api/users` (GET/POST/PUT), `/api/users/{id}` (DELETE), `/api/users/{id}/lock`, `/api/users/{id}/reset-password`, `/api/users/cres`
- Settings: `/api/settings` (GET/PUT)
- Branches: `/api/branches` (GET/POST), `/api/branches/{id}` (PUT/DELETE)
- Appointments: `/api/appointments` (GET/POST), `/api/appointments/{id}` (GET/PUT)
- Dashboard: `/api/dashboard/stats`

## Credentials
- Admin: `admin` / `admin`

## Prioritized Backlog

### P1 - Next Up
- Implement full Roles page functionality (backend endpoints + frontend CRUD for New Role, Edit, Clone, Delete)
- Wire up History page tabs to fetch/display real appointment data

### P2 - Medium Priority
- Build out Vehicles page (define and implement functionality)
- Verify/fix "Other Settings" page loading error (reported but unconfirmed)

### P3 - Low Priority / Refactoring
- Refactor `backend/server.py` into modular routers (users, appointments, settings, branches)
- Clean up dead routes in `App.js` (old `/day-view`, `/month-view`, `/year-view`)
- Break down `History.jsx` into smaller components

## Known Issues
- "Other Settings" page had a reported loading error - fix unconfirmed
- Roles page is UI-only (no backend functionality)
- Vehicles page is a "Coming Soon" placeholder
