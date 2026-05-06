# Project Prompt — Cold Chain Temperature Monitoring System

## Overview

Build a full-stack temperature monitoring system for pharmaceutical cold chain logistics. The system tracks shipments in real-time across multiple sensors, triggers configurable alerts for temperature excursions, and generates GDP-compliant regulatory reports.

**Domain:** Pharma / Logistics
**Stack:** PostgreSQL + MongoDB + InfluxDB + React/Next.js
**Unique challenge:** Handle 10,000+ sensors generating 1M+ readings/hour while supporting real-time alerting and a responsive dashboard UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Backend | Node.js + Express (REST API) |
| Primary DB | PostgreSQL (business entities, auth, audit) |
| Document DB | MongoDB (sensor events, shipment configs, excursions) |
| Time-series DB | InfluxDB v2 (high-frequency sensor ingestion) |
| Real-time | WebSockets (Socket.io) |
| Auth | JWT (role-based, httpOnly cookies) |
| Deployment | Docker Compose |

---

## Database Layer

### PostgreSQL — Schema

```sql
-- Users and roles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','logistics_officer','quality_auditor','carrier','customer')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carriers
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  license_no TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (with temperature requirements)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  min_temp_c FLOAT NOT NULL,
  max_temp_c FLOAT NOT NULL,
  description TEXT
);

-- Shipments
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_no TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  carrier_id UUID REFERENCES carriers(id),
  assigned_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending','in_transit','delivered','flagged','cancelled')),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departed_at TIMESTAMPTZ,
  expected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment ↔ Product join
CREATE TABLE shipment_products (
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (shipment_id, product_id)
);

-- Sensors attached to shipments
CREATE TABLE sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  serial_no TEXT UNIQUE NOT NULL,
  model TEXT,
  battery_pct FLOAT DEFAULT 100,
  last_calibrated_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE
);

-- Alert rules per shipment
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  min_temp_c FLOAT NOT NULL,
  max_temp_c FLOAT NOT NULL,
  escalation_level INT NOT NULL DEFAULT 1 CHECK (escalation_level IN (1,2,3)),
  notify_roles TEXT[] NOT NULL DEFAULT '{logistics_officer}',
  active BOOLEAN DEFAULT TRUE
);

-- Alert events triggered by rules
CREATE TABLE alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID REFERENCES alert_rules(id),
  sensor_id UUID REFERENCES sensors(id),
  trigger_value_c FLOAT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('soft','hard','critical')),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB,
  ip_address TEXT,
  ts TIMESTAMPTZ DEFAULT NOW()
);
```

---

### MongoDB — Collections

**`sensor_readings`** (time-series collection, TTL 90 days)
```json
{
  "_id": "ObjectId",
  "shipment_id": "uuid",
  "sensor_id": "uuid",
  "temperature_c": 3.4,
  "humidity_pct": 62.1,
  "timestamp": "ISODate",
  "location": { "lat": 12.97, "lng": 77.59 },
  "raw_payload": {}
}
```
Index on: `{ shipment_id: 1, timestamp: -1 }`, `{ sensor_id: 1, timestamp: -1 }`

**`shipment_configs`**
```json
{
  "_id": "ObjectId",
  "shipment_id": "uuid",
  "product_ids": ["uuid"],
  "sensor_ids": ["uuid"],
  "temp_range": { "min_c": 2.0, "max_c": 8.0 },
  "alert_contacts": [{ "role": "logistics_officer", "email": "..." }],
  "gdp_profile": "EU-GDP-2013",
  "created_at": "ISODate"
}
```

**`excursion_events`**
```json
{
  "_id": "ObjectId",
  "shipment_id": "uuid",
  "sensor_id": "uuid",
  "started_at": "ISODate",
  "ended_at": "ISODate",
  "duration_minutes": 47,
  "max_deviation_c": 4.2,
  "severity": "critical",
  "affected_product_ids": ["uuid"],
  "mean_kinetic_temp_c": 9.3,
  "resolved": false
}
```

---

### InfluxDB — Measurement Schema

**Measurement:** `sensor_temp`

| Type | Key | Notes |
|---|---|---|
| Tag | `shipment_id` | Indexed — primary query dimension |
| Tag | `sensor_id` | Indexed — per-sensor drill-down |
| Tag | `carrier_id` | Carrier-level aggregations |
| Field | `temperature_c` | float — core measurement |
| Field | `battery_pct` | float — co-ingested with reading |
| Timestamp | — | Nanosecond precision, 1 reading/min/sensor |

**Retention policies:**
- Raw data bucket: 90 days
- Downsampled 5-min averages bucket: 2 years

**Write pattern:** Ingest worker receives sensor payloads, writes to InfluxDB first, then async-writes summary to MongoDB `sensor_readings`. PostgreSQL is never written to during ingestion.

---

## Role-Based Auth

| Role | Permissions |
|---|---|
| `admin` | Full access — all shipments, users, rules, reports, audit logs |
| `logistics_officer` | Own assigned shipments — sensors, alerts, excursions, compliance reports |
| `quality_auditor` | Read-only — all shipments, excursions, GDP reports, audit logs |
| `carrier` | Own assigned shipments only — temperature data and alert status |
| `customer` | Own shipments only — tracking status and regulatory report download |

**Implementation:**
- JWT stored in httpOnly cookie (no localStorage)
- Role in JWT payload: `{ sub: userId, role: "logistics_officer", iat, exp }`
- Middleware checks role before every protected route
- Row-level filtering: `carrier` and `customer` roles have `shipment_id` list injected into every query via middleware — they cannot request data outside their assigned shipments

---

## API Contract

**Base:** `/api/v1`

### Auth
```
POST   /auth/login
POST   /auth/logout
GET    /auth/me
```

### Shipments
```
GET    /shipments                  — list (paginated, filterable by status/carrier/customer)
POST   /shipments                  — create
GET    /shipments/:id              — detail
PATCH  /shipments/:id              — update status / assignment
GET    /shipments/:id/sensors      — sensors on this shipment
GET    /shipments/:id/excursions   — excursion events
GET    /shipments/:id/report       — generate GDP compliance report (PDF)
```

### Sensors
```
GET    /sensors                    — list all (admin/auditor only)
POST   /sensors                    — register sensor to shipment
GET    /sensors/:id                — detail + battery + calibration status
PATCH  /sensors/:id/calibrate      — update calibration timestamp
GET    /sensors/:id/readings       — paginated historical readings (from MongoDB)
GET    /sensors/:id/live           — latest reading (from InfluxDB, <5s old)
```

### Alerts
```
GET    /alerts/rules               — list rules
POST   /alerts/rules               — create rule
PATCH  /alerts/rules/:id           — update thresholds / escalation
GET    /alerts/events              — list events (filterable by severity/resolved/shipment)
PATCH  /alerts/events/:id/resolve  — mark resolved
```

### Excursions
```
GET    /excursions                 — list (filterable by shipment/severity/date)
GET    /excursions/:id             — full detail with MKT calc
PATCH  /excursions/:id/resolve     — mark resolved
```

### Reports
```
POST   /reports/gdp                — generate GDP compliance report
GET    /reports/:id/download       — download generated PDF
```

### Admin
```
GET    /admin/users                — list users
POST   /admin/users                — create user
PATCH  /admin/users/:id/role       — change role
GET    /admin/audit                — audit log (paginated, filterable)
GET    /admin/carriers             — carrier list
POST   /admin/carriers             — add carrier
```

### WebSocket
```
WS  /ws/shipments/:id             — live temperature feed for a shipment
                                    emits: { sensor_id, temperature_c, timestamp, status }
WS  /ws/alerts                    — global alert stream (admin/logistics_officer)
                                    emits: { alert_event_id, shipment_id, severity, timestamp }
```

---

## Alert Escalation Flow

Three severity levels, time-gated escalation:

```
Breach detected by ingest worker
        │
        ▼
Level 1 — Soft breach (±0.5°C for < 5 min)
  Notify: logistics_officer
  Channel: in-app notification + email
        │
        ▼ (if breach continues > 15 min OR deviation ±1.5°C)
Level 2 — Hard breach
  Notify: logistics_officer + quality_auditor
  Channel: in-app + email
  Action: write excursion_event to MongoDB
        │
        ▼ (if breach continues > 60 min OR deviation ±3°C)
Level 3 — Critical
  Notify: admin + logistics_officer + quality_auditor
  Channel: in-app + email
  Action: update shipment status → 'flagged'
          push real-time alert via WS /ws/alerts
```

---

## Real-Time Strategy

- **Dashboard live feed:** WebSocket connection per shipment detail view. Backend reads latest InfluxDB point every 30s and pushes to connected clients in the shipment's socket room.
- **Alert stream:** Separate WS channel for admin and logistics_officer roles. Alert events pushed immediately on trigger.
- **Polling fallback:** Customer portal uses 30s REST polling (`GET /sensors/:id/live`) — no WebSocket needed for read-only status views.
- **Ingest worker:** Separate Node.js process (not the API server). Receives sensor payloads (e.g. via POST endpoint or queue), writes to InfluxDB, checks thresholds, triggers alert pipeline.

---

## Frontend Pages

All pages use the design system defined in `design.md`.

| Page | Route | Role access |
|---|---|---|
| Overview Dashboard | `/dashboard` | admin, logistics_officer, quality_auditor |
| Shipment Tracking | `/shipments` | all roles (filtered by ownership) |
| Shipment Detail | `/shipments/:id` | all roles (filtered) |
| Temperature Timeline | `/shipments/:id/timeline` | all except customer |
| Alert Management Console | `/alerts` | admin, logistics_officer, quality_auditor |
| Excursion Analysis Tool | `/excursions` | admin, logistics_officer, quality_auditor |
| Regulatory Report Generator | `/reports` | admin, logistics_officer, quality_auditor |
| Sensor Management Portal | `/sensors` | admin, logistics_officer |
| Carrier Performance Dashboard | `/carriers` | admin, quality_auditor |
| Audit Log Explorer | `/admin/audit` | admin, quality_auditor |
| Customer Portal | `/portal` | customer |
| Alert Rule Configurator | `/alerts/rules` | admin, logistics_officer |
| User Management | `/admin/users` | admin |

---

## Design System (summary — full spec in `design.md`)

**Fonts:** `Figtree` (UI) + `DM Mono` (all temperature readings, tracking IDs, timestamps)

**Colors:**
- Background: `#F4F6F9`
- Accent: `#0EA5B0` (cold chain teal)
- Sidebar: `#0C1929` (deep navy)
- Status: green `#22C55E` / amber `#F59E0B` / red `#E84444`

**Key rules:**
- Frosted glass (`backdrop-filter: blur(18px)`) used only on the sliding detail panel
- Temperature digit colored by status — never inside a colored container
- Dark navy sidebar, icon-only collapsed, label-expanded on hover
- No mesh gradients, no neumorphism, no card lift animations
- Pastel tinted metric cards on Overview (teal / red / green / amber tints)
- `DM Mono` for all numeric data — temperatures, IDs, durations

---

## Functional Requirements

- Real-time temperature monitoring across multiple sensors per shipment
- Configurable alert thresholds with three-level escalation workflow
- Excursion analysis with duration, severity, MKT (mean kinetic temperature), and product impact
- GDP (Good Distribution Practice) compliance report generation (PDF)
- Sensor calibration tracking and battery life monitoring
- Carrier performance analytics (on-time delivery, excursion rate per carrier)
- Full audit log — every write action recorded with user, timestamp, IP, and payload diff
- Role-based access control with row-level shipment isolation for carrier and customer roles

---

## Constraints and Notes

- InfluxDB is the write-hot path — never route high-frequency sensor data through PostgreSQL
- MongoDB `sensor_readings` is the read path for historical charts — not InfluxDB directly (too verbose for frontend queries)
- Blockchain logging: **excluded** — audit_logs table in PostgreSQL is sufficient for GDP compliance
- No dark mode — ops dashboards are always light
- GDP report output format: PDF, stored reference (report ID + path) in PostgreSQL, file in local storage or S3-compatible bucket
- All timestamps stored and transmitted as UTC ISO 8601
- Temperature always in Celsius internally; display layer may convert per user locale setting
