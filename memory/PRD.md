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
- `GET /api/vehicles?brand=renault|other` - Get vehicles filtered by brand
- `POST /api/vehicles` - Create vehicle (brand, make fields added)
- `PUT /api/vehicles/{id}` - Update vehicle with make/brand support
- `DELETE /api/vehicles/{id}` - Delete vehicle

## Completed (Mar 2026)
- Other Brands Vehicles Page: Full CRUD operations for non-Renault vehicles (Mar 3)
  - New page at /vehicles/other-brands replacing "Coming Soon" placeholder
  - Uses "Make" (brand name) text input instead of model dropdown
  - Table shows: Reg No, VIN, Make, Model, Customer, Phone, Actions
  - Backend supports brand filter (brand=renault vs brand=other)
- Vehicle Profile Edit Functionality: Edit modal directly on profile page (Mar 3)
  - Edit button opens modal with vehicle details
  - Renault vehicles: Model dropdown from master list
  - Other Brands: Make text input + Model text input
  - Customer details editable (Name, Phone, Email)
  - Toast notifications for save/update operations
- Vehicle Profile conditional rendering: Other Brands hides Dealer tab (4 tabs vs 5 for Renault)

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
- VIN input bug fix: Fixed inline VIN/Reg input fields disappearing when typing. Root cause: object reference equality was failing during re-renders. Fixed by using index-based selection and separate state variables (Feb 15)
- Reception wizard UX: Moved Vehicle Reception Time and Source from Step 1 to Step 2 per user request (Feb 15)
- Reception wizard UX: Address field now takes full row, City/State/Pin on separate row below (Feb 15)
- Reception wizard UX: Removed "Not Collected" checkbox from documents step - simplified to just Attach button with "Optional" label (Feb 15)
- Reception action menu: Changed from single Eye icon to dropdown menu with View, Edit, Delete options (Feb 15)
- Backend: Added DELETE /api/reception/{entry_id} endpoint for deleting reception entries (Feb 15)
- Vehicles Module: Built complete CRUD with master model list from Other Settings (Feb 23)
  - Model dropdown only shows models from Other Settings → Vehicle Models
  - Unmapped models show "(Unmapped)" with warning icon in table
  - Edit modal shows stored model value with warning to select valid model
  - Search only searches by Reg No / VIN / Engine No / Phone / Customer (NOT model)
  - Backend API endpoints: GET/POST/PUT/DELETE /api/vehicles

## Backlog
- P2: Extract column control logic into reusable `useColumnManager` hook
- P2: Implement real document storage (Google Drive or similar) to replace mocked document upload in Reception wizard
- P2: Refactor large files (Reception.jsx ~800 lines, Vehicles.jsx ~400 lines) into smaller components
