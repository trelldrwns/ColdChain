const { query } = require('../db');

const applyShipmentFilter = async (req, res, next) => {
  if (['admin', 'quality_auditor'].includes(req.user.role)) {
    req.allowedShipmentIds = null; // null means allow all
    return next();
  }
  
  let q = '';
  let params = [req.user.email];
  
  if (req.user.role === 'customer') {
    q = `SELECT id FROM shipments WHERE customer_id = (SELECT id FROM customers WHERE contact_email = $1)`;
  } else if (req.user.role === 'carrier') {
    q = `SELECT id FROM shipments WHERE carrier_id = (SELECT id FROM carriers WHERE contact_email = $1)`;
  } else if (req.user.role === 'logistics_officer') {
    q = `SELECT id FROM shipments WHERE assigned_user_id = $1`;
    params = [req.user.sub]; // user id
  }
  
  try {
    const result = await query(q, params);
    req.allowedShipmentIds = result.rows.map(r => r.id);
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to apply row-level filters' });
  }
};

module.exports = { applyShipmentFilter };
