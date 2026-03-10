# Kinsley Generator Repair CRM — Build Spec

## Overview

A demo CRM for Kinsley, a fictional industrial generator repair business. Vertical slice: generator breaks → service order created → tech assigned → parts requested → inventory updates → order closed. Real database, real CRUD, four pages.

---

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + better-sqlite3
- **Language:** TypeScript (frontend and backend)
- **Structure:** Monorepo — `/client` and `/server` at project root

### Project Setup

```
kinsley/
├── client/                  # React + Vite app
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── pages/           # Page-level components
│   │   ├── lib/             # API client, utils, types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql   # Table definitions
│   │   │   ├── seed.sql     # Seed data (generators, parts, sample orders)
│   │   │   └── database.ts  # DB connection + init
│   │   ├── routes/
│   │   │   ├── generators.ts
│   │   │   ├── serviceOrders.ts
│   │   │   ├── partsRequests.ts
│   │   │   └── partsInventory.ts
│   │   └── index.ts         # Express app entry point
│   ├── tsconfig.json
│   └── package.json
└── README.md
```

### Startup

- `npm run dev` from project root should start both client (Vite dev server) and backend (Express) concurrently.
- Client runs on port 5173, server on port 3001.
- Vite proxies `/api/*` to the Express server.

---

## Database Schema (SQLite)

### generators

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| serial_number | TEXT UNIQUE NOT NULL | e.g., "KG-4321" |
| model | TEXT NOT NULL | e.g., "CAT C15 500kW" |
| manufacturer | TEXT NOT NULL | e.g., "Caterpillar" |
| client_name | TEXT NOT NULL | e.g., "Verizon" |
| location | TEXT NOT NULL | e.g., "Verizon — Newark Data Center" |
| install_date | TEXT NOT NULL | ISO date string |
| last_serviced | TEXT | ISO date string, nullable |
| status | TEXT NOT NULL DEFAULT 'operational' | 'operational', 'needs_service', 'out_of_commission' |

### service_orders

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| generator_id | INTEGER NOT NULL | FK → generators.id |
| status | TEXT NOT NULL DEFAULT 'open' | 'open', 'assigned', 'in_progress', 'completed' |
| assigned_tech | TEXT | Nullable, plain string name |
| problem_description | TEXT NOT NULL | |
| created_at | TEXT NOT NULL | ISO datetime |
| updated_at | TEXT NOT NULL | ISO datetime |

### service_order_logs

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| service_order_id | INTEGER NOT NULL | FK → service_orders.id |
| timestamp | TEXT NOT NULL | ISO datetime |
| entry_type | TEXT NOT NULL | 'note', 'status_change', 'parts_request', 'system' |
| message | TEXT NOT NULL | Human-readable log message |

### parts_inventory

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| part_number | TEXT UNIQUE NOT NULL | e.g., "KP-ENG-001" |
| name | TEXT NOT NULL | e.g., "Piston Ring Set — 6-Cylinder" |
| category | TEXT NOT NULL | 'Engine', 'Electrical', 'Cooling', 'Fuel System', 'Filters', 'Hardware', 'Exhaust', 'Control Panel' |
| quantity_in_stock | INTEGER NOT NULL DEFAULT 0 | |
| low_stock_threshold | INTEGER NOT NULL DEFAULT 5 | |

### parts_requests

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| service_order_id | INTEGER NOT NULL | FK → service_orders.id |
| part_id | INTEGER NOT NULL | FK → parts_inventory.id |
| quantity_requested | INTEGER NOT NULL | |
| status | TEXT NOT NULL DEFAULT 'requested' | 'requested', 'approved', 'delivered' |
| created_at | TEXT NOT NULL | ISO datetime |

---

## API Routes

All routes prefixed with `/api`. All responses JSON. Use standard HTTP status codes.

### Generators

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/generators | List all generators. Optional query params: `?search=` (searches serial_number, model, client_name, location), `?status=` |
| GET | /api/generators/:id | Single generator with its service order history |
| POST | /api/generators | Create generator (used for seeding, not exposed in UI for now) |

### Service Orders

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/service-orders | List all. Optional: `?status=`, `?search=`. Returns joined generator info (serial_number, client_name, location) |
| GET | /api/service-orders/:id | Single order with generator info, log entries, and parts requests (with part names) |
| POST | /api/service-orders | Create new order. Body: `{ generator_id, problem_description, assigned_tech? }`. Auto-creates a log entry ("Service order created"). Sets generator status to 'needs_service' |
| PATCH | /api/service-orders/:id | Update order. Body: any of `{ status, assigned_tech, problem_description }`. If status changes, auto-create log entry ("Status changed from X to Y"). If status → 'completed', set generator status back to 'operational' |

### Service Order Logs

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/service-orders/:id/logs | Add a note. Body: `{ message }`. Sets entry_type to 'note' |

### Parts Inventory

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/parts | List all. Optional: `?search=` (name or part_number), `?category=` |
| GET | /api/parts/categories | Returns distinct category list (for filter dropdowns) |

### Parts Requests

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/service-orders/:id/parts-requests | Create request. Body: `{ part_id, quantity_requested }`. Validates stock available. Creates log entry ("Parts request: 3x Oil Filter") |
| PATCH | /api/parts-requests/:id/approve | Approve request. Decrements parts_inventory.quantity_in_stock. Updates request status to 'approved'. Creates log entry on parent service order ("Parts approved: 3x Oil Filter") |
| PATCH | /api/parts-requests/:id/deliver | Mark delivered. Updates status to 'delivered'. Creates log entry ("Parts delivered: 3x Oil Filter") |

---

## Pages

### Navigation
Simple sidebar, always visible. Links to:
1. Service Orders (default/landing)
2. Parts Inventory
3. Generator Directory

Sidebar should show the Kinsley brand name at top. Active page highlighted.

### Page 1: Service Orders Dashboard

**Route:** `/` and `/service-orders`

**Layout:**
- Header row: page title "Service Orders" + "New Service Order" button
- Filter bar: status filter tabs (All, Open, Assigned, In Progress, Completed) showing count badges
- Table/list of service orders, each row showing:
  - Status badge (color-coded)
  - Generator serial number + client name
  - Problem description (truncated)
  - Assigned tech (or "Unassigned")
  - Created date (relative, e.g., "2 hours ago")
- Click row → navigate to detail page
- Search input for filtering by generator serial, client name, or problem description

**New Service Order — modal or slide-over:**
- Select generator (searchable dropdown, shows serial + client + location)
- Problem description (textarea)
- Assign technician (text input, optional)
- On submit: POST to API, refresh list, show success feedback

### Page 2: Service Order Detail

**Route:** `/service-orders/:id`

**Layout — two-column or stacked sections:**

**Top section — Order header:**
- Status badge (large, prominent)
- Generator info card: serial number, model, client, location
- Assigned tech
- Created date
- Status action buttons: contextual based on current status
  - Open → "Assign" (prompts for tech name if not set) or "Start Work"
  - Assigned → "Start Work"
  - In Progress → "Complete"
  - Completed → no actions (show completion state)

**Middle section — Parts Requests:**
- Table of existing requests: part name, part number, quantity, status badge
- Each row has action button based on status:
  - Requested → "Approve" button
  - Approved → "Mark Delivered" button
  - Delivered → checkmark, no action
- "Request Parts" button opens a modal:
  - Searchable parts dropdown (shows name, part number, stock level)
  - Quantity input
  - Validation: can't request more than available stock
  - Submit creates the request

**Bottom section — Activity Log:**
- Chronological list of log entries (newest first)
- Each entry: timestamp, type icon/badge, message
- "Add Note" input at top — text input + submit button
- Log includes both manual notes and auto-generated entries (status changes, parts requests)

### Page 3: Parts Inventory

**Route:** `/parts`

**Layout:**
- Header: "Parts Inventory" title
- Search input (searches name and part number)
- Category filter (dropdown or tabs from /api/parts/categories)
- Table of parts:
  - Part number
  - Name
  - Category badge
  - Quantity in stock — with visual treatment:
    - Normal: plain number
    - Low stock (at or below threshold): yellow/amber warning indicator
    - Out of stock (0): red indicator
- No edit/create functionality — this is a read-only reference page for the demo

### Page 4: Generator Directory (BUILD IF TIME ALLOWS)

**Route:** `/generators`

**Layout:**
- Header: "Generators" title
- Search input (serial number, client, location, model)
- Status filter
- Table/cards showing: serial number, model, client, location, status badge, last serviced date
- Click → detail view (could be separate page or expandable row):
  - Generator details
  - Service history: list of all service orders for this generator

---

## Seed Data

### Generators (8–10)

Seed with realistic industrial clients and generator models. Examples:

| Serial | Model | Manufacturer | Client | Location |
|--------|-------|-------------|--------|----------|
| KG-1001 | C15 500kW | Caterpillar | Verizon | Newark Data Center |
| KG-1002 | QSK60 2000kW | Cummins | Mount Sinai Health | Main Hospital Campus |
| KG-1003 | MTU 12V2000 | Rolls-Royce | JPMorgan Chase | Midtown Trading Floor |
| KG-1004 | 3512C 1500kW | Caterpillar | Columbia University | Morningside Heights Campus |
| KG-1005 | C32 1000kW | Caterpillar | Equinix | Secaucus NJ Data Center |
| KG-1006 | QSK78 2500kW | Cummins | NYC Health + Hospitals | Bellevue Hospital |
| KG-1007 | S16R 2000kW | Mitsubishi | Brookfield Properties | Manhattan West Tower |
| KG-1008 | 4012-46TAG2A 1350kW | Perkins | Verizon | Financial District Hub |
| KG-1009 | C9.3 250kW | Caterpillar | NYU Langone | Tisch Hospital |
| KG-1010 | QST30 1000kW | Cummins | Related Companies | Hudson Yards Complex |

Mix of statuses: mostly 'operational', 2-3 'needs_service', maybe 1 'out_of_commission'.

### Parts Inventory (150 parts)

Generate 150 parts across these categories with realistic names and part numbers:

**Categories and example parts:**

- **Engine** (~25 parts): Piston ring sets, cylinder head gaskets, connecting rods, crankshaft bearings, valve springs, camshaft assemblies, engine block heaters, turbocharger cartridges, injector nozzles, rocker arm assemblies
- **Electrical** (~25 parts): Voltage regulators, starter motors, alternator rectifiers, battery chargers, transfer switch contactors, control panel displays, wiring harnesses, circuit breakers, relay modules, solenoid valves
- **Cooling** (~20 parts): Radiator cores, water pumps, thermostats, coolant hoses (various sizes), fan belts, fan blade assemblies, coolant temperature sensors, expansion tanks, radiator caps
- **Fuel System** (~20 parts): Fuel injectors, fuel filters, fuel pumps, fuel lines, fuel pressure regulators, fuel tank level sensors, fuel priming pumps, injector return lines
- **Filters** (~15 parts): Oil filters, air filters (primary/secondary), fuel water separators, hydraulic filters, crankcase breathers, filter housings
- **Hardware** (~15 parts): Mounting bolts (various), vibration isolators, gasket sets, O-ring kits, hose clamps, coupling guards, flexible connectors
- **Exhaust** (~15 parts): Exhaust manifold gaskets, mufflers, flex connectors, exhaust bellows, rain caps, exhaust temperature sensors
- **Control Panel** (~15 parts): HMI displays, PLC modules, governor actuators, speed sensors, emergency stop buttons, annunciator panels, load sharing modules

**Part number format:** `KP-[CAT]-[###]` where CAT is a 3-letter abbreviation:
- Engine → ENG, Electrical → ELC, Cooling → CLG, Fuel System → FUL, Filters → FLT, Hardware → HDW, Exhaust → EXH, Control Panel → CTL

**Stock levels:** Vary realistically. Hardware and filters tend to have higher stock (15-50). Specialized engine/electrical parts lower (0-10). A few items at zero to demonstrate out-of-stock states.

### Sample Service Orders (3-4)

Pre-seed orders in different states to make the dashboard feel alive:

1. **Completed** — KG-1002 (Mount Sinai), "Coolant leak detected during routine inspection", assigned to "Mike Rivera", has 2 parts requests (both delivered), 5 log entries showing full lifecycle
2. **In Progress** — KG-1006 (Bellevue Hospital), "Generator failed to start during monthly test", assigned to "Sarah Chen", has 1 approved parts request, 3 log entries
3. **Assigned** — KG-1005 (Equinix), "Abnormal vibration reported by facility team", assigned to "James Wright", 1 log entry
4. **Open** — KG-1003 (JPMorgan), "Voltage output fluctuation under load", unassigned, 1 log entry

Each order should have realistic log entries with timestamps spread over appropriate time ranges.

---

## Build Order

### Phase 1: Scaffold (Target: 30–45 min)
1. Initialize project structure — client and server directories
2. Set up Vite + React + TypeScript + Tailwind + shadcn/ui in `/client`
3. Set up Express + better-sqlite3 + TypeScript in `/server`
4. Create database schema and seed data
5. Implement basic API routes (at minimum: GET service orders, GET generators)
6. Set up Vite proxy to Express
7. **Checkpoint:** `npm run dev` starts both servers, hitting `/api/service-orders` returns seeded data in the browser

### Phase 2: Service Orders Dashboard (Target: 45 min)
1. Build sidebar navigation (shared layout)
2. Build Service Orders list page with status filters
3. Build New Service Order modal/form
4. Wire up to API
5. **Checkpoint:** Can see service orders, filter by status, create a new one

### Phase 3: Service Order Detail (Target: 60 min)
1. Build detail page layout (header, generator info, status actions)
2. Build status transition buttons with API integration
3. Build parts requests section (list + create modal)
4. Build approve/deliver actions on parts requests
5. Build activity log with add-note functionality
6. **Checkpoint:** Can walk through complete workflow — open order, assign tech, start work, request parts, approve parts, complete order

### Phase 4: Parts Inventory (Target: 30 min)
1. Build parts list page with search and category filter
2. Low stock / out of stock visual indicators
3. **Checkpoint:** Can browse and search 150 parts

### Phase 5: Generator Directory (IF TIME ALLOWS)
1. Build generator list page
2. Build generator detail/service history view

---

## shadcn/ui Components to Install

Install these upfront to avoid interrupting the build flow:

- **Layout:** `sidebar` (or build custom), `separator`
- **Data display:** `table`, `badge`, `card`
- **Forms:** `button`, `input`, `textarea`, `select`, `label`, `dialog` (for modals)
- **Feedback:** `toast` (for success/error messages), `alert`
- **Navigation:** `tabs` (for status filters)

---

## Key Implementation Notes

- **Timestamps:** Use `new Date().toISOString()` everywhere. Display with relative formatting ("2 hours ago") on dashboards and full datetime on detail pages.
- **Status badges:** Use consistent color mapping across the app:
  - Open → gray
  - Assigned → blue
  - In Progress → yellow/amber
  - Completed → green
  - For parts: Requested → gray, Approved → blue, Delivered → green
  - For generators: Operational → green, Needs Service → yellow, Out of Commission → red
  - For inventory: Normal → default, Low Stock → yellow, Out of Stock → red
- **Error handling:** Basic — show toast on API errors, don't crash. No retry logic needed.
- **Loading states:** Show a simple loading spinner or skeleton when data is being fetched. Nothing fancy.
- **Responsive:** Don't worry about mobile. Desktop-first, 1024px+ viewport is fine for demo.
- **Auto-logging:** When the backend changes a service order status or processes a parts request, it should auto-create the appropriate log entry in the same transaction. The frontend shouldn't have to send separate log requests for system events.