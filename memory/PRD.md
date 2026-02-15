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
- UI layout fix: Source (SDR) and Service Type (3FS) values now display under their labels (Feb 14)
- Activity log fix: Only logs saved changes, filters out spurious null→empty-string changes (Feb 14)
- Eye icon crash fix: Added missing Tooltip imports to AppointmentDetail.jsx (Feb 14)
- Reschedule [R] tooltip: Shadcn Tooltip with "N reschedules" + dates dd-mm-yyyy, filtered before today (Feb 14)
- Auto No-show cron: Background task marks unreported appointments as "No-show" post 7 PM IST (Feb 14)
- Priority flag added to Status sidebar between OTS and Lost Customer (Feb 14)
- Status badge removed from appointment card header at all stages (Feb 14)
- N-1 popup dialog: Rescheduled/Cancelled in Upcoming Tomorrow table triggers popup for date/remarks/reason (Feb 14)
- N-1 in Tomorrow's card = Day Outcome logic: full dropdown with conditional reschedule/cancel fields (Feb 14)
- Reception module: Full register page, 3-step wizard (vehicle search/create, contact validation, doc attachment), detail view, backend CRUD (Feb 15)
- VIN input bug fix: Fixed inline VIN/Reg input fields disappearing when typing. Root cause: object reference equality (`selectedVehicle === r`) was failing during re-renders. Fixed by using index-based selection (`selectedVehicleIndex`) and separate state variables for VIN/RegNo inputs (Feb 15)

## Backlog
- P2: Extract column control logic into reusable `useColumnManager` hook
- P2: Implement real document storage (Google Drive or similar) to replace mocked document upload in Reception wizard
