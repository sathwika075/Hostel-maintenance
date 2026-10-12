import React from 'react';
import { Bell, Check, X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function NotificationCenter({ notifications = [], onClose, onRefresh }) {
  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead(null, true);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await api.markNotificationsRead(id, false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    if (type?.includes('EMERGENCY')) return <AlertTriangle size={16} color="#ef4444" />;
    if (type?.includes('RESOLVED') || type?.includes('CLOSED')) return <CheckCircle2 size={16} color="#10b981" />;
    return <Info size={16} color="#3b82f6" />;
  };

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      top: 'calc(100% + 10px)',
      width: '360px',
      background: '#111827',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
      zIndex: 250,
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '0.85rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
          <Bell size={16} color="var(--accent-primary)" /> Notifications
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleMarkAllRead}
            style={{ background: 'transparent', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600 }}
          >
            Mark all read
          </button>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            No notifications yet 🔔
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkSingleRead(n.id)}
              style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                background: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.06)',
                cursor: 'pointer',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ marginTop: '2px' }}>{getIcon(n.notification_type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.825rem', color: n.is_read ? '#cbd5e1' : '#ffffff', fontWeight: n.is_read ? 400 : 600 }}>
                  {n.message}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {!n.is_read && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }}></span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
