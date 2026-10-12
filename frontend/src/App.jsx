import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import { api } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // refresh notifications every 20s
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('hostelcare_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const user = await api.getProfile();
      setCurrentUser(user);
      setLoading(false);
    } catch (err) {
      console.error('Session expired:', err);
      localStorage.removeItem('hostelcare_token');
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  const handleQuickLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('hostelcare_token', res.token);
      setCurrentUser(res.user);
      setActiveTab('dashboard');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err; // Re-throw so LandingPage password modal can display the error
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hostelcare_token');
    setCurrentUser(null);
    setNotifications([]);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-dark)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#60a5fa',
        fontWeight: 700,
        fontSize: '1.2rem'
      }}>
        Initializing HOSTELCARE System...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickLogin={handleQuickLogin}
        onLogout={handleLogout}
        notifications={notifications}
        onRefreshNotifications={fetchNotifications}
      />

      {/* Main Content Area */}
      {!currentUser ? (
        <LandingPage onDirectLogin={handleQuickLogin} />
      ) : (
        <main className="main-content">
          {activeTab === 'analytics' && currentUser.role === 'ADMIN' ? (
            <AnalyticsPage />
          ) : activeTab === 'reports' && currentUser.role === 'ADMIN' ? (
            <ReportsPage />
          ) : currentUser.role === 'STUDENT' ? (
            <StudentDashboard currentUser={currentUser} />
          ) : currentUser.role === 'ADMIN' ? (
            <AdminDashboard currentUser={currentUser} />
          ) : (
            <StaffDashboard currentUser={currentUser} />
          )}
        </main>
      )}
    </div>
  );
}
