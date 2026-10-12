const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDB } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require Admin
router.use(authenticateToken);

// POST /api/users/student - Create Student Account
router.post('/student', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { name, email, tempPassword, rollNumber, hostelBlock, roomNumber, phone } = req.body;
    if (!name || !email || !tempPassword || !rollNumber || !hostelBlock || !roomNumber) {
      return res.status(400).json({ error: 'All student details are required' });
    }

    const db = await getDB();
    const existing = await db.get(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const userRes = await db.run(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, 'STUDENT', ?)`,
      [name, email, passwordHash, phone || '']
    );

    const studentRes = await db.run(
      `INSERT INTO students (user_id, roll_number, hostel_block, room_number) VALUES (?, ?, ?, ?)`,
      [userRes.lastID, rollNumber, hostelBlock, roomNumber]
    );

    res.status(201).json({
      message: 'Student account created successfully',
      student: {
        userId: userRes.lastID,
        studentId: studentRes.lastID,
        name,
        email,
        rollNumber,
        hostelBlock,
        roomNumber,
        phone
      }
    });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: 'Failed to create student account' });
  }
});

// POST /api/users/staff - Create Maintenance Staff Account
router.post('/staff', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { name, email, tempPassword, department, specialization, phone } = req.body;
    if (!name || !email || !tempPassword || !department || !specialization) {
      return res.status(400).json({ error: 'All staff details are required' });
    }

    const db = await getDB();
    const existing = await db.get(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const userRes = await db.run(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, 'STAFF', ?)`,
      [name, email, passwordHash, phone || '']
    );

    const staffRes = await db.run(
      `INSERT INTO maintenance_staff (user_id, department, specialization, availability_status, current_workload) VALUES (?, ?, ?, 'AVAILABLE', 0)`,
      [userRes.lastID, department, specialization]
    );

    res.status(201).json({
      message: 'Maintenance staff account created successfully',
      staff: {
        userId: userRes.lastID,
        staffId: staffRes.lastID,
        name,
        email,
        department,
        specialization,
        phone
      }
    });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: 'Failed to create staff account' });
  }
});

// GET /api/users/students - List Students
router.get('/students', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const db = await getDB();
    const students = await db.all(`
      SELECT s.id as student_id, u.id as user_id, u.name, u.email, u.phone, u.status,
             s.roll_number, s.hostel_block, s.room_number, u.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY u.name ASC
    `);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/users/staff - List Staff
router.get('/staff', authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const db = await getDB();
    const staff = await db.all(`
      SELECT ms.id as staff_id, u.id as user_id, u.name, u.email, u.phone, u.status,
             ms.department, ms.specialization, ms.availability_status, ms.current_workload,
             (SELECT COUNT(*) FROM complaints c WHERE c.assigned_staff_id = ms.id AND c.status = 'RESOLVED') as completed_tasks,
             (SELECT ROUND(AVG(f.rating), 1) FROM feedback f JOIN complaints c ON f.complaint_id = c.id WHERE c.assigned_staff_id = ms.id) as avg_rating
      FROM maintenance_staff ms
      JOIN users u ON ms.user_id = u.id
      ORDER BY ms.current_workload ASC, u.name ASC
    `);
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

module.exports = router;
