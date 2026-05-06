const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/v1/carriers/performance
router.get('/performance', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id, c.name, c.license_no, c.contact_email,
        COUNT(s.id) as total_shipments,
        COUNT(CASE WHEN s.status = 'delivered' THEN 1 END) as completed_shipments,
        COUNT(CASE WHEN s.status = 'in_transit' THEN 1 END) as active_shipments
      FROM carriers c
      LEFT JOIN shipments s ON c.id = s.carrier_id
      GROUP BY c.id
      ORDER BY total_shipments DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
