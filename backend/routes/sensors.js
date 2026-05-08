const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { applyShipmentFilter } = require('../middleware/shipmentFilter');

// Helper to check access based on shipment
const checkAccess = async (req, shipmentId) => {
  if (req.allowedShipmentIds === null) return true;
  return req.allowedShipmentIds.includes(shipmentId);
};

// GET /sensors
router.get('/', applyShipmentFilter, async (req, res) => {
  try {
    let sql = `SELECT s.* FROM sensors s`;
    let params = [];
    let conditions = [];
    
    if (req.query.unassigned === 'true') {
      conditions.push(`s.shipment_id IS NULL`);
    }

    // Row-level filter
    if (req.allowedShipmentIds !== null) {
      if (req.allowedShipmentIds.length === 0) return res.json([]);
      conditions.push(`s.shipment_id = ANY($${params.length + 1}::uuid[])`);
      params.push(req.allowedShipmentIds);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /sensors/:id
router.get('/:id', applyShipmentFilter, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM sensors WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const sensor = result.rows[0];
    if (!(await checkAccess(req, sensor.shipment_id))) return res.status(403).json({ error: 'Forbidden' });
    
    res.json(sensor);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /sensors
router.post('/', applyShipmentFilter, async (req, res) => {
  const { shipment_id, serial_no, model } = req.body;
  if (!serial_no) return res.status(400).json({ error: 'Missing required fields' });
  
  if (shipment_id && !(await checkAccess(req, shipment_id))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await query(
      `INSERT INTO sensors (shipment_id, serial_no, model) VALUES ($1, $2, $3) RETURNING *`,
      [shipment_id || null, serial_no, model]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /sensors/:id
router.patch('/:id', applyShipmentFilter, async (req, res) => {
  try {
    const { shipment_id, active } = req.body;
    let updates = [];
    let params = [];
    let idx = 1;

    if (shipment_id !== undefined) {
      updates.push(`shipment_id = $${idx++}`);
      params.push(shipment_id || null);
      
      // Auto-toggle active state based on assignment if active wasn't explicitly passed
      if (active === undefined) {
        updates.push(`active = $${idx++}`);
        params.push(shipment_id ? true : false);
      }
    }
    if (active !== undefined) {
      updates.push(`active = $${idx++}`);
      params.push(active);
    }

    if (updates.length === 0) return res.json({ message: 'No updates' });

    params.push(req.params.id);
    const sql = `UPDATE sensors SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await query(sql, params);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /sensors/:id/calibrate
router.patch('/:id/calibrate', applyShipmentFilter, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM sensors WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const sensor = result.rows[0];
    if (!(await checkAccess(req, sensor.shipment_id))) return res.status(403).json({ error: 'Forbidden' });
    
    const updateRes = await query(
      `UPDATE sensors SET last_calibrated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(updateRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
