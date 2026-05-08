const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { EventLog } = require('../mongo');
const { applyShipmentFilter } = require('../middleware/shipmentFilter');

// Helper to check access
const checkAccess = (req, id) => {
  if (req.allowedShipmentIds === null) return true;
  return req.allowedShipmentIds.includes(id);
};

const logAudit = async (userId, action, entityType, entityId, payload) => {
  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, payload) VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, entityType, entityId, payload]
  );
};

// GET /shipments
router.get('/', applyShipmentFilter, async (req, res) => {
  try {
    let sql = `SELECT s.*, c.name as customer_name, cr.name as carrier_name 
               FROM shipments s 
               LEFT JOIN customers c ON s.customer_id = c.id 
               LEFT JOIN carriers cr ON s.carrier_id = cr.id`;
    let params = [];
    
    let conditions = [];
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      conditions.push(`s.status = $${params.length + 1}`);
      params.push(req.query.status);
    }
    
    // Row-level filter
    if (req.allowedShipmentIds !== null) {
      if (req.allowedShipmentIds.length === 0) {
        return res.json([]); // No allowed shipments
      }
      conditions.push(`s.id = ANY($${params.length + 1}::uuid[])`);
      params.push(req.allowedShipmentIds);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    
    sql += ` ORDER BY s.created_at DESC LIMIT 50`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /shipments/:id
router.get('/:id', applyShipmentFilter, async (req, res) => {
  const { id } = req.params;
  if (!checkAccess(req, id)) return res.status(403).json({ error: 'Forbidden' });

  try {
    // Basic shipment details
    const shipmentRes = await query(`
      SELECT s.*, c.name as customer_name, cr.name as carrier_name 
      FROM shipments s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      LEFT JOIN carriers cr ON s.carrier_id = cr.id
      WHERE s.id = $1
    `, [id]);
    
    if (shipmentRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const shipment = shipmentRes.rows[0];

    // Get sensors
    const sensorsRes = await query(`SELECT id, serial_no, model, battery_pct, active FROM sensors WHERE shipment_id = $1`, [id]);
    shipment.sensors = sensorsRes.rows;

    // Get products
    const productsRes = await query(`
      SELECT p.id, p.name, p.sku, p.min_temp_c, p.max_temp_c, sp.quantity
      FROM products p
      JOIN shipment_products sp ON p.id = sp.product_id
      WHERE sp.shipment_id = $1
    `, [id]);
    shipment.products = productsRes.rows;

    // Get active event logs (anomalies) from MongoDB
    const events = await EventLog.find({ shipment_id: id, resolved: false }).sort({ timestamp: -1 }).limit(5);
    shipment.events = events;

    res.json(shipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// PATCH /shipments/:id
router.patch('/:id', applyShipmentFilter, async (req, res) => {
  const { id } = req.params;
  const { status, assigned_user_id } = req.body;
  if (!checkAccess(req, id)) return res.status(403).json({ error: 'Forbidden' });

  try {
    let updates = [];
    let params = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (assigned_user_id) {
      updates.push(`assigned_user_id = $${paramIndex++}`);
      params.push(assigned_user_id);
    }

    if (updates.length === 0) return res.json({ message: 'No updates provided' });

    params.push(id);
    const sql = `UPDATE shipments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await query(sql, params);
    
    // Auto-resolve pending alerts if marking as in_transit
    if (status === 'in_transit') {
      await EventLog.updateMany({ shipment_id: id, resolved: false }, { resolved: true });
    }
    
    await logAudit(req.user.sub, 'UPDATE_SHIPMENT', 'shipment', id, { status, assigned_user_id });
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /shipments
router.post('/', applyShipmentFilter, async (req, res) => {
  const { tracking_no, origin, destination, products, sensor_id } = req.body;
  try {
    // 1. Create shipment
    const shipRes = await query(`
      INSERT INTO shipments (tracking_no, origin, destination, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `, [tracking_no, origin, destination]);
    const shipment = shipRes.rows[0];

    // 2. Assign products
    if (products && products.length > 0) {
      for (const p of products) {
        await query(`
          INSERT INTO shipment_products (shipment_id, product_id, quantity)
          VALUES ($1, $2, $3)
        `, [shipment.id, p.id, p.quantity]);
      }
    }

    // 3. Assign sensor
    if (sensor_id) {
      await query(`
        UPDATE sensors SET shipment_id = $1 WHERE id = $2
      `, [shipment.id, sensor_id]);
    }

    await logAudit(req.user.sub, 'CREATE_SHIPMENT', 'shipment', shipment.id, { tracking_no });

    res.status(201).json(shipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to create shipment' });
  }
});

// DELETE /shipments/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Free up sensors and mark them inactive
    await query(`UPDATE sensors SET shipment_id = NULL, active = false WHERE shipment_id = $1`, [id]);
    
    // Delete shipment products
    await query(`DELETE FROM shipment_products WHERE shipment_id = $1`, [id]);
    
    // Delete the shipment
    await query(`DELETE FROM shipments WHERE id = $1`, [id]);
    
    // Also log audit
    await logAudit(req.user.sub, 'DELETE_SHIPMENT', 'shipment', id, { id });
    
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
