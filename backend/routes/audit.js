const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/v1/audit
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.ts DESC
      LIMIT 100
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
