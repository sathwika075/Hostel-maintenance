const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

// GET /api/reports/summary - Generate report dataset
router.get('/summary', async (req, res) => {
  try {
    const { reportType = 'monthly', block, category } = req.query;
    const db = await getDB();

    let query = `
      SELECT c.complaint_code, c.category, c.priority, c.hostel_block, c.room_number, c.status,
             u_std.name as student_name, s_std.roll_number,
             u_stf.name as staff_name, ms.department as staff_department,
             c.created_at, c.resolved_at, c.closed_at, c.sla_hours,
             (CASE WHEN datetime('now') > datetime(c.sla_deadline) AND c.status NOT IN ('RESOLVED', 'CLOSED') THEN 'BREACHED' ELSE 'MET' END) as sla_status,
             f.rating, f.comment as feedback_comment
      FROM complaints c
      JOIN students s_std ON c.student_id = s_std.id
      JOIN users u_std ON s_std.user_id = u_std.id
      LEFT JOIN maintenance_staff ms ON c.assigned_staff_id = ms.id
      LEFT JOIN users u_stf ON ms.user_id = u_stf.id
      LEFT JOIN feedback f ON f.complaint_id = c.id
      WHERE 1=1
    `;

    const params = [];
    if (block) {
      query += ` AND c.hostel_block = ?`;
      params.push(block);
    }
    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY c.created_at DESC`;

    const records = await db.all(query, params);

    res.json({
      reportType,
      generatedAt: new Date().toISOString(),
      totalRecords: records.length,
      records
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
