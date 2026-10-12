const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'hostelcare.db');

let dbInstance = null;

async function getDB() {
  if (dbInstance) return dbInstance;
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await dbInstance.run('PRAGMA foreign_keys = ON;');
  return dbInstance;
}

async function initDB() {
  const db = await getDB();

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('STUDENT', 'ADMIN', 'STAFF')),
      phone TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      hostel_block TEXT NOT NULL,
      room_number TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maintenance_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      department TEXT NOT NULL,
      specialization TEXT NOT NULL,
      availability_status TEXT DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'BUSY', 'OFF_DUTY')),
      current_workload INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_code TEXT UNIQUE NOT NULL,
      student_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')),
      description TEXT NOT NULL,
      room_number TEXT NOT NULL,
      hostel_block TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      assigned_staff_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_at DATETIME,
      started_at DATETIME,
      resolved_at DATETIME,
      closed_at DATETIME,
      sla_hours INTEGER NOT NULL DEFAULT 24,
      sla_deadline DATETIME,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (assigned_staff_id) REFERENCES maintenance_staff(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      photo_url TEXT NOT NULL,
      photo_type TEXT NOT NULL CHECK (photo_type IN ('STUDENT_PROBLEM', 'BEFORE_REPAIR', 'AFTER_REPAIR', 'FOLLOW_UP')),
      uploaded_by INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES maintenance_staff(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      remarks TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS followup_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'IN_PROGRESS', 'RESOLVED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      staff_remarks TEXT,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER UNIQUE NOT NULL,
      student_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      complaint_id INTEGER,
      message TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );
  `);

  // Default SLA Settings
  const defaultSla = [
    { key: 'SLA_LOW', value: '48' },
    { key: 'SLA_MEDIUM', value: '24' },
    { key: 'SLA_HIGH', value: '8' },
    { key: 'SLA_EMERGENCY', value: '2' }
  ];

  for (const s of defaultSla) {
    await db.run(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      [s.key, s.value]
    );
  }

  // Seed default demo accounts if not exist
  await seedDemoData(db);
}

async function seedDemoData(db) {
  const existingUser = await db.get(`SELECT id FROM users WHERE email = ?`, ['admin@hostelcare.demo']);
  if (existingUser) return; // already seeded

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Admin
  const adminRes = await db.run(
    `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`,
    ['Chief Warden Dr. Ramesh Sharma', 'admin@hostelcare.demo', passwordHash, 'ADMIN', '+91 98765 43210']
  );
  const adminId = adminRes.lastID;

  // 2. Maintenance Staff
  const staffMembers = [
    { name: 'Ravi Kumar', email: 'staff@hostelcare.demo', phone: '+91 98765 11111', dept: 'Plumbing', spec: 'Pipe Repair, Tap Leakage, Bathroom Fitting', workload: 2 },
    { name: 'Suresh Verma', email: 'suresh.electric@hostelcare.demo', phone: '+91 98765 22222', dept: 'Electrical', spec: 'Wiring, MCB, Switchboard, Light Fitting', workload: 1 },
    { name: 'Amit Singh', email: 'amit.carpenter@hostelcare.demo', phone: '+91 98765 33333', dept: 'Furniture', spec: 'Desk Repair, Door Locks, Bed Frame', workload: 0 },
    { name: 'Rajesh Carpenter', email: 'rajesh.plumb@hostelcare.demo', phone: '+91 98765 44444', dept: 'Plumbing', spec: 'Drain Blockage, Tank Leakage', workload: 5 },
    { name: 'Vikram Wi-Fi Tech', email: 'vikram.net@hostelcare.demo', phone: '+91 98765 55555', dept: 'IT & Network', spec: 'Wi-Fi Access Point, LAN Cable', workload: 1 },
  ];

  const staffDbIds = [];
  for (const s of staffMembers) {
    const u = await db.run(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`,
      [s.name, s.email, passwordHash, 'STAFF', s.phone]
    );
    const st = await db.run(
      `INSERT INTO maintenance_staff (user_id, department, specialization, availability_status, current_workload) VALUES (?, ?, ?, 'AVAILABLE', ?)`,
      [u.lastID, s.dept, s.spec, s.workload]
    );
    staffDbIds.push({ userId: u.lastID, staffId: st.lastID, name: s.name, dept: s.dept });
  }

  // 3. Students
  const students = [
    { name: 'Yash Vardhan', email: 'student@hostelcare.demo', phone: '+91 91234 56789', roll: '2024-CS-102', block: 'Block A', room: 'A-204' },
    { name: 'Ananya Sharma', email: 'ananya.student@hostelcare.demo', phone: '+91 91234 56790', roll: '2024-EC-084', block: 'Block B', room: 'B-108' },
    { name: 'Rohan Gupta', email: 'rohan.student@hostelcare.demo', phone: '+91 91234 56791', roll: '2023-ME-145', block: 'Block A', room: 'A-312' },
    { name: 'Priya Patel', email: 'priya.student@hostelcare.demo', phone: '+91 91234 56792', roll: '2025-EE-056', block: 'Block C', room: 'C-401' }
  ];

  const studentDbIds = [];
  for (const s of students) {
    const u = await db.run(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`,
      [s.name, s.email, passwordHash, 'STUDENT', s.phone]
    );
    const st = await db.run(
      `INSERT INTO students (user_id, roll_number, hostel_block, room_number) VALUES (?, ?, ?, ?)`,
      [u.lastID, s.roll, s.block, s.room]
    );
    studentDbIds.push({ userId: u.lastID, studentId: st.lastID, name: s.name, block: s.block, room: s.room });
  }

  // 4. Sample Complaints across different lifecycle states
  const now = new Date();
  const subHours = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
  const addHours = (h) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

  // Complaint 1: Resolved & Closed with Feedback
  const c1 = await db.run(
    `INSERT INTO complaints (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, assigned_staff_id, created_at, assigned_at, started_at, resolved_at, closed_at, sla_hours, sla_deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'CMP-2026-00101', studentDbIds[0].studentId, 'Plumbing', 'HIGH',
      'Water leaking continuously from the pipe under bathroom sink.', 'A-204', 'Block A',
      'CLOSED', staffDbIds[0].staffId,
      subHours(48), subHours(46), subHours(44), subHours(40), subHours(38), 8, subHours(40)
    ]
  );
  await db.run(
    `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES
     (?, 'SUBMITTED', 'PENDING', ?, 'Complaint received by system', ?),
     (?, 'PENDING', 'ASSIGNED', ?, 'Assigned to Ravi Kumar (Plumbing)', ?),
     (?, 'ASSIGNED', 'ACCEPTED', ?, 'Task accepted by staff', ?),
     (?, 'ACCEPTED', 'IN_PROGRESS', ?, 'Started repair work', ?),
     (?, 'IN_PROGRESS', 'RESOLVED', ?, 'Damaged pipe connector replaced and leakage tested.', ?),
     (?, 'RESOLVED', 'STUDENT_VERIFICATION', ?, 'Awaiting student verification', ?),
     (?, 'STUDENT_VERIFICATION', 'CLOSED', ?, 'Student confirmed satisfaction', ?)`,
    [
      c1.lastID, studentDbIds[0].userId, subHours(48),
      c1.lastID, adminId, subHours(46),
      c1.lastID, staffDbIds[0].userId, subHours(45),
      c1.lastID, staffDbIds[0].userId, subHours(44),
      c1.lastID, staffDbIds[0].userId, subHours(40),
      c1.lastID, staffDbIds[0].userId, subHours(40),
      c1.lastID, studentDbIds[0].userId, subHours(38)
    ]
  );
  await db.run(
    `INSERT INTO feedback (complaint_id, student_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)`,
    [c1.lastID, studentDbIds[0].studentId, 5, 'Problem was resolved quickly and thoroughly.', subHours(38)]
  );

  // Complaint 2: In Progress
  const c2 = await db.run(
    `INSERT INTO complaints (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, assigned_staff_id, created_at, assigned_at, started_at, sla_hours, sla_deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'CMP-2026-00102', studentDbIds[0].studentId, 'Electrical', 'MEDIUM',
      'Ceiling fan making loud squeaking noise and vibrating uncontrollably.', 'A-204', 'Block A',
      'IN_PROGRESS', staffDbIds[1].staffId,
      subHours(12), subHours(10), subHours(2), 24, addHours(12)
    ]
  );
  await db.run(
    `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES
     (?, 'SUBMITTED', 'PENDING', ?, 'Registered', ?),
     (?, 'PENDING', 'ASSIGNED', ?, 'Assigned to Suresh Verma', ?),
     (?, 'ASSIGNED', 'IN_PROGRESS', ?, 'Work initiated on site', ?)`,
    [
      c2.lastID, studentDbIds[0].userId, subHours(12),
      c2.lastID, adminId, subHours(10),
      c2.lastID, staffDbIds[1].userId, subHours(2)
    ]
  );

  // Complaint 3: Emergency Pending
  const c3 = await db.run(
    `INSERT INTO complaints (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, created_at, sla_hours, sla_deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'CMP-2026-00103', studentDbIds[1].studentId, 'Electrical', 'EMERGENCY',
      'Sparking from main room switchboard! Burnt smell coming out.', 'B-108', 'Block B',
      'PENDING', subHours(1), 2, addHours(1)
    ]
  );
  await db.run(
    `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES
     (?, 'SUBMITTED', 'PENDING', ?, 'Emergency reported by student', ?)`,
    [c3.lastID, studentDbIds[1].userId, subHours(1)]
  );

  // Complaint 4: Follow-up Requested
  const c4 = await db.run(
    `INSERT INTO complaints (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, assigned_staff_id, created_at, assigned_at, started_at, resolved_at, sla_hours, sla_deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'CMP-2026-00104', studentDbIds[2].studentId, 'Plumbing', 'HIGH',
      'Shower tap leaking water.', 'A-312', 'Block A',
      'FOLLOW_UP_REQUESTED', staffDbIds[0].staffId,
      subHours(36), subHours(30), subHours(24), subHours(18), 8, subHours(28)
    ]
  );
  await db.run(
    `INSERT INTO followup_requests (complaint_id, student_id, reason, status, created_at) VALUES (?, ?, ?, 'REQUESTED', ?)`,
    [c4.lastID, studentDbIds[2].studentId, 'Tap fixed initially but started leaking again from upper joint after 2 hours.', subHours(6)]
  );

  // Notifications
  await db.run(
    `INSERT INTO notifications (user_id, complaint_id, message, notification_type, is_read, created_at) VALUES
     (?, ?, 'Your complaint CMP-2026-00101 has been closed.', 'COMPLAINT_CLOSED', 1, ?),
     (?, ?, 'Emergency Complaint CMP-2026-00103 submitted in Block B Room B-108!', 'EMERGENCY_SUBMITTED', 0, ?),
     (?, ?, 'Follow-up requested on complaint CMP-2026-00104.', 'FOLLOW_UP_REQUESTED', 0, ?)`,
    [
      studentDbIds[0].userId, c1.lastID, subHours(38),
      adminId, c3.lastID, subHours(1),
      staffDbIds[0].userId, c4.lastID, subHours(6)
    ]
  );

  console.log('✅ Demo database seeded successfully with Admin, Staff, Students, and Sample Complaints!');
}

module.exports = {
  getDB,
  initDB
};
