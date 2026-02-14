# Dealer Management System - PRD

## Original Problem Statement
Implement enhancements for the "Customer Relations" module, focusing on the "Today", "Upcoming", and "History" appointment tables.

## Core Requirements

### 1-3. Table & Form Enhancements (Complete)
- Header renaming, column customization, rearrangement, persistence
- Registration number auto-strips spaces, [P] badge, N-1 column split
- Eye icon → Customer Card, Edit/Message icons

### 4. Customer Card / Appointment Detail
- Day Outcome linked to "Other Settings" `appointment_day_outcomes`
- N-1 Notes removed, "Recovered" → "Lost Customer"
- Spacing improved for Source, Service Type, Day Outcome badges
- Branch linked to `/api/branches`
- Edit mode: Day Outcome, N-1, OTS/Recall, Docket Ready, Lost Customer all editable

### 5. Booking ID System
- Auto-generated `#SILB0001` series on appointment creation
- Non-editable, displayed in header
- Preserved on reschedule, new ID on cancellation+new booking

### 6. Reschedule Flow
- Reschedule date must be > today
- Auto-creates new upcoming appointment with same booking_id
- `[R]` mark with reschedule history on hover (in tables + detail page)
- Cancelled shows reason text box
- "No Show" in dropdown, auto-mark at 7pm (future: backend cron)

### 7. Demo Data
- 4 appointments/day from today through May 30, 2026 with booking_ids

## Architecture
- Frontend: React + Shadcn UI + Tailwind
- Backend: Python FastAPI + MongoDB
- Components: StatusSidebar.jsx (extracted for build optimization)

## Key API Endpoints
- `GET /api/appointments` - view=day|upcoming|month|year|custom
- `PUT /api/appointments/:id` - Update with reschedule logic
- `GET /api/branches` - Branch list from settings
- `POST /api/seed-demo-appointments` - Seed demo data

## Completed (Feb 2026)
- All table enhancements, column customization, persistence
- Customer Card: Day Outcome, booking ID, reschedule flow, editable flags
- Demo data seed (424 appointments with booking_ids)

## Backlog
- P1: Backend cron: auto-mark "No Show" at 7pm for unreported customers
- P2: Extract column control logic into reusable `useColumnManager` hook
