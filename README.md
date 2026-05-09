# Cold Chain Monitor - Project Overview & Architecture

## 1. Introduction
The **Cold Chain Monitor** is a comprehensive, production-grade logistics tracking application specifically designed for temperature-sensitive shipments (such as pharmaceuticals, vaccines, and perishables). It provides end-to-end visibility into the shipment lifecycle, real-time temperature telemetry tracking, anomaly detection, and role-based administrative control.

## 2. Technology Stack & Polyglot Architecture
The application leverages a modern, distributed architecture that utilizes the right database for the right job (polyglot persistence) alongside a decoupled Next.js frontend and Node.js backend.

### Frontend
* **Framework:** Next.js 14 (App Router) with React 18.
* **Styling:** Tailwind CSS for a utility-first, highly responsive design with a modern frosted-glass (glassmorphism) aesthetic.
* **UI Components:** Lucide React for iconography, Recharts for rendering temperature telemetry graphs, and React Leaflet for interactive shipment maps.
* **State & Feedback:** React Hot Toast for robust, non-blocking user feedback (success/error popups).
* **Real-time:** `socket.io-client` for listening to live telemetry and alert events.

### Backend
* **Core:** Node.js with Express 5.
* **Authentication:** Supabase Auth. The backend verifies JWTs issued by Supabase, storing them securely in HTTP-only cookies to prevent XSS attacks.
* **Real-time:** Socket.io server to push live updates (temperature changes, anomalies) directly to the dashboard.

### Database Layer (Polyglot Persistence)
The backend utilizes three distinct database engines, optimizing for specific data access patterns:
1. **PostgreSQL (via Supabase):** Relational data management. Handles core entities with strict schemas: Users, Customers, Carriers, Products, Sensors, and Shipments.
2. **MongoDB:** Document database used for unstructured or semi-structured event logs. It stores Incident Logs, Anomaly Alerts, and System Audit logs. This allows for flexible querying of complex event payloads without strict schema constraints.
3. **InfluxDB:** Time-series database optimized for high-frequency writes and time-based queries. It stores the massive volume of real-time temperature telemetry emitted by the sensors.

---

## 3. Core Features & System Workflows

### Authentication & Access Control
Users authenticate via Supabase. Upon successful login, the backend sets an `HttpOnly` JWT cookie. Every protected API route passes through an `authenticateToken` middleware, which verifies the JWT and attaches `req.user` (including their Role like `admin`). A secondary `requireRole('admin')` middleware guards highly sensitive routes (like viewing Audit logs).

### Shipment Lifecycle Management
Shipments transition through a strict state machine:
* **Pending:** Created but not dispatched. Can be modified, rejected, or dispatched.
* **In Transit:** Actively being monitored. Sensors are emitting telemetry.
* **Flagged:** An anomaly (e.g., temperature breach) occurred. The trip is paused for review.
* **Delivered:** Successfully completed.
* **Cancelled:** Halted or rejected. Can be "Reinitialized" back to Pending.

**Shipment Deletion:** Deleting a shipment triggers a safe cleanup sequence. Instead of hard-deleting associated sensors, the system intelligently unlinks the sensor (`shipment_id = NULL`) and marks it as inactive, while cascading the deletion of `shipment_products` and the `shipment` record itself. This ensures data integrity and prevents dangling foreign keys.

### Telemetry & Anomaly Detection Flow
1. **Data Ingestion:** Sensors (or the `simulate.js` script) hit the `/api/v1/telemetry` endpoint with temperature readings.
2. **Storage:** The backend writes this reading to **InfluxDB**.
3. **Rule Evaluation:** The backend queries PostgreSQL to find the temperature boundaries (Min/Max Temp) for the products attached to the shipment.
4. **Alert Generation:** If the temperature exceeds boundaries:
   * A new Alert Document is saved in **MongoDB**.
   * An event is emitted via **Socket.io** to the frontend.
   * The shipment status is automatically updated to `flagged` in PostgreSQL.
5. **Dashboard Update:** The Next.js frontend receives the WebSocket event and immediately displays a Toast notification and updates the Telemetry Chart via Recharts.

---

## 4. Directory Structure

```text
project/
├── frontend/                  # Next.js Application
│   ├── src/
│   │   ├── app/               # Next.js App Router (Pages & Layouts)
│   │   │   ├── (dashboard)/   # Protected dashboard routes (Shipments, Sensors, etc.)
│   │   │   └── login/         # Authentication view
│   │   └── components/        # Reusable UI components (Modals, Charts, Status Pills)
│   ├── tailwind.config.ts     # Styling design system
│   └── package.json           
│
├── backend/                   # Express.js Application
│   ├── server.js              # Entry point, Express setup, Socket.io, and Auth
│   ├── db.js                  # PostgreSQL (pg) connection pool
│   ├── mongo.js               # MongoDB (mongoose) connection and Schemas
│   ├── influx.js              # InfluxDB client setup
│   ├── middleware/            # Auth and filtering middleware
│   ├── routes/                # API Routers
│   │   ├── shipments.js       # CRUD & state management for shipments
│   │   ├── telemetry.js       # Data ingestion for sensors
│   │   └── alerts.js          # Fetching MongoDB anomalies
│   └── simulate.js            # Script to mock live IoT sensor data
```

---
