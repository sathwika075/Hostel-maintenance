import React, { useState, useEffect } from 'react';
import { ShieldAlert, Bell, LogOut, User, PlusCircle, BarChart3, FileText, CheckCircle2, Home } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function Navbar({ currentUser, activeTab, setActiveTab, onQuickLogin, onLogout, notifications, onRefreshNotifications }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;

  return (
    <>
      {/* Quick Demo Switcher Bar */}
      <div className="demo-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>⚡ DEMO QUICK-SWITCH:</span>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Click to instantly test any role:</span>
        </div>
        <div className="demo-pills">
          <button
            className={`demo-btn ${currentUser?.email === 'student@hostelcare.demo' ? 'active' : ''}`}
            onClick={() => onQuickLogin('student@hostelcare.demo', 'password123')}
          >
            🎓 Student (Yash)
          </button>
          <button
            className={`demo-btn ${currentUser?.email === 'admin@hostelcare.demo' ? 'active' : ''}`}
            onClick={() => onQuickLogin('admin@hostelcare.demo', 'password123')}
          >
            🛡️ Admin (Dr. Ramesh)
          </button>
          <button
            className={`demo-btn ${currentUser?.email === 'staff@hostelcare.demo' ? 'active' : ''}`}
            onClick={() => onQuickLogin('staff@hostelcare.demo', 'password123')}
          >
            🔧 Staff (Ravi Kumar)
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="brand-logo" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
            <div className="brand-icon">
              <ShieldAlert size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ lineHeight: 1.1 }}>
                HOSTEL<span style={{ color: 'var(--accent-cyan)' }}>CARE</span>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0px' }}>
                Report. Resolve. Relax.
              </div>
            </div>
          </div>

          {currentUser && (
            <div className="nav-links">
              <button
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <Home size={16} /> Dashboard
              </button>

              {currentUser.role === 'ADMIN' && (
                <>
                  <button
                    className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 size={16} /> Analytics
                  </button>
                  <button
                    className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                  >
                    <FileText size={16} /> Reports
                  </button>
                </>
              )}

              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  className="nav-link"
                  style={{ position: 'relative', padding: '0.5rem' }}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <NotificationCenter
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onRefresh={onRefreshNotifications}
                  />
                )}
              </div>

              {/* User Avatar Badge */}
              <div className="user-badge">
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-indigo))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
                    {currentUser.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span className={`role-tag ${currentUser.role.toLowerCase()}`}>
                      {currentUser.role}
                    </span>
                    {currentUser.hostelBlock && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {currentUser.hostelBlock}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Logout"
                  style={{
                    background: 'transparent',
                    color: '#94a3b8',
                    padding: '0.2rem',
                    marginLeft: '0.5rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
