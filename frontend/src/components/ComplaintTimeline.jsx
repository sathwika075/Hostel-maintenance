import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

export default function ComplaintTimeline({ history = [], currentStatus }) {
  const steps = [
    { key: 'SUBMITTED', label: 'Complaint Submitted' },
    { key: 'PENDING', label: 'Admin Reviewed' },
    { key: 'ASSIGNED', label: 'Staff Assigned' },
    { key: 'ACCEPTED', label: 'Staff Accepted' },
    { key: 'IN_PROGRESS', label: 'Repair In Progress' },
    { key: 'RESOLVED', label: 'Marked Resolved' },
    { key: 'STUDENT_VERIFICATION', label: 'Student Verification' },
    { key: 'CLOSED', label: 'Closed & Completed' }
  ];

  const statusOrder = {
    'SUBMITTED': 1,
    'PENDING': 2,
    'ASSIGNED': 3,
    'ACCEPTED': 4,
    'IN_PROGRESS': 5,
    'RESOLVED': 6,
    'STUDENT_VERIFICATION': 7,
    'CLOSED': 8,
    'FOLLOW_UP_REQUESTED': 5
  };

  const currentLevel = statusOrder[currentStatus] || 1;

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
        Complaint Progress Timeline
      </div>

      <div className="timeline">
        {history.length > 0 ? (
          history.map((item, idx) => {
            const isLatest = idx === history.length - 1;
            return (
              <div key={item.id || idx} className={`timeline-item ${isLatest ? 'active' : 'completed'}`}>
                <div className="timeline-dot">
                  {isLatest ? <Clock size={12} color="#ffffff" /> : <Check size={12} color="#ffffff" />}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">
                    <span>{item.new_status.replace(/_/g, ' ')}</span>
                    <span className="timeline-time">
                      {new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {item.remarks && (
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
                      {item.remarks}
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Updated by: <span style={{ color: '#94a3b8' }}>{item.changed_by_name || 'System'}</span> ({item.changed_by_role || 'Auto'})
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          steps.map((s, idx) => {
            const stepLevel = statusOrder[s.key];
            const isDone = stepLevel <= currentLevel;
            const isCurrent = s.key === currentStatus;

            return (
              <div key={s.key} className={`timeline-item ${isCurrent ? 'active' : isDone ? 'completed' : ''}`}>
                <div className="timeline-dot">
                  {isDone ? <Check size={12} /> : idx + 1}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">
                    <span style={{ color: isDone ? '#ffffff' : '#64748b' }}>{s.label}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
