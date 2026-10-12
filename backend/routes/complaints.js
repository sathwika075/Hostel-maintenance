const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { getDB } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Multer storage configuration for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'photo-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper to calculate SLA deadline
async function getSlaHours(db, priority) {
  const settingKey = `SLA_${priority.toUpperCase()}`;
  const row = await db.get(`SELECT value FROM settings WHERE key = ?`, [settingKey]);
  if (row) return parseInt(row.value, 10);
  const defaults = { EMERGENCY: 2, HIGH: 8, MEDIUM: 24, LOW: 48 };
  return defaults[priority.toUpperCase()] || 24;
}

// Helper to create notifications
async function createNotification(db, userId, complaintId, message, type) {
  try {
    await db.run(
      `INSERT INTO notifications (user_id, complaint_id, message, notification_type) VALUES (?, ?, ?, ?)`,
      [userId, complaintId, message, type]
    );
  } catch (err) {
    console.error('Notification creation error:', err);
  }
}

// Helper to insert complaint history
async function addHistory(db, complaintId, oldStatus, newStatus, changedBy, remarks) {
  await db.run(
    `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
    [complaintId, oldStatus, newStatus, changedBy, remarks || '']
  );
}

// GET /api/complaints - List complaints based on user role & query filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const { category, priority, status, block, staffId, search } = req.query;

    let query = `
      SELECT c.*, 
             u_std.name as student_name, s_std.roll_number, s_std.hostel_block,
             u_stf.name as staff_name, ms.department as staff_department,
             (SELECT rating FROM feedback f WHERE f.complaint_id = c.id) as rating
      FROM complaints c
      JOIN students s_std ON c.student_id = s_std.id
      JOIN users u_std ON s_std.user_id = u_std.id
      LEFT JOIN maintenance_staff ms ON c.assigned_staff_id = ms.id
      LEFT JOIN users u_stf ON ms.user_id = u_stf.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based restrictions
    if (req.user.role === 'STUDENT') {
      const student = await db.get(`SELECT id FROM students WHERE user_id = ?`, [req.user.id]);
      if (!student) return res.json([]);
      query += ` AND c.student_id = ?`;
      params.push(student.id);
    } else if (req.user.role === 'STAFF') {
      const staff = await db.get(`SELECT id FROM maintenance_staff WHERE user_id = ?`, [req.user.id]);
      if (!staff) return res.json([]);
      // Staff see assigned complaints OR unassigned "Direct Help" complaints
      query += ` AND (c.assigned_staff_id = ? OR (c.category = 'Direct Help' AND c.assigned_staff_id IS NULL))`;
      params.push(staff.id);
    }

    // Additional Filters
    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }
    if (priority) {
      query += ` AND c.priority = ?`;
      params.push(priority);
    }
    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    if (block) {
      query += ` AND c.hostel_block = ?`;
      params.push(block);
    }
    if (staffId) {
      query += ` AND c.assigned_staff_id = ?`;
      params.push(staffId);
    }
    if (search) {
      query += ` AND (c.complaint_code LIKE ? OR c.description LIKE ? OR c.room_number LIKE ? OR u_std.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY CASE WHEN c.priority = 'EMERGENCY' THEN 1 WHEN c.priority = 'HIGH' THEN 2 WHEN c.priority = 'MEDIUM' THEN 3 ELSE 4 END, c.created_at DESC`;

    const complaints = await db.all(query, params);
    res.json(complaints);
  } catch (err) {
    console.error('Fetch complaints error:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// GET /api/complaints/:id - Detailed complaint view with timeline, photos, history, follow-up, feedback
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const id = req.params.id;

    const complaint = await db.get(`
      SELECT c.*, 
             u_std.name as student_name, u_std.email as student_email, u_std.phone as student_phone,
             s_std.roll_number, s_std.hostel_block, s_std.room_number,
             u_stf.name as staff_name, u_stf.phone as staff_phone, u_stf.email as staff_email,
             ms.department as staff_department, ms.specialization as staff_specialization
      FROM complaints c
      JOIN students s_std ON c.student_id = s_std.id
      JOIN users u_std ON s_std.user_id = u_std.id
      LEFT JOIN maintenance_staff ms ON c.assigned_staff_id = ms.id
      LEFT JOIN users u_stf ON ms.user_id = u_stf.id
      WHERE c.id = ? OR c.complaint_code = ?
    `, [id, id]);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Role safety check
    if (req.user.role === 'STUDENT') {
      const student = await db.get(`SELECT id FROM students WHERE user_id = ?`, [req.user.id]);
      if (complaint.student_id !== student?.id) {
        return res.status(403).json({ error: 'Access denied to this complaint' });
      }
    } else if (req.user.role === 'STAFF') {
      const staff = await db.get(`SELECT id FROM maintenance_staff WHERE user_id = ?`, [req.user.id]);
      const isAssignedToThem = complaint.assigned_staff_id === staff?.id;
      const isUnassignedDirectHelp = complaint.category === 'Direct Help' && complaint.assigned_staff_id === null;
      if (!isAssignedToThem && !isUnassignedDirectHelp) {
        return res.status(403).json({ error: 'Access denied to this complaint' });
      }
    }

    // Fetch related records
    const photos = await db.all(`
      SELECT p.*, u.name as uploader_name, u.role as uploader_role
      FROM complaint_photos p
      JOIN users u ON p.uploaded_by = u.id
      WHERE p.complaint_id = ?
      ORDER BY p.uploaded_at ASC
    `, [complaint.id]);

    const history = await db.all(`
      SELECT h.*, u.name as changed_by_name, u.role as changed_by_role
      FROM complaint_history h
      JOIN users u ON h.changed_by = u.id
      WHERE h.complaint_id = ?
      ORDER BY h.timestamp ASC
    `, [complaint.id]);

    const followups = await db.all(`
      SELECT * FROM followup_requests WHERE complaint_id = ? ORDER BY created_at DESC
    `, [complaint.id]);

    const feedback = await db.get(`
      SELECT * FROM feedback WHERE complaint_id = ?
    `, [complaint.id]);

    res.json({
      ...complaint,
      photos,
      history,
      followups,
      feedback
    });
  } catch (err) {
    console.error('Fetch complaint detail error:', err);
    res.status(500).json({ error: 'Failed to fetch complaint details' });
  }
});

// POST /api/complaints - Raise Complaint (Student)
router.post('/', authenticateToken, authorizeRoles('STUDENT'), upload.single('photo'), async (req, res) => {
  try {
    const { category, priority = 'MEDIUM', description, roomNumber } = req.body;
    if (!category || !description || !roomNumber) {
      return res.status(400).json({ error: 'Category, description, and room number are required' });
    }

    const db = await getDB();
    const student = await db.get(`SELECT * FROM students WHERE user_id = ?`, [req.user.id]);
    if (!student) {
      return res.status(400).json({ error: 'Student profile not found' });
    }

    // Auto-generate Complaint Code: CMP-2026-XXXXX
    const countRow = await db.get(`SELECT COUNT(*) as count FROM complaints`);
    const nextSeq = (countRow.count + 1).toString().padStart(5, '0');
    const complaintCode = `CMP-2026-${nextSeq}`;

    // SLA Calculation
    const slaHours = await getSlaHours(db, priority);
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const resComp = await db.run(
      `INSERT INTO complaints (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, sla_hours, sla_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?)`,
      [complaintCode, student.id, category, priority, description, roomNumber, student.hostel_block, slaHours, slaDeadline]
    );

    const complaintId = resComp.lastID;

    // Save uploaded photo if provided
    if (req.file) {
      const photoUrl = `/uploads/${req.file.filename}`;
      await db.run(
        `INSERT INTO complaint_photos (complaint_id, photo_url, photo_type, uploaded_by) VALUES (?, ?, 'STUDENT_PROBLEM', ?)`,
        [complaintId, photoUrl, req.user.id]
      );
    }

    // Record history
    await addHistory(db, complaintId, null, 'SUBMITTED', req.user.id, 'Complaint raised by student');
    await addHistory(db, complaintId, 'SUBMITTED', 'PENDING', req.user.id, 'Under review by hostel admin');
    
    // Update status to PENDING
    await db.run(`UPDATE complaints SET status = 'PENDING' WHERE id = ?`, [complaintId]);

    // Notify Admins
    const admins = await db.all(`SELECT id FROM users WHERE role = 'ADMIN'`);
    for (const admin of admins) {
      const msg = priority === 'EMERGENCY'
        ? `🚨 EMERGENCY COMPLAINT ${complaintCode} submitted in ${student.hostel_block} Room ${roomNumber}!`
        : `New complaint ${complaintCode} (${category}) submitted by ${req.user.name}.`;
      await createNotification(db, admin.id, complaintId, msg, priority === 'EMERGENCY' ? 'EMERGENCY_SUBMITTED' : 'COMPLAINT_SUBMITTED');
    }

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaintId,
      complaintCode,
      status: 'PENDING',
      slaDeadline
    });
  } catch (err) {
    console.error('Raise complaint error:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// GET /api/complaints/:id/recommend-staff - Rule-based staff recommendation (Admin)
router.get('/:id/recommend-staff', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const db = await getDB();
    const complaint = await db.get(`SELECT category FROM complaints WHERE id = ?`, [req.params.id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    // Map complaint categories to maintenance departments
    const categoryToDept = {
      'Electrical': 'Electrical',
      'AC / Fan': 'Electrical',
      'Lights': 'Electrical',
      'Plumbing': 'Plumbing',
      'Bathroom': 'Plumbing',
      'Furniture': 'Furniture',
      'Cleaning': 'Housekeeping',
      'Room Maintenance': 'Civil / Carpentry',
      'Wi-Fi / Internet': 'IT & Network',
      'Other': 'General Maintenance'
    };

    const targetDept = categoryToDept[complaint.category] || 'General Maintenance';

    const staffList = await db.all(`
      SELECT ms.id as staff_id, u.id as user_id, u.name, u.email, u.phone,
             ms.department, ms.specialization, ms.availability_status, ms.current_workload,
             CASE WHEN LOWER(ms.department) = LOWER(?) THEN 1 ELSE 0 END as is_dept_match
      FROM maintenance_staff ms
      JOIN users u ON ms.user_id = u.id
      ORDER BY is_dept_match DESC, ms.current_workload ASC, u.name ASC
    `, [targetDept]);

    res.json({
      targetDepartment: targetDept,
      recommendedStaffId: staffList.length > 0 ? staffList[0].staff_id : null,
      staff: staffList
    });
  } catch (err) {
    console.error('Recommend staff error:', err);
    res.status(500).json({ error: 'Failed to fetch staff recommendations' });
  }
});

// POST /api/complaints/:id/assign - Assign or Reassign Staff (Admin)
router.post('/:id/assign', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { staffId, remarks } = req.body;
    if (!staffId) return res.status(400).json({ error: 'Staff member ID is required' });

    const db = await getDB();
    const complaint = await db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const staff = await db.get(`
      SELECT ms.*, u.name as staff_name, u.id as staff_user_id
      FROM maintenance_staff ms
      JOIN users u ON ms.user_id = u.id
      WHERE ms.id = ?
    `, [staffId]);

    if (!staff) return res.status(400).json({ error: 'Selected staff member does not exist' });

    const oldStatus = complaint.status;
    const oldStaffId = complaint.assigned_staff_id;

    // Decrement old staff workload if reassigned
    if (oldStaffId && oldStaffId !== staffId) {
      await db.run(`UPDATE maintenance_staff SET current_workload = MAX(0, current_workload - 1) WHERE id = ?`, [oldStaffId]);
    }

    // Increment new staff workload
    await db.run(`UPDATE maintenance_staff SET current_workload = current_workload + 1 WHERE id = ?`, [staffId]);

    // Update complaint record
    const nowIso = new Date().toISOString();
    await db.run(
      `UPDATE complaints SET assigned_staff_id = ?, status = 'ASSIGNED', assigned_at = ? WHERE id = ?`,
      [staffId, nowIso, complaint.id]
    );

    // Record assignment history
    await db.run(
      `INSERT INTO complaint_assignments (complaint_id, staff_id, assigned_by) VALUES (?, ?, ?)`,
      [complaint.id, staffId, req.user.id]
    );

    await addHistory(
      db, complaint.id, oldStatus, 'ASSIGNED', req.user.id,
      remarks || `Assigned to maintenance staff ${staff.staff_name} (${staff.department})`
    );

    // Notify assigned staff
    await createNotification(
      db, staff.user_id, complaint.id,
      `New complaint ${complaint.complaint_code} (${complaint.category}, Priority: ${complaint.priority}) assigned to you in Room ${complaint.room_number}.`,
      'TASK_ASSIGNED'
    );

    // Notify student
    const studentUser = await db.get(`SELECT user_id FROM students WHERE id = ?`, [complaint.student_id]);
    if (studentUser) {
      await createNotification(
        db, studentUser.user_id, complaint.id,
        `Your complaint ${complaint.complaint_code} has been assigned to ${staff.staff_name} (${staff.department}).`,
        'COMPLAINT_ASSIGNED'
      );
    }

    res.json({ message: 'Staff assigned successfully', status: 'ASSIGNED', staffName: staff.staff_name });
  } catch (err) {
    console.error('Assign staff error:', err);
    res.status(500).json({ error: 'Failed to assign staff' });
  }
});

// POST /api/complaints/:id/update-admin - Change Category / Priority (Admin)
router.post('/:id/update-admin', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { category, priority } = req.body;
    const db = await getDB();
    const complaint = await db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    let updated = false;
    let remarks = [];

    if (category && category !== complaint.category) {
      await db.run(`UPDATE complaints SET category = ? WHERE id = ?`, [category, complaint.id]);
      remarks.push(`Category updated from ${complaint.category} to ${category}`);
      updated = true;
    }

    if (priority && priority !== complaint.priority) {
      const slaHours = await getSlaHours(db, priority);
      const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();
      await db.run(
        `UPDATE complaints SET priority = ?, sla_hours = ?, sla_deadline = ? WHERE id = ?`,
        [priority, slaHours, slaDeadline, complaint.id]
      );
      remarks.push(`Priority updated from ${complaint.priority} to ${priority} (SLA: ${slaHours}h)`);
      updated = true;

      // Notify assigned staff if priority changed
      if (complaint.assigned_staff_id) {
        const staff = await db.get(`SELECT user_id FROM maintenance_staff WHERE id = ?`, [complaint.assigned_staff_id]);
        if (staff) {
          await createNotification(
            db, staff.user_id, complaint.id,
            `Priority for assigned complaint ${complaint.complaint_code} updated to ${priority}.`,
            'PRIORITY_CHANGED'
          );
        }
      }
    }

    if (updated) {
      await addHistory(db, complaint.id, complaint.status, complaint.status, req.user.id, remarks.join('. '));
    }

    res.json({ message: 'Complaint parameters updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update complaint parameters' });
  }
});

// POST /api/complaints/:id/accept - Staff Accept Task
router.post('/:id/accept', authenticateToken, authorizeRoles('STAFF'), async (req, res) => {
  try {
    const db = await getDB();
    const staff = await db.get(`SELECT id FROM maintenance_staff WHERE user_id = ?`, [req.user.id]);
    const complaint = await db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const isAssignedToThem = complaint.assigned_staff_id === staff?.id;
    const isUnassignedDirectHelp = complaint.category === 'Direct Help' && complaint.assigned_staff_id === null;

    if (!isAssignedToThem && !isUnassignedDirectHelp) {
      return res.status(403).json({ error: 'Unauthorized action on this complaint' });
    }

    const nowIso = new Date().toISOString();

    if (isUnassignedDirectHelp) {
      await db.run(`UPDATE complaints SET assigned_staff_id = ?, assigned_at = ? WHERE id = ?`, [staff.id, nowIso, complaint.id]);
      await db.run(`INSERT INTO complaint_assignments (complaint_id, staff_id, assigned_by) VALUES (?, ?, ?)`, [complaint.id, staff.id, req.user.id]);
      await db.run(`UPDATE maintenance_staff SET current_workload = current_workload + 1 WHERE id = ?`, [staff.id]);
    }

    await db.run(`UPDATE complaints SET status = 'ACCEPTED' WHERE id = ?`, [complaint.id]);
    await db.run(`UPDATE complaint_assignments SET accepted_at = ? WHERE complaint_id = ? AND staff_id = ?`, [nowIso, complaint.id, staff.id]);

    await addHistory(db, complaint.id, complaint.status, 'ACCEPTED', req.user.id, 'Staff accepted maintenance task');

    // Notify Student
    const studentUser = await db.get(`SELECT user_id FROM students WHERE id = ?`, [complaint.student_id]);
    if (studentUser) {
      await createNotification(
        db, studentUser.user_id, complaint.id,
        `Maintenance staff has accepted your complaint ${complaint.complaint_code}.`,
        'STAFF_ACCEPTED'
      );
    }

    res.json({ message: 'Task accepted', status: 'ACCEPTED' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept task' });
  }
});

// POST /api/complaints/:id/start-work - Staff Start Work & Upload Before Photo
router.post('/:id/start-work', authenticateToken, authorizeRoles('STAFF'), upload.single('beforePhoto'), async (req, res) => {
  try {
    const db = await getDB();
    const staff = await db.get(`SELECT id FROM maintenance_staff WHERE user_id = ?`, [req.user.id]);
    const complaint = await db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);

    if (!complaint || complaint.assigned_staff_id !== staff?.id) {
      return res.status(403).json({ error: 'Unauthorized action on this complaint' });
    }

    const nowIso = new Date().toISOString();
    await db.run(`UPDATE complaints SET status = 'IN_PROGRESS', started_at = ? WHERE id = ?`, [nowIso, complaint.id]);

    if (req.file) {
      const photoUrl = `/uploads/${req.file.filename}`;
      await db.run(
        `INSERT INTO complaint_photos (complaint_id, photo_url, photo_type, uploaded_by) VALUES (?, ?, 'BEFORE_REPAIR', ?)`,
        [complaint.id, photoUrl, req.user.id]
      );
    }

    await addHistory(db, complaint.id, complaint.status, 'IN_PROGRESS', req.user.id, 'Staff arrived on-site and started repair work.');

    // Notify Student
    const studentUser = await db.get(`SELECT user_id FROM students WHERE id = ?`, [complaint.student_id]);
    if (studentUser) {
      await createNotification(
        db, studentUser.user_id, complaint.id,
        `Repair work initiated for complaint ${complaint.complaint_code} in Room ${complaint.room_number}.`,
        'WORK_STARTED'
      );
    }

    res.json({ message: 'Work started', status: 'IN_PROGRESS' });
  } catch (err) {
    console.error('Start work error:', err);
    res.status(500).json({ error: 'Failed to start work' });
  }
});

// POST /api/complaints/:id/mark-resolved - Staff Resolve Task & Upload After Photo
router.post('/:id/mark-resolved', authenticateToken, authorizeRoles('STAFF'), upload.single('afterPhoto'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const db = await getDB();
    const staff = await db.get(`SELECT id FROM maintenance_staff WHERE user_id = ?`, [req.user.id]);
    const complaint = await db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);

    if (!complaint || complaint.assigned_staff_id !== staff?.id) {
      return res.status(403).json({ error: 'Unauthorized action on this complaint' });
    }

    const nowIso = new Date().toISOString();

    if (req.file) {
      const photoUrl = `/uploads/${req.file.filename}`;
      await db.run(
        `INSERT INTO complaint_photos (complaint_id, photo_url, photo_type, uploaded_by) VALUES (?, ?, 'AFTER_REPAIR', ?)`,
        [complaint.id, photoUrl, req.user.id]
      );
    }

    await db.run(
      `UPDATE complaints SET status = 'RESOLVED', resolved_at = ? WHERE id = ?`,
      [nowIso, complaint.id]
    );

    // Reduce staff workload
    await db.run(`UPDATE maintenance_staff SET current_workload = MAX(0, current_workload - 1) WHERE id = ?`, [staff.id]);

    await addHistory(db, complaint.id, 'IN_PROGRESS', 'RESOLVED', req.user.id, remarks || 'Repair completed by maintenance staff.');
    await addHistory(db, complaint.id, 'RESOLVED', 'STUDENT_VERIFICATION', req.user.id, 'Awaiting verification from student.');

    // Notify Student to verify
    const studentUser = await db.get(`SELECT user_id FROM students WHERE id = ?`, [complaint.student_id]);
    if (studentUser) {
      await createNotification(
        db, studentUser.user_id, complaint.id,
        `Your complaint ${complaint.complaint_code} has been marked as resolved! Please verify and provide feedback.`,
        'COMPLAINT_RESOLVED'
      );
    }

    res.json({ message: 'Complaint marked as resolved', status: 'RESOLVED' });
  } catch (err) {
    console.error('Mark resolved error:', err);
    res.status(500).json({ error: 'Failed to resolve complaint' });
  }
});

// POST /api/complaints/:id/verify-close - Student Confirm Resolution
router.post('/:id/verify-close', authenticateToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const db = await getDB();
    const student = await db.get(`SELECT id FROM students WHERE user_id = ?`, [req.user.id]);
    const complaint = await db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);

    if (!complaint || complaint.student_id !== student?.id) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    const nowIso = new Date().toISOString();
    await db.run(`UPDATE complaints SET status = 'CLOSED', closed_at = ? WHERE id = ?`, [nowIso, complaint.id]);

    await addHistory(db, complaint.id, complaint.status, 'CLOSED', req.user.id, 'Student confirmed resolution satisfaction.');

    res.json({ message: 'Complaint closed successfully', status: 'CLOSED' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to close complaint' });
  }
});

// POST /api/complaints/:id/follow-up - Student Need Help / Follow-up Request
router.post('/:id/follow-up', authenticateToken, authorizeRoles('STUDENT'), upload.single('followupPhoto'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Follow-up reason is required' });

    const db = await getDB();
    const student = await db.get(`SELECT id FROM students WHERE user_id = ?`, [req.user.id]);
    const complaint = await db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);

    if (!complaint || complaint.student_id !== student?.id) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    // Save follow-up photo if uploaded
    if (req.file) {
      const photoUrl = `/uploads/${req.file.filename}`;
      await db.run(
        `INSERT INTO complaint_photos (complaint_id, photo_url, photo_type, uploaded_by) VALUES (?, ?, 'FOLLOW_UP', ?)`,
        [complaint.id, photoUrl, req.user.id]
      );
    }

    await db.run(
      `INSERT INTO followup_requests (complaint_id, student_id, reason, status) VALUES (?, ?, ?, 'REQUESTED')`,
      [complaint.id, student.id, reason]
    );

    const oldStatus = complaint.status;
    await db.run(`UPDATE complaints SET status = 'FOLLOW_UP_REQUESTED' WHERE id = ?`, [complaint.id]);

    await addHistory(db, complaint.id, oldStatus, 'FOLLOW_UP_REQUESTED', req.user.id, `Student requested follow-up: "${reason}"`);

    // Increment staff workload again
    if (complaint.assigned_staff_id) {
      await db.run(`UPDATE maintenance_staff SET current_workload = current_workload + 1 WHERE id = ?`, [complaint.assigned_staff_id]);
      const staffUser = await db.get(`SELECT user_id FROM maintenance_staff WHERE id = ?`, [complaint.assigned_staff_id]);
      if (staffUser) {
        await createNotification(
          db, staffUser.user_id, complaint.id,
          `Follow-up requested on complaint ${complaint.complaint_code}: "${reason}".`,
          'FOLLOW_UP_REQUESTED'
        );
      }
    }

    // Notify Admin
    const admins = await db.all(`SELECT id FROM users WHERE role = 'ADMIN'`);
    for (const admin of admins) {
      await createNotification(
        db, admin.id, complaint.id,
        `Follow-up requested on complaint ${complaint.complaint_code} in Room ${complaint.room_number}.`,
        'FOLLOW_UP_REQUESTED'
      );
    }

    res.json({ message: 'Follow-up request submitted', status: 'FOLLOW_UP_REQUESTED' });
  } catch (err) {
    console.error('Follow-up request error:', err);
    res.status(500).json({ error: 'Failed to submit follow-up request' });
  }
});

// POST /api/complaints/:id/resolve-followup - Staff Resolve Follow-up
router.post('/:id/resolve-followup', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { followupId, remarks } = req.body;
    const db = await getDB();

    const nowIso = new Date().toISOString();
    await db.run(
      `UPDATE followup_requests SET status = 'RESOLVED', resolved_at = ?, staff_remarks = ? WHERE id = ?`,
      [nowIso, remarks || 'Re-inspected and resolved', followupId]
    );

    const complaint = await db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
    await db.run(`UPDATE complaints SET status = 'RESOLVED', resolved_at = ? WHERE id = ?`, [nowIso, complaint.id]);

    if (complaint.assigned_staff_id) {
      await db.run(`UPDATE maintenance_staff SET current_workload = MAX(0, current_workload - 1) WHERE id = ?`, [complaint.assigned_staff_id]);
    }

    await addHistory(db, complaint.id, 'FOLLOW_UP_REQUESTED', 'RESOLVED', req.user.id, remarks || 'Follow-up re-inspection and repair completed.');

    // Notify Student
    const studentUser = await db.get(`SELECT user_id FROM students WHERE id = ?`, [complaint.student_id]);
    if (studentUser) {
      await createNotification(
        db, studentUser.user_id, complaint.id,
        `Follow-up on complaint ${complaint.complaint_code} has been resolved! Please verify.`,
        'FOLLOW_UP_RESOLVED'
      );
    }

    res.json({ message: 'Follow-up resolved', status: 'RESOLVED' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve follow-up' });
  }
});

// POST /api/complaints/:id/feedback - Student Rating & Feedback
router.post('/:id/feedback', authenticateToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating between 1 and 5 is required' });
    }

    const db = await getDB();
    const student = await db.get(`SELECT id FROM students WHERE user_id = ?`, [req.user.id]);
    const complaint = await db.get(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);

    if (!complaint || complaint.student_id !== student?.id) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    await db.run(
      `INSERT OR REPLACE INTO feedback (complaint_id, student_id, rating, comment) VALUES (?, ?, ?, ?)`,
      [complaint.id, student.id, rating, comment || '']
    );

    res.json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;
