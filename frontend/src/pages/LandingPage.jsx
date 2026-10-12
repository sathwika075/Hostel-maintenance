import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Clock, CheckCircle2, Layers, Users, BarChart, LogIn, Wrench, GraduationCap, Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const ROLE_CONFIG = {
  ADMIN: { icon: Shield, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', label: 'Warden / Admin' },
  STUDENT: { icon: GraduationCap, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', label: 'Students' },
  STAFF: { icon: Wrench, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', label: 'Maintenance Staff' },
};

export default function LandingPage({ onDirectLogin }) {
  const [accounts, setAccounts] = useState({ ADMIN: [], STUDENT: [], STAFF: [] });
  const [selectedRole, setSelectedRole] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Login modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await api.getAccounts();
      setAccounts(data.accounts || { ADMIN: [], STUDENT: [], STAFF: [] });
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPassword('');
    setLoginError('');
    setShowPassword(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError('Please enter your password');
      return;
    }
    setLoggingIn(true);
    setLoginError('');
    try {
      await onDirectLogin(selectedUser.email, password);
      // If successful, App.jsx will handle the redirect
    } catch (err) {
      setLoginError(err.message || 'Invalid password. Please try again.');
      setLoggingIn(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', color: '#ffffff' }}>
      {/* Hero Section */}
      <section style={{
        padding: '5rem 1.5rem 4rem 1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '30px',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#60a5fa',
          marginBottom: '1.5rem'
        }}>
          <Zap size={14} /> Next-Gen Hostel Maintenance Management
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
          fontWeight: 800,
          letterSpacing: '-1.5px',
          lineHeight: 1.1,
          marginBottom: '1rem',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          HOSTEL<span style={{ color: 'var(--accent-cyan)', WebkitTextFillColor: 'initial' }}>CARE</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          marginBottom: '0.75rem'
        }}>
          Report. Resolve. Relax.
        </p>

        <p style={{
          fontSize: '1.1rem',
          color: '#94a3b8',
          maxWidth: '680px',
          margin: '0 auto 2.5rem auto',
          lineHeight: 1.6
        }}>
          A digital hostel complaint and maintenance platform that makes reporting, tracking, assigning, and resolving hostel problems simple and transparent.
        </p>

        {/* Demo Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          background: 'rgba(17, 24, 39, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '3.5rem'
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa' }}>2,500+</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Complaints Managed</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>96%</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Resolution Rate</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>4.7 / 5</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Student Satisfaction</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c084fc' }}>35%</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Faster Resolution</div>
          </div>
        </div>

        {/* ============ DYNAMIC ACCOUNT PICKER ============ */}
        <div id="demo-login" style={{
          maxWidth: '900px',
          margin: '0 auto 3.5rem auto',
          textAlign: 'left'
        }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.4rem' }}>
            <LogIn size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: '#60a5fa' }} />
            Sign In to Your Account
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Select your account below and enter your password to log in
          </p>

          {/* Role Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
              const Icon = cfg.icon;
              const isActive = selectedRole === role;
              const count = accounts[role]?.length || 0;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(selectedRole === role ? null : role)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${isActive ? cfg.color : 'var(--border-color)'}`,
                    background: isActive ? cfg.bg : 'rgba(15, 23, 42, 0.5)',
                    color: isActive ? cfg.color : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? `0 0 20px ${cfg.bg}` : 'none',
                  }}
                >
                  <Icon size={18} />
                  {cfg.label}
                  <span style={{
                    background: isActive ? cfg.color : 'rgba(148, 163, 184, 0.2)',
                    color: isActive ? '#0f172a' : '#94a3b8',
                    padding: '1px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loading state */}
          {loadingAccounts && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
              <div>Loading accounts...</div>
            </div>
          )}

          {/* Account Cards - dynamically fetched */}
          {!loadingAccounts && Object.entries(accounts)
            .filter(([role]) => !selectedRole || selectedRole === role)
            .map(([role, roleAccounts]) => {
              const cfg = ROLE_CONFIG[role];
              if (!cfg || roleAccounts.length === 0) return null;
              const Icon = cfg.icon;
              return (
                <div key={role} style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    paddingLeft: '0.25rem'
                  }}>
                    <Icon size={16} color={cfg.color} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {cfg.label}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: cfg.border, marginLeft: '0.5rem' }} />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {roleAccounts.map((account) => {
                      const cardKey = `${role}-${account.email}`;
                      const isHovered = hoveredCard === cardKey;
                      const isSelected = selectedUser?.email === account.email;
                      return (
                        <button
                          key={account.email}
                          onClick={() => handleUserClick(account)}
                          onMouseEnter={() => setHoveredCard(cardKey)}
                          onMouseLeave={() => setHoveredCard(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.85rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '12px',
                            border: `1.5px solid ${isSelected ? cfg.color : isHovered ? cfg.border : 'var(--border-color)'}`,
                            background: isSelected
                              ? `linear-gradient(135deg, ${cfg.bg}, rgba(15, 23, 42, 0.9))`
                              : isHovered
                                ? `linear-gradient(135deg, ${cfg.bg}, rgba(15, 23, 42, 0.8))`
                                : 'var(--bg-card)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.25s ease',
                            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                            boxShadow: isSelected
                              ? `0 0 20px ${cfg.bg}, inset 0 0 0 1px ${cfg.border}`
                              : isHovered ? `0 8px 25px ${cfg.bg}` : 'none',
                          }}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: isSelected
                              ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}dd)`
                              : `linear-gradient(135deg, ${cfg.color}88, ${cfg.border})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: '#0f172a',
                            flexShrink: 0,
                          }}>
                            {account.name.charAt(0)}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {account.name}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {account.detail || account.email}
                            </div>
                          </div>

                          {/* Arrow / Check */}
                          {isSelected ? (
                            <CheckCircle2 size={18} color={cfg.color} style={{ flexShrink: 0 }} />
                          ) : (
                            <ArrowRight size={16} color={isHovered ? cfg.color : '#475569'} style={{ flexShrink: 0, transition: 'all 0.2s ease', transform: isHovered ? 'translateX(3px)' : 'translateX(0)' }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ============ PASSWORD LOGIN MODAL ============ */}
      {selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => { setSelectedUser(null); setLoginError(''); setLoggingIn(false); }}
          style={{ zIndex: 9999 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', animation: 'slideUp 0.25s ease' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>Sign In</div>
              <button
                onClick={() => { setSelectedUser(null); setLoginError(''); setLoggingIn(false); }}
                style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
              >✕</button>
            </div>

            {/* Selected User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: ROLE_CONFIG[selectedUser.role]?.bg || 'rgba(59,130,246,0.1)',
              border: `1px solid ${ROLE_CONFIG[selectedUser.role]?.border || 'var(--border-color)'}`,
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${ROLE_CONFIG[selectedUser.role]?.color || '#3b82f6'}, ${ROLE_CONFIG[selectedUser.role]?.border || '#3b82f680'})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#0f172a',
                flexShrink: 0,
              }}>
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>{selectedUser.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selectedUser.email}</div>
                <div style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: ROLE_CONFIG[selectedUser.role]?.bg,
                  color: ROLE_CONFIG[selectedUser.role]?.color,
                  border: `1px solid ${ROLE_CONFIG[selectedUser.role]?.border}`,
                }}>
                  {selectedUser.role}
                </div>
              </div>
            </div>

            {/* Error message */}
            {loginError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoFocus
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loggingIn}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.8rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: loggingIn ? 0.7 : 1
                }}
              >
                {loggingIn ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <section style={{ padding: '4rem 1.5rem', background: '#0d1322', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>How HOSTELCARE Works</h2>
          <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>End-to-end transparent complaint lifecycle without verbal miscommunication</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
            {[
              { step: '01', title: 'Report', desc: 'Student raises complaint with category, description & photo evidence.', color: '#3b82f6' },
              { step: '02', title: 'Assign', desc: 'Rule-based matching assigns optimal maintenance staff by workload & skill.', color: '#8b5cf6' },
              { step: '03', title: 'Repair', desc: 'Staff accepts task, uploads before/after repair photos & logs progress.', color: '#06b6d4' },
              { step: '04', title: 'Verify', desc: 'Student verifies completion or requests linked follow-up help.', color: '#f59e0b' },
              { step: '05', title: 'Resolve', desc: 'Complaint closed with rating, feedback & automated SLA metrics.', color: '#10b981' }
            ].map((s) => (
              <div key={s.step} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: s.color, opacity: 0.25, marginBottom: '0.5rem' }}>{s.step}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Key Platform Features</h2>
          <p style={{ color: '#94a3b8' }}>Built for transparency, accountability, and seamless hostel management</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: <Zap color="#3b82f6" />, title: 'Easy Complaint Submission', desc: 'Categorized reporting with room details & photo attachments.' },
            { icon: <Clock color="#f59e0b" />, title: 'SLA Monitoring & Alerts', desc: 'Configurable time limits per priority (Emergency 2h to Low 48h).' },
            { icon: <Users color="#10b981" />, title: 'Smart Rule Staff Assignment', desc: 'Workload & specialization match without manual confusion.' },
            { icon: <CheckCircle2 color="#06b6d4" />, title: 'Student Verification & Follow-up', desc: 'Students confirm resolution or request linked follow-up help.' },
            { icon: <Layers color="#8b5cf6" />, title: 'Evidence-Based Repair', desc: 'Before and after repair photo uploads for accountability.' },
            { icon: <BarChart color="#ec4899" />, title: 'Analytics & Exportable Reports', desc: 'Real-time charts, block-wise frequency & PDF/CSV reporting.' }
          ].map((f, i) => (
            <div key={i} className="card">
              <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '2rem 1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
        HOSTELCARE © 2026 • Smart Hostel Complaint & Maintenance Management System
      </footer>

      {/* Inline keyframes for spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
