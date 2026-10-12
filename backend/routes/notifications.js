const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/notifications - List notifications for user
router.get('/', async (req, res) => {
  try {
    const db = await getDB();
    const notifications = await db.all(`
      SELECT n.*, c.complaint_code
      FROM notifications n
      LEFT JOIN complaints c ON n.complaint_id = c.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    const unreadCount = await db.get(`
      SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0
    `, [req.user.id]);

    res.json({
      notifications,
      unreadCount: unreadCount ? unreadCount.unread : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/mark-read - Mark individual or all notifications read
router.post('/mark-read', async (req, res) => {
  try {
    const { notificationId, markAll } = req.body;
    const db = await getDB();

    if (markAll) {
      await db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id]);
    } else if (notificationId) {
      await db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [notificationId, req.user.id]);
    }

    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;
