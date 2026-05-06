const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { EventLog } = require('../mongo');

// GET /api/v1/track/:trackingNo
// Public endpoint for customer portal - restricted data
router.get('/:trackingNo', async (req, res) => {
  try {
    const { trackingNo } = req.params;

    // Fetch basic shipment info
    const shipmentRes = await query(`
      SELECT s.id, s.tracking_no, s.origin, s.destination, s.status, s.created_at, c.name as carrier_name
      FROM shipments s
      LEFT JOIN carriers c ON s.carrier_id = c.id
      WHERE s.tracking_no = $1
    `, [trackingNo]);

    if (shipmentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tracking number not found' });
    }

    const shipment = shipmentRes.rows[0];

    // Fetch ANY excursion events to determine compliance
    const excursions = await EventLog.find({ shipment_id: shipment.id });
    const isCompliant = excursions.length === 0;

    res.status(200).json({
      tracking_no: shipment.tracking_no,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
      carrier: shipment.carrier_name,
      dispatch_date: shipment.created_at,
      compliant: isCompliant
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
