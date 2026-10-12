import React, { useState, useEffect } from 'react';
import { X, UserCheck, Star, Sparkles, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function StaffAssignmentModal({ complaint, onClose, onSuccess }) {
  const [recommendationData, setRecommendationData] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [complaint.id]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await api.getRecommendedStaff(complaint.id);
      setRecommendationData(data);
      if (data.recommendedStaffId) {
        setSelectedStaffId(data.recommendedStaffId);
      } else if (data.staff && data.staff.length > 0) {
        setSelectedStaffId(data.staff[0].staff_id);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStaffId) return;
    setSubmitting(true);
    try {
      await api.assignStaff(complaint.id, selectedStaffId, remarks);
      setSubmitting(false);
      onSuccess();
    } catch (err) {
      setSubmitting(false);
      alert(err.message || 'Failed to assign staff');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Rule-Based Staff Assignment</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Complaint: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{complaint.complaint_code}</span> ({complaint.category})
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Evaluating staff workload & department matching...</div>
        ) : (
          <div>
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.825rem',
              color: '#cbd5e1'
            }}>
              💡 <strong>Smart Rule Engine:</strong> Staff members are evaluated based on <strong>Department ({recommendationData?.targetDepartment})</strong>, <strong>Specialization</strong>, and <strong>Current Workload</strong>.
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
              Available Maintenance Staff
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {recommendationData?.staff?.map((s) => {
                const isRecommended = s.staff_id === recommendationData.recommendedStaffId;
                const isSelected = s.staff_id === selectedStaffId;

                return (
                  <div
                    key={s.staff_id}
                    onClick={() => setSelectedStaffId(s.staff_id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : '#1e293b',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>{s.name}</span>
                        {isRecommended && (
                          <span style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}>
                            <Sparkles size={10} /> RECOMMENDED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Dept: <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{s.department}</span> • Spec: {s.specialization}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: s.current_workload === 0 ? '#10b981' : '#f59e0b' }}>
                        Active Tasks: {s.current_workload}
                      </div>
                      {s.avg_rating && (
                        <div style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                          <Star size={10} fill="#fbbf24" /> {s.avg_rating} / 5.0
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="form-group">
              <label className="form-label">Assignment Remarks / Instructions (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Inspect water line pressure on 2nd floor"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={submitting || !selectedStaffId}>
                {submitting ? 'Assigning...' : <><UserCheck size={16} /> Confirm Assignment</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
