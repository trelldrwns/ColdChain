const express = require('express');
const router = express.Router();
const { writeTelemetry, queryTelemetryHistory } = require('../influx');
const { EventLog } = require('../mongo');
const { query } = require('../db');

// POST /api/v1/telemetry/ingest
// Hardware ingestion endpoint (Secured)
router.post('/ingest', async (req, res) => {
  const hardwareToken = req.headers['x-hardware-token'];
  if (hardwareToken !== process.env.HARDWARE_API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid Hardware Token' });
  }

  const { serial_no, temperature, battery_pct } = req.body;
  if (!serial_no || temperature === undefined) return res.status(400).json({ error: 'Missing fields' });

  try {
    // 1. Look up the sensor bounds and shipment
    const sensorRes = await query(`
      SELECT s.shipment_id, p.min_temp_c, p.max_temp_c
      FROM sensors s
      JOIN shipments sh ON s.shipment_id = sh.id
      JOIN shipment_products sp ON sh.id = sp.shipment_id
      JOIN products p ON sp.product_id = p.id
      WHERE s.serial_no = $1 AND s.active = true
      LIMIT 1
    `, [serial_no]);

    if (sensorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Active sensor not found' });
    }

    const { shipment_id, min_temp_c, max_temp_c } = sensorRes.rows[0];

    // 2. Write telemetry to InfluxDB (High-Frequency)
    writeTelemetry(serial_no, shipment_id, temperature, battery_pct);

    // 3. Detect Anomalies -> Write to MongoDB (Unstructured Logs)
    let eventType = null;
    if (temperature > max_temp_c + 2 || temperature < min_temp_c - 2) {
      eventType = 'hard_excursion';
    } else if (temperature > max_temp_c || temperature < min_temp_c) {
      eventType = 'soft_excursion';
    }

    if (eventType) {
      // Document the anomaly
      await EventLog.create({
        sensor_serial: serial_no,
        shipment_id: shipment_id,
        event_type: eventType,
        temperature: temperature
      });

      // Update Relational State if critical
      if (eventType === 'hard_excursion') {
        await query(`UPDATE shipments SET status = 'flagged' WHERE id = $1`, [shipment_id]);
      }
    }

    // BROADCAST REAL-TIME WEBSOCKET EVENT
    if (req.app.locals.io) {
      req.app.locals.io.emit('telemetry_update', {
        serial_no,
        shipment_id,
        temperature,
        battery_pct,
        event: eventType || 'normal',
        timestamp: new Date()
      });
    }

    res.status(200).json({ success: true, event: eventType || 'normal' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/telemetry/history/:shipmentId
// Fetches 30-day historical aggregated telemetry for charting
router.get('/history/:shipmentId', async (req, res) => {
  const { shipmentId } = req.params;
  try {
    const data = await queryTelemetryHistory(shipmentId);
    res.json(data);
  } catch (err) {
    console.error('Influx query error:', err);
    res.status(500).json({ error: 'Failed to fetch historical telemetry' });
  }
});

module.exports = router;
