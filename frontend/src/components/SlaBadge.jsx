import React, { useState, useEffect } from 'react';
import { Clock, AlertOctagon } from 'lucide-react';

export default function SlaBadge({ slaDeadline, status }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isBreached, setIsBreached] = useState(false);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    if (!slaDeadline || status === 'CLOSED' || status === 'RESOLVED') {
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadline = new Date(slaDeadline).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsBreached(true);
        setTimeLeft('SLA BREACHED');
        setPercentage(0);
      } else {
        setIsBreached(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m remaining`);
        
        // Approximate visual SLA bar based on 24h window
        const total = 24 * 3600 * 1000;
        const pct = Math.max(0, Math.min(100, Math.round((diff / total) * 100)));
        setPercentage(pct);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // refresh every 30 sec
    return () => clearInterval(interval);
  }, [slaDeadline, status]);

  if (status === 'CLOSED' || status === 'RESOLVED') {
    return (
      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        ✓ Resolved within SLA
      </span>
    );
  }

  if (isBreached) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.6rem',
        background: 'rgba(239, 68, 68, 0.2)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 800
      }}>
        <AlertOctagon size={13} color="#ef4444" /> ⚠ SLA BREACHED
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>
        <Clock size={13} /> {timeLeft}
      </div>
      <div style={{ width: '100px', height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: percentage < 25 ? '#ef4444' : percentage < 50 ? '#f59e0b' : '#3b82f6',
          transition: 'width 0.5s ease'
        }}></div>
      </div>
    </div>
  );
}
