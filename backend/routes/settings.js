const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/settings - Fetch system settings (SLA thresholds)
router.get('/', async (req, res) => {
  try {
    const db = await getDB();
    const settings = await db.all(`SELECT * FROM settings`);
    const mapped = {};
    settings.forEach(s => { mapped[s.key] = s.value; });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST /api/settings - Update SLA thresholds (Admin)
router.post('/', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { SLA_LOW, SLA_MEDIUM, SLA_HIGH, SLA_EMERGENCY } = req.body;
    const db = await getDB();

    const updates = [
      { key: 'SLA_LOW', value: SLA_LOW },
      { key: 'SLA_MEDIUM', value: SLA_MEDIUM },
      { key: 'SLA_HIGH', value: SLA_HIGH },
      { key: 'SLA_EMERGENCY', value: SLA_EMERGENCY }
    ];

    for (const u of updates) {
      if (u.value !== undefined) {
        await db.run(
          `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
          [u.key, u.value.toString()]
        );
      }
    }

    res.json({ message: 'SLA Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
