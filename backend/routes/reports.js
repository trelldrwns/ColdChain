const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { EventLog } = require('../mongo');

// GET /api/v1/reports/:shipmentId/gdp
// Generates a GDP Compliance CSV Report for a specific shipment
router.get('/:shipmentId/gdp', async (req, res) => {
  try {
    const { shipmentId } = req.params;

    // 1. Fetch Shipment Details from Postgres
    const shipmentRes = await query(`
      SELECT sh.id, sh.origin, sh.destination, sh.status, sh.created_at, p.name as product_name
      FROM shipments sh
      JOIN shipment_products sp ON sh.id = sp.shipment_id
      JOIN products p ON sp.product_id = p.id
      WHERE sh.id = $1
    `, [shipmentId]);

    if (shipmentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const shipment = shipmentRes.rows[0];

    // 2. Fetch Anomaly Logs from MongoDB
    const events = await EventLog.find({ shipment_id: shipmentId }).sort({ timestamp: 1 });

    // 3. Build CSV String
    let csv = `COLD CHAIN MONITOR - GDP COMPLIANCE REPORT\n`;
    csv += `Generated On,${new Date().toISOString()}\n\n`;
    
    csv += `SHIPMENT DETAILS\n`;
    csv += `ID,${shipment.id}\n`;
    csv += `Product,${shipment.product_name}\n`;
    csv += `Route,${shipment.origin} -> ${shipment.destination}\n`;
    csv += `Final Status,${shipment.status.toUpperCase()}\n\n`;

    csv += `EXCURSION EVENT LOG\n`;
    csv += `Timestamp,Sensor Serial,Event Type,Recorded Temp (C),Resolved\n`;
    
    if (events.length === 0) {
      csv += `No excursions recorded. Shipment remained fully compliant.\n`;
    } else {
      events.forEach(e => {
        csv += `${e.timestamp.toISOString()},${e.sensor_serial},${e.event_type},${e.temperature.toFixed(2)},${e.resolved}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gdp_report_${shipmentId}.csv"`);
    res.status(200).send(csv);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
