# Dealer Management System - PRD

## Original Problem Statement
Implement enhancements for the "Customer Relations" module, focusing on the "Today", "Upcoming", and "History" appointment tables.

## Core Requirements

### 1. New Appointment Form
- Registration Number field auto-strips spaces on input/paste

### 2. Today Table UI Cleanup
- Priority `[P]` badge appears after customer name
- Status split into "N-1" and "Status" columns

### 3. Table Functionality (Today, Upcoming, History)
- Header Renaming, Column Customization, Rearrangement with persistence
- Status Read-Only in Today table
- Eye icon navigates to Customer Card
- Customer Card: Edit + Message icons in top-right (phone removed)

### 4. Customer Card (Appointment Detail)
- Merged "Appointment Status" and "Day Outcome" into single "Day Outcome" field
- Status options: Booked, Confirmed, Reported, Rescheduled, Cancelled (no No-Show in dropdown)
- Rescheduled → shows date picker + remarks
- Cancelled → shows reason text box
- Reported → no additional action
- No-Show → auto-mark at 7pm (future: backend cron)
- Edit mode makes editable: Day Outcome, N-1 Confirmation, OTS/Recall, Docket Ready, Lost Customer
- Renamed "Recovered" → "Lost Customer"

### 5. Demo Data
- 4 appointments per day from today through May 30, 2026
- Endpoint: `POST /api/seed-demo-appointments`

## Architecture
- Frontend: React + Shadcn UI + Tailwind
- Backend: Python FastAPI + MongoDB

## Key API Endpoints
- `GET /api/appointments` - view=day|upcoming|month|year|custom
- `GET/PUT /api/user-preferences/:view` - Column preferences
- `POST /api/seed-demo-appointments` - Seed demo data
- `POST /api/auth/login` - Login (admin/admin)

## Completed (Feb 2026)
- All table enhancements
- Eye icon → Customer Card navigation (real API data)
- Customer Card: Edit/Message icons, merged status fields, editable flags
- DP role edit access
- Demo data seed (424 appointments)

## Backlog
- P1: Backend auto-mark "No Show" at 7pm for unreported customers
- P2: Extract column control logic into reusable `useColumnManager` hook
