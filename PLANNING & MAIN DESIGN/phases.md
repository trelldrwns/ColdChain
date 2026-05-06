# Implementation Phases — Cold Chain Monitor

## Philosophy

Build the smallest thing that works first, then layer complexity. Each phase should produce something **demonstrable and functional** — not just scaffolding. Skip optional features until core is solid. Treat each phase as a credit checkpoint: review before moving on.

---

## Phase 1 — Foundation (Do this first, do it right)

**Goal:** Running app with auth, one database connected, one real page.

### Backend
- [ ] Project scaffold: Node.js + Express, folder structure, env config
- [ ] Docker Compose: PostgreSQL + pgAdmin only (no Mongo/Influx yet)
- [ ] Run all PostgreSQL migrations (full schema from prompt)
- [ ] Auth endpoints: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- [ ] JWT middleware with role extraction
- [ ] Role-based route guard middleware
- [ ] Seed script: 1 admin user, 2 test shipments, 3 products, 2 carriers, 1 customer

### Frontend
- [ ] Next.js project setup with Tailwind
- [ ] Load Figtree + DM Mono from Google Fonts
- [ ] CSS variables from `design.md` in `globals.css`
- [ ] Dark navy sidebar component (collapsed icon rail, expand on hover)
- [ ] Topbar component (page title + user avatar + logout)
- [ ] Login page (centered form, clean, no decorations)
- [ ] Route guard: redirect to login if no valid JWT cookie
- [ ] Placeholder pages for each route (just the layout shell)

**Phase 1 done when:** You can log in as each of the 5 roles, see the correct sidebar items, and be blocked from wrong routes.

---

## Phase 2 — Shipments + Sensors (Core domain objects)

**Goal:** Full CRUD for shipments and sensors, list and detail views working.

### Backend
- [ ] `GET /shipments` — paginated list, filter by status
- [ ] `POST /shipments` — create with products and alert rule defaults
- [ ] `GET /shipments/:id` — full detail including products + sensors
- [ ] `PATCH /shipments/:id` — update status, assignment
- [ ] `POST /sensors` — register sensor to shipment
- [ ] `GET /sensors/:id` — detail + calibration + battery
- [ ] `PATCH /sensors/:id/calibrate`
- [ ] Row-level filtering middleware for carrier + customer roles
- [ ] Audit log writes on every POST/PATCH

### Frontend
- [ ] Shipment list page: card grid layout (Image 1 reference)
  - Tracking ID (DM Mono), status pill, route string
  - Filter bar: status pills (Active / Flagged / Delivered / All)
- [ ] Shipment detail panel: slides in from right on card click
  - Frosted glass panel, tracking info, sensor list, products
  - Embedded static map placeholder (swap for real map in Phase 4)
- [ ] Sensor management page: table layout
  - Serial no (DM Mono), shipment, battery bar, calibration date, active toggle

**Phase 2 done when:** You can create a shipment, attach sensors, and see it in the list with correct role filtering.

---

## Phase 3 — InfluxDB + MongoDB + Live Temperature

**Goal:** Sensor readings flowing end-to-end. This is the hardest phase technically.

### Infrastructure
- [ ] Add InfluxDB + MongoDB to Docker Compose
- [ ] InfluxDB: create org, bucket (`sensor_temp`, 90d retention), downsampled bucket
- [ ] MongoDB: create collections, indexes on `shipment_id + timestamp`

### Backend — Ingest worker (separate process)
- [ ] `POST /ingest/reading` — accepts sensor payload, writes to InfluxDB
- [ ] Async write summary to MongoDB `sensor_readings`
- [ ] Threshold check against `alert_rules` in PostgreSQL after each write
- [ ] Alert pipeline: Level 1 trigger → write `alert_events` to PostgreSQL

### Backend — Query layer
- [ ] `GET /sensors/:id/live` — latest InfluxDB point (<5s)
- [ ] `GET /sensors/:id/readings` — paginated from MongoDB (not InfluxDB)
- [ ] `GET /shipments/:id/sensors` — aggregated latest reading per sensor

### Frontend
- [ ] Temperature display on shipment card and detail panel
  - DM Mono font, color: text-primary (ok) / amber (soft breach) / red (hard breach)
  - Danger breach: CSS pulse animation on the digit only
- [ ] `/shipments/:id/timeline` page
  - Horizontal Gantt strip per sensor (Image 2 reference)
  - Color segments: green (in-range) / amber (soft) / red (hard) / gray dashed (no data)
  - Hover tooltip: temp value + timestamp

**Phase 3 done when:** Simulated sensor payloads flow through ingest, appear on the dashboard, and breach detection triggers an alert event in PostgreSQL.

---

## Phase 4 — Alerts + WebSockets + Excursions

**Goal:** Real-time alerting is live. Excursion events surfaced in the UI.

### Backend
- [ ] Level 2 + Level 3 escalation logic (time-gated, in ingest worker)
- [ ] Write `excursion_events` to MongoDB on Level 2+
- [ ] `PATCH /shipments/:id` status → `'flagged'` on Level 3
- [ ] Socket.io setup
  - `/ws/shipments/:id` — live temp feed per shipment room
  - `/ws/alerts` — global alert stream for admin/logistics_officer
- [ ] `GET /alerts/events` — list with filters
- [ ] `PATCH /alerts/events/:id/resolve`
- [ ] `GET /excursions` + `GET /excursions/:id` (includes MKT calculation)

### Frontend
- [ ] Shipment detail panel: switch from polling to WebSocket connection
- [ ] Alert Management Console (`/alerts`)
  - Table: shipment, sensor, severity pill, trigger value (DM Mono), triggered at, resolved status
  - Right panel: escalation timeline, resolve button
- [ ] In-app notification dot on sidebar alert icon (WS-driven)
- [ ] Excursion Analysis page (`/excursions`)
  - Top: summary chart (excursions by day, severity stacked bar — Recharts)
  - Bottom: detail table with duration, MKT, affected products, resolve action

**Phase 4 done when:** A simulated breach triggers a real-time alert that appears in the UI without a page refresh, escalates through levels, and writes an excursion event visible on the excursion page.

---

## Phase 5 — Reports + Compliance + Admin

**Goal:** GDP report generation working. Admin tools complete.

### Backend
- [ ] `POST /reports/gdp` — generates PDF from shipment data
  - Pulls: shipment metadata (PostgreSQL) + temp log (MongoDB) + excursion summary (MongoDB) + sensor calibration (PostgreSQL)
  - Output: PDF file, store path, write report record to PostgreSQL
- [ ] `GET /reports/:id/download` — serve PDF
- [ ] `GET /admin/audit` — paginated audit log with filters
- [ ] `GET /admin/carriers` + `POST /admin/carriers`
- [ ] `GET /admin/users` + `POST /admin/users` + `PATCH /admin/users/:id/role`

### Frontend
- [ ] Regulatory Report Generator page
  - Shipment selector, date range, generate button
  - Report history table: date, shipment, download link
- [ ] Audit Log Explorer (`/admin/audit`)
  - Full-width table, filter pills: action type / entity type / user / date range
- [ ] User Management (`/admin/users`)
  - Table: name, email, role badge, created date, role change dropdown
- [ ] Carrier Performance Dashboard
  - Cards per carrier: shipment count, avg excursion rate, on-time %

**Phase 5 done when:** A quality_auditor can generate and download a GDP report for a shipment that had an excursion.

---

## Phase 6 — Customer Portal + Polish

**Goal:** Customer-facing view, final UI pass, mobile-ish responsiveness.

### Backend
- [ ] `GET /shipments/:id/report` scoped to customer role
- [ ] Ensure all customer-role row-level filters are airtight (security review)

### Frontend
- [ ] Customer Portal (`/portal`)
  - Simplified Image 3 layout — fewer nav items
  - Shipment cards (read-only): status, current temp if in transit, ETA
  - Report download button if report exists
- [ ] Overview Dashboard (`/dashboard`) — full build
  - Pastel metric cards: active shipments / excursions today / sensors online / awaiting dispatch
  - Mini sparkline per card (Recharts, 7-day)
- [ ] Alert Rule Configurator (`/alerts/rules`)
  - Per-shipment accordion: min/max temp inputs, escalation level selector, notify roles multi-select, toggle active
- [ ] Final UI pass: spacing, font sizes, color consistency check against `design.md`

**Phase 6 done when:** All 13 pages are functional, all 5 roles see correct views, GDP report downloads successfully.

---

## What to skip / defer

| Feature | Decision |
|---|---|
| Blockchain logging | Excluded permanently — audit_logs covers it |
| Airline/carrier partner API integration | Defer post-Phase 6 — mock data is fine |
| Mobile app | Out of scope |
| Email notifications | Stub the function in Phase 4, implement last — not worth debugging during core build |
| Map with real routing | Phase 3 uses placeholder, swap for Leaflet/Mapbox in Phase 6 polish |
| Sensor calibration certificate upload | Phase 5 stores date only, file upload is post-Phase 6 |
| i18n / locale temp conversion | Celsius only for now, conversion hook added in Phase 6 if time permits |

---

## Credit checkpoints

Stop and review output quality before moving to the next phase. If the AI output is drifting (wrong patterns, ignoring design system, over-engineering), reset context with a fresh prompt anchored to `prompt.md` + the specific phase.

| After Phase | Check |
|---|---|
| 1 | Auth works, sidebar renders correctly for all roles |
| 2 | Shipment list and detail match the Image 1 reference layout |
| 3 | Temperature data flows end-to-end, timeline renders correctly |
| 4 | Alert fires in real-time, excursion is written and visible |
| 5 | GDP PDF downloads and contains correct data |
| 6 | All pages functional, no role leaks, design consistent |
