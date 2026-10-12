import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, FileText, Star, Image as ImageIcon, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import RaiseComplaintModal from '../components/RaiseComplaintModal';
import SlaBadge from '../components/SlaBadge';
import ComplaintTimeline from '../components/ComplaintTimeline';
import PhotoViewerModal from '../components/PhotoViewerModal';
import DirectHelpModal from '../components/DirectHelpModal';

export default function StudentDashboard({ currentUser }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photosToView, setPhotosToView] = useState([]);
  
  // Follow up / Feedback states
  const [followupReason, setFollowupReason] = useState('');
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const dash = await api.getAnalyticsDashboard();
      setDashboardData(dash);
      const list = await api.getComplaints();
      setComplaints(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const detail = await api.getComplaintDetail(id);
      setSelectedComplaint(detail);
      setShowFollowupForm(false);
      setShowFeedbackForm(false);
    } catch (err) {
      alert('Failed to load complaint details');
    }
  };

  const handleConfirmClose = async () => {
    if (!selectedComplaint) return;
    try {
      await api.verifyClose(selectedComplaint.id);
      setShowFeedbackForm(true);
      handleOpenDetail(selectedComplaint.id);
      loadStudentData();
    } catch (err) {
      alert(err.message || 'Failed to confirm resolution');
    }
  };

  const handleSendFollowup = async (e) => {
    e.preventDefault();
    if (!followupReason.trim()) return;
    try {
      const formData = new FormData();
      formData.append('reason', followupReason);
      await api.requestFollowup(selectedComplaint.id, formData);
      setFollowupReason('');
      setShowFollowupForm(false);
      handleOpenDetail(selectedComplaint.id);
      loadStudentData();
    } catch (err) {
      alert(err.message || 'Failed to submit follow-up request');
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.submitFeedback(selectedComplaint.id, rating, feedbackComment);
      setShowFeedbackForm(false);
      handleOpenDetail(selectedComplaint.id);
      loadStudentData();
    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading student portal...</div>;
  }

  const profile = dashboardData?.profile || {};
  const stats = dashboardData?.stats || { total: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0 };

  return (
    <div>
      {/* Student Welcome Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #111827 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
            Good Morning, {currentUser?.name || profile.name} 👋
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {currentUser?.hostelBlock || profile.hostelBlock || 'Block A'}
            </span>
            •
            <span>Room {currentUser?.roomNumber || profile.roomNumber || 'A-204'}</span>
            •
            <span style={{ fontFamily: 'var(--font-mono)' }}>Roll: {profile.rollNumber || '2024-CS-102'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowHelpModal(true)} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            <HelpCircle size={18} /> Direct Help
          </button>
          <button className="btn btn-primary" onClick={() => setShowRaiseModal(true)} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            <PlusCircle size={18} /> Raise Complaint
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Complaints</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.resolved + stats.closed}</div>
            <div className="stat-label">Resolved / Closed</div>
          </div>
        </div>
      </div>

      {/* Complaints List & Selected Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedComplaint ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Complaints Table / List */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Your Complaint History</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{complaints.length} Records</span>
          </div>

          {complaints.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>No complaints yet</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Your hostel room is looking good!</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowRaiseModal(true)}>
                Raise Your First Complaint
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>SLA Deadline</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr
                      key={c.id}
                      style={{ background: selectedComplaint?.id === c.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent', cursor: 'pointer' }}
                      onClick={() => handleOpenDetail(c.id)}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa' }}>{c.complaint_code}</td>
                      <td>{c.category}</td>
                      <td>
                        <span className={`priority-badge priority-${c.priority}`}>{c.priority}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${c.status}`}>{c.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td>
                        <SlaBadge slaDeadline={c.sla_deadline} status={c.status} />
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleOpenDetail(c.id); }}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Complaint Detail Drawer */}
        {selectedComplaint && (
          <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#60a5fa', fontSize: '1.1rem' }}>
                  {selectedComplaint.complaint_code}
                </span>
                <span className={`status-badge status-${selectedComplaint.status}`} style={{ marginLeft: '0.75rem' }}>
                  {selectedComplaint.status.replace(/_/g, ' ')}
                </span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedComplaint(null)}>Close</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Category & Priority</div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                {selectedComplaint.category} • Priority: <span className={`priority-badge priority-${selectedComplaint.priority}`}>{selectedComplaint.priority}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Description</div>
              <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                {selectedComplaint.description}
              </div>
            </div>

            {selectedComplaint.staff_name && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>ASSIGNED MAINTENANCE STAFF</div>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>{selectedComplaint.staff_name} ({selectedComplaint.staff_department})</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contact: {selectedComplaint.staff_phone || 'N/A'}</div>
              </div>
            )}

            {/* Photos button */}
            {selectedComplaint.photos?.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginBottom: '1rem' }}
                onClick={() => { setPhotosToView(selectedComplaint.photos); setShowPhotoModal(true); }}
              >
                <ImageIcon size={16} color="#60a5fa" /> View Attached Photos ({selectedComplaint.photos.length})
              </button>
            )}

            {/* Student Verification Action Box */}
            {(selectedComplaint.status === 'RESOLVED' || selectedComplaint.status === 'STUDENT_VERIFICATION') && (
              <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', border: '2px solid #6366f1', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                  🔧 Maintenance staff has marked this complaint as RESOLVED
                </div>
                <div style={{ fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                  Please confirm whether your room issue has been completely fixed.
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-success btn-sm" onClick={handleConfirmClose} style={{ flex: 1 }}>
                    <CheckCircle2 size={16} /> Confirm Resolution
                  </button>
                  <button className="btn btn-warning btn-sm" onClick={() => setShowFollowupForm(!showFollowupForm)} style={{ flex: 1 }}>
                    <HelpCircle size={16} /> Need Help
                  </button>
                </div>

                {/* Follow-up input form */}
                {showFollowupForm && (
                  <form onSubmit={handleSendFollowup} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Specify issue for follow-up re-inspection:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Fan is making noise again after repair..."
                      value={followupReason}
                      onChange={(e) => setFollowupReason(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-warning btn-sm" style={{ width: '100%', marginTop: '0.5rem' }}>
                      Submit Follow-Up Request
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Feedback & Rating form */}
            {(selectedComplaint.status === 'CLOSED' || showFeedbackForm) && !selectedComplaint.feedback && (
              <form onSubmit={handleSendFeedback} style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Rate Service Satisfaction</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      style={{ background: 'transparent', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <Star size={20} fill={star <= rating ? '#fbbf24' : 'none'} color="#fbbf24" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add feedback comment (optional)..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Submit Rating
                </button>
              </form>
            )}

            {selectedComplaint.feedback && (
              <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Star size={14} fill="#fbbf24" /> STUDENT FEEDBACK ({selectedComplaint.feedback.rating}/5)
                </div>
                <div style={{ fontSize: '0.85rem', color: '#ffffff', marginTop: '0.25rem' }}>
                  "{selectedComplaint.feedback.comment || 'No comment'}"
                </div>
              </div>
            )}

            {/* Timeline */}
            <ComplaintTimeline history={selectedComplaint.history} currentStatus={selectedComplaint.status} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showRaiseModal && (
        <RaiseComplaintModal
          currentUser={currentUser}
          onClose={() => setShowRaiseModal(false)}
          onSuccess={() => {
            setShowRaiseModal(false);
            loadStudentData();
          }}
        />
      )}

      {showHelpModal && (
        <DirectHelpModal
          currentUser={currentUser}
          onClose={() => setShowHelpModal(false)}
          onSuccess={() => {
            setShowHelpModal(false);
            loadStudentData();
          }}
        />
      )}

      {showPhotoModal && (
        <PhotoViewerModal photos={photosToView} onClose={() => setShowPhotoModal(false)} />
      )}
    </div>
  );
}
