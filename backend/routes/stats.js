const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { EventLog } = require('../mongo');

// GET /api/v1/stats
router.get('/', async (req, res) => {
  try {
    // 1. Active Shipments (in_transit)
    const activeShipmentsRes = await query(`SELECT COUNT(*) FROM shipments WHERE status = 'in_transit'`);
    const activeShipments = parseInt(activeShipmentsRes.rows[0].count, 10);

    // 2. Awaiting Dispatch (pending)
    const pendingShipmentsRes = await query(`SELECT COUNT(*) FROM shipments WHERE status = 'pending'`);
    const pendingShipments = parseInt(pendingShipmentsRes.rows[0].count, 10);

    // 3. Sensors Online (active = true)
    const sensorsOnlineRes = await query(`SELECT COUNT(*) FROM sensors WHERE active = true`);
    const sensorsOnline = parseInt(sensorsOnlineRes.rows[0].count, 10);

    // 4. Excursions Today (from MongoDB)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const excursionsToday = await EventLog.countDocuments({
      timestamp: { $gte: today },
      resolved: false
    });

    res.status(200).json({
      activeShipments,
      pendingShipments,
      sensorsOnline,
      excursionsToday
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
