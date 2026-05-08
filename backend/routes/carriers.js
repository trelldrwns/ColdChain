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

// POST /api/v1/carriers
router.post('/', async (req, res) => {
  const { name, license_no, contact_email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const result = await query(`
      INSERT INTO carriers (name, license_no, contact_email)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, license_no, contact_email]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create carrier' });
  }
});

// DELETE /api/v1/carriers/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if carrier has active shipments to warn the user
    const checkRes = await query(`SELECT COUNT(*) as count FROM shipments WHERE carrier_id = $1 AND status != 'delivered'`, [id]);
    const hasActiveShipments = parseInt(checkRes.rows[0].count, 10) > 0;

    // Unassign shipments
    await query(`UPDATE shipments SET carrier_id = NULL WHERE carrier_id = $1`, [id]);
    
    // Delete carrier
    await query(`DELETE FROM carriers WHERE id = $1`, [id]);
    
    res.json({ success: true, hasActiveShipments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
