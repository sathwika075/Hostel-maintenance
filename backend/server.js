const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDB } = require('./db');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const complaintsRoutes = require('./routes/complaints');
const notificationsRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'HOSTELCARE Backend API Server operational', timestamp: new Date() });
});

// Start Server after initializing Database
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 HOSTELCARE Backend Server running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
      console.log(`==================================================`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });
