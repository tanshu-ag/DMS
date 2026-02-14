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

### 4. Demo Data
- 4 appointments per day from today through May 30, 2026
- Endpoint: `POST /api/seed-demo-appointments`
- History data preserved

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
- Eye icon → Customer Card navigation (real API data on Upcoming page)
- Customer Card: Edit/Message icons
- DP role edit access
- Demo data seed (424 appointments, Feb 14 - May 30, 2026)

## Backlog
- P2: Extract column control logic into reusable `useColumnManager` hook
