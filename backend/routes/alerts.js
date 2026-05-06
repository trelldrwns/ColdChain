const express = require('express');
const router = express.Router();
const { EventLog } = require('../mongo');

// GET /api/v1/alerts
// Fetch unresolved alerts (excursions)
router.get('/', async (req, res) => {
  try {
    const alerts = await EventLog.find({ resolved: false })
      .sort({ timestamp: -1 })
      .limit(50);
    res.status(200).json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/v1/alerts/:id/resolve
// Mark an alert as resolved
router.patch('/:id/resolve', async (req, res) => {
  try {
    const alert = await EventLog.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.status(200).json({ success: true, alert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
