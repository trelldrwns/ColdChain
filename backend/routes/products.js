const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /products
router.get('/', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM products ORDER BY name ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /products
router.post('/', async (req, res) => {
  const { name, sku, description, min_temp_c, max_temp_c } = req.body;
  if (!name || !sku || min_temp_c === undefined || max_temp_c === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await query(
      `INSERT INTO products (name, sku, description, min_temp_c, max_temp_c) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, sku, description, min_temp_c, max_temp_c]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /products/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM products WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ error: 'Cannot delete product currently linked to shipments.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
