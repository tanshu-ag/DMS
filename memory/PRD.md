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
- **Header Renaming:** VEH REG NO -> REG NO, OTS NO -> OTS, TYPE OF SERVICE -> SERVICE TYPE, ALLOCATED SA NAME -> SA NAME
- **Column Customization:** Hide/unhide MAIL ID, DOCKET READINESS, N-1, CRE NAME. STATUS always visible
- **Column Rearrangement:** Drag-to-reorder all visible columns
- **Persistence:** Column visibility and order saved per user in backend
- **Status Read-Only:** STATUS column in Today table is read-only text
- **Row Actions:** Eye icon navigates to Customer Card (appointment detail page)
- **Customer Card Header:** Edit (pencil) icon + Message (WhatsApp) icon in top-right (phone button removed)

## Architecture
- Frontend: React + Shadcn UI + Tailwind
- Backend: Python FastAPI + MongoDB
- Auth: Username/password with session tokens

## Key API Endpoints
- `GET /api/appointments` - Fetch appointments with filters (supports view=day, upcoming, month, year, custom)
- `GET /api/user-preferences/:view` - Get column layout preferences
- `PUT /api/user-preferences/:view` - Save column layout preferences
- `POST /api/auth/login` - Login

## Completed (Feb 2026)
- All table enhancements (headers, columns, customization, rearrangement)
- Registration number space stripping
- Priority badge repositioning
- N-1 column split
- Status read-only in Today table
- Eye icon in table rows navigates to Customer Card
- Customer Card: Phone button replaced with Edit (pencil) icon, Message icon kept
- DP role added to canEdit() for admin edit access
- Upcoming page: Replaced demo/mock data with real API data (view=upcoming)

## Backlog
- P2: Extract column control logic into reusable `useColumnManager` hook
