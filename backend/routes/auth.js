const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDB();
    const user = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let roleDetails = {};
    if (user.role === 'STUDENT') {
      const student = await db.get(`SELECT * FROM students WHERE user_id = ?`, [user.id]);
      roleDetails = { studentId: student?.id, rollNumber: student?.roll_number, hostelBlock: student?.hostel_block, roomNumber: student?.room_number };
    } else if (user.role === 'STAFF') {
      const staff = await db.get(`SELECT * FROM maintenance_staff WHERE user_id = ?`, [user.id]);
      roleDetails = { staffId: staff?.id, department: staff?.department, specialization: staff?.specialization, workload: staff?.current_workload, availability: staff?.availability_status };
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...roleDetails
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ...roleDetails
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during authentication' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const user = await db.get(`SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?`, [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let roleDetails = {};
    if (user.role === 'STUDENT') {
      const student = await db.get(`SELECT * FROM students WHERE user_id = ?`, [user.id]);
      roleDetails = { studentId: student?.id, rollNumber: student?.roll_number, hostelBlock: student?.hostel_block, roomNumber: student?.room_number };
    } else if (user.role === 'STAFF') {
      const staff = await db.get(`SELECT * FROM maintenance_staff WHERE user_id = ?`, [user.id]);
      roleDetails = { staffId: staff?.id, department: staff?.department, specialization: staff?.specialization, workload: staff?.current_workload, availability: staff?.availability_status };
    }

    res.json({
      ...user,
      ...roleDetails
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    const db = await getDB();
    const user = await db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect old password' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// GET /api/auth/accounts - Public endpoint to list all accounts (for login page)
router.get('/accounts', async (req, res) => {
  try {
    const db = await getDB();

    // Fetch all users (no password_hash exposed)
    const users = await db.all(`SELECT id, name, email, role, phone, status, created_at FROM users ORDER BY role, name`);

    // Fetch student details
    const students = await db.all(`SELECT user_id, roll_number, hostel_block, room_number FROM students`);
    const studentMap = {};
    for (const s of students) studentMap[s.user_id] = s;

    // Fetch staff details
    const staffMembers = await db.all(`SELECT user_id, department, specialization, availability_status, current_workload FROM maintenance_staff`);
    const staffMap = {};
    for (const s of staffMembers) staffMap[s.user_id] = s;

    const grouped = { ADMIN: [], STUDENT: [], STAFF: [] };

    for (const user of users) {
      const entry = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status };

      if (user.role === 'STUDENT' && studentMap[user.id]) {
        entry.rollNumber = studentMap[user.id].roll_number;
        entry.hostelBlock = studentMap[user.id].hostel_block;
        entry.roomNumber = studentMap[user.id].room_number;
        entry.detail = `${studentMap[user.id].hostel_block} • Room ${studentMap[user.id].room_number} • ${studentMap[user.id].roll_number}`;
      } else if (user.role === 'STAFF' && staffMap[user.id]) {
        entry.department = staffMap[user.id].department;
        entry.specialization = staffMap[user.id].specialization;
        entry.availability = staffMap[user.id].availability_status;
        entry.workload = staffMap[user.id].current_workload;
        entry.detail = `${staffMap[user.id].department} • ${staffMap[user.id].specialization}`;
      } else if (user.role === 'ADMIN') {
        entry.detail = 'Full System Access';
      }

      if (grouped[user.role]) {
        grouped[user.role].push(entry);
      }
    }

    res.json({ accounts: grouped });
  } catch (err) {
    console.error('Fetch accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

module.exports = router;
