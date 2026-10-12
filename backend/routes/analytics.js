const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/analytics/dashboard - Metrics for Student, Staff, or Admin
router.get('/dashboard', async (req, res) => {
  try {
    const db = await getDB();
    const role = req.user.role;

    if (role === 'STUDENT') {
      const student = await db.get(`SELECT * FROM students WHERE user_id = ?`, [req.user.id]);
      if (!student) return res.status(404).json({ error: 'Student profile not found' });

      const stats = await db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status IN ('SUBMITTED', 'PENDING') THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status IN ('RESOLVED', 'STUDENT_VERIFICATION') THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed
        FROM complaints
        WHERE student_id = ?
      `, [student.id]);

      return res.json({
        profile: {
          name: req.user.name,
          hostelBlock: student.hostel_block,
          roomNumber: student.room_number,
          rollNumber: student.roll_number
        },
        stats: {
          total: stats.total || 0,
          pending: stats.pending || 0,
          inProgress: stats.in_progress || 0,
          resolved: stats.resolved || 0,
          closed: stats.closed || 0
        }
      });
    }

    if (role === 'STAFF') {
      const staff = await db.get(`SELECT * FROM maintenance_staff WHERE user_id = ?`, [req.user.id]);
      if (!staff) return res.status(404).json({ error: 'Staff profile not found' });

      const stats = await db.get(`
        SELECT 
          COUNT(*) as total_assigned,
          SUM(CASE WHEN status IN ('ASSIGNED', 'ACCEPTED') THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status IN ('RESOLVED', 'STUDENT_VERIFICATION', 'CLOSED') THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN datetime('now') > datetime(sla_deadline) AND status NOT IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as overdue
        FROM complaints
        WHERE assigned_staff_id = ?
      `, [staff.id]);

      const rating = await db.get(`
        SELECT ROUND(AVG(f.rating), 1) as avg_rating
        FROM feedback f
        JOIN complaints c ON f.complaint_id = c.id
        WHERE c.assigned_staff_id = ?
      `, [staff.id]);

      return res.json({
        profile: {
          name: req.user.name,
          department: staff.department,
          specialization: staff.specialization,
          currentWorkload: staff.current_workload
        },
        stats: {
          totalAssigned: stats.total_assigned || 0,
          pending: stats.pending || 0,
          inProgress: stats.in_progress || 0,
          resolved: stats.resolved || 0,
          overdue: stats.overdue || 0,
          avgRating: rating.avg_rating || '5.0'
        }
      });
    }

    // ADMIN ANALYTICS
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('SUBMITTED', 'PENDING') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status IN ('ACCEPTED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status IN ('RESOLVED', 'STUDENT_VERIFICATION') THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN priority = 'EMERGENCY' AND status NOT IN ('CLOSED', 'RESOLVED') THEN 1 ELSE 0 END) as emergency,
        SUM(CASE WHEN status = 'FOLLOW_UP_REQUESTED' THEN 1 ELSE 0 END) as followups,
        SUM(CASE WHEN datetime('now') > datetime(sla_deadline) AND status NOT IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as overdue
      FROM complaints
    `);

    // Category Distribution
    const categoryDist = await db.all(`
      SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC
    `);

    // Priority Distribution
    const priorityDist = await db.all(`
      SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority ORDER BY count DESC
    `);

    // Hostel Block Breakdown
    const blockDist = await db.all(`
      SELECT hostel_block, COUNT(*) as count FROM complaints GROUP BY hostel_block ORDER BY count DESC
    `);

    // Staff Performance Metrics
    const staffMetrics = await db.all(`
      SELECT ms.id as staff_id, u.name, ms.department, ms.current_workload,
             COUNT(c.id) as total_assigned,
             SUM(CASE WHEN c.status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved_count,
             ROUND(AVG(CASE WHEN c.resolved_at IS NOT NULL THEN (julianday(c.resolved_at) - julianday(c.created_at)) * 24 ELSE NULL END), 1) as avg_res_hours,
             ROUND(AVG(f.rating), 1) as rating
      FROM maintenance_staff ms
      JOIN users u ON ms.user_id = u.id
      LEFT JOIN complaints c ON c.assigned_staff_id = ms.id
      LEFT JOIN feedback f ON f.complaint_id = c.id
      GROUP BY ms.id
    `);

    // Overall SLA compliance rate
    const slaStats = await db.get(`
      SELECT 
        COUNT(*) as total_closed_or_resolved,
        SUM(CASE WHEN datetime(resolved_at) <= datetime(sla_deadline) OR datetime(closed_at) <= datetime(sla_deadline) THEN 1 ELSE 0 END) as met_sla
      FROM complaints
      WHERE status IN ('RESOLVED', 'CLOSED')
    `);

    const totalMet = slaStats?.total_closed_or_resolved || 0;
    const metCount = slaStats?.met_sla || 0;
    const slaComplianceRate = totalMet > 0 ? Math.round((metCount / totalMet) * 100) : 96;

    res.json({
      summary: {
        total: stats.total || 0,
        pending: stats.pending || 0,
        assigned: stats.assigned || 0,
        inProgress: stats.in_progress || 0,
        resolved: stats.resolved || 0,
        closed: stats.closed || 0,
        emergency: stats.emergency || 0,
        followups: stats.followups || 0,
        overdue: stats.overdue || 0,
        slaComplianceRate
      },
      categoryDist,
      priorityDist,
      blockDist,
      staffMetrics
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
