# Bohania Renault Dealer Management System - PRD

## Original Problem Statement
Build a Customer Relations module for a Dealership Management System with appointment management, including Today/Upcoming/History views, a New Appointment form, user management, and settings.

## Core Requirements
- Sidebar navigation: Dashboard, Customer Relations (Today, Upcoming, History, Vehicles), Parts, Bodyshop, Mechanical, Insurance, HR, Settings
- **Today page:** Current day's appointments table
- **Upcoming page:** Split into "Tomorrow Prep" (N-1 status, docket ready) and "Future Bookings" (with filters)
- **History page:** Past appointments with date picker (no future dates)
- **New Appointment form:** 4 sections (Vehicle, Customer, Required, Additional) with advanced UI (time slots, PMS sub-dropdown, country code selector)
- **Permanent rule:** Date format display is `dd-mm-yyyy` globally (except duplicate cards: `DD MMM YYYY`)

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/ui
- **Backend:** FastAPI (Python), MongoDB
- **Auth:** Session-based with cookies

## What's Been Implemented

### Completed Features
- Full sidebar navigation with module structure
- Today page with appointment table
- Upcoming page split into "Tomorrow Prep" and "Future Bookings"
- History page with date constraints
- New Appointment form with all advanced controls
- User management (CRUD, roles: DP, CRM, CRE, Receptionist)
- Settings management (branches, service advisors, sources, vehicle models)
- Dashboard with stats
- CSV export

### Latest Enhancement (Feb 11, 2026) - New Appointment Screen
1. **Past Duplicates Hidden:** Duplicate check API and UI filter out appointments with dates before today
2. **Date Format in Duplicates:** Cards show `DD MMM YYYY` (e.g., "12 Feb 2026")
3. **Font Consistency:** Duplicate cards use consistent font styling (no font-mono on text)
4. **D+1 Date Restriction:** Date picker defaults to tomorrow, min attribute prevents today/past selection
5. **Change Booking Date:** Each duplicate card has "Change booking date" action with inline date picker (D+1 restricted)
6. **Data Consistency:** Date changes via API reflect across Today, Upcoming, History pages
7. **Activity Logging:** Date changes are logged in the activity log

## Key API Endpoints
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `GET /api/appointments` - List with filters (view, date, branch, etc.)
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}` - Update appointment
- `GET /api/appointments/duplicates/check` - Check duplicates (excludes past dates)
- `GET /api/settings` - Get settings
- `GET /api/branches` - Get branches

## Credentials
- Admin: username=admin, password=admin
- CRE1: username=cre1, password=cre123
- Reception: username=reception, password=reception123

## Backlog
No pending tasks at this time.
