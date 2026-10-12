import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, Clock, Upload, AlertCircle, FileText, Check, Play, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';
import SlaBadge from '../components/SlaBadge';
import ComplaintTimeline from '../components/ComplaintTimeline';
import PhotoViewerModal from '../components/PhotoViewerModal';

export default function StaffDashboard({ currentUser }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Action Modals
  const [showStartWorkModal, setShowStartWorkModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Form states
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
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
    } catch (err) {
      alert('Failed to load task detail');
    }
  };

  const handleAcceptTask = async (id) => {
    try {
      await api.acceptTask(id);
      handleOpenDetail(id);
      loadStaffData();
    } catch (err) {
      alert(err.message || 'Failed to accept task');
    }
  };

  const handleStartWorkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setLoadingAction(true);
    try {
      const formData = new FormData();
      if (beforePhoto) formData.append('beforePhoto', beforePhoto);
      await api.startWork(selectedComplaint.id, formData);
      setLoadingAction(false);
      setShowStartWorkModal(false);
      setBeforePhoto(null);
      handleOpenDetail(selectedComplaint.id);
      loadStaffData();
    } catch (err) {
      setLoadingAction(false);
      alert(err.message || 'Failed to initiate work');
    }
  };

  const handleMarkResolvedSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setLoadingAction(true);
    try {
      const formData = new FormData();
      formData.append('remarks', resolutionRemarks);
      if (afterPhoto) formData.append('afterPhoto', afterPhoto);

      await api.markResolved(selectedComplaint.id, formData);
      setLoadingAction(false);
      setShowResolveModal(false);
      setAfterPhoto(null);
      setResolutionRemarks('');
      handleOpenDetail(selectedComplaint.id);
      loadStaffData();
    } catch (err) {
      setLoadingAction(false);
      alert(err.message || 'Failed to mark task resolved');
    }
  };

  const handleResolveFollowup = async (followupId) => {
    if (!selectedComplaint) return;
    try {
      await api.resolveFollowup(selectedComplaint.id, followupId, 'Re-inspected and repaired by maintenance staff');
      handleOpenDetail(selectedComplaint.id);
      loadStaffData();
    } catch (err) {
      alert(err.message || 'Failed to resolve follow-up');
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading maintenance portal...</div>;
  }

  const profile = dashboardData?.profile || {};
  const stats = dashboardData?.stats || { totalAssigned: 0, pending: 0, inProgress: 0, resolved: 0, overdue: 0, avgRating: '5.0' };

  return (
    <div>
      {/* Staff Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #064e3b 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
              Maintenance Portal — {currentUser?.name || profile.name}
            </h2>
            <span className="role-tag staff">{profile.department || 'MAINTENANCE'}</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#a7f3d0', marginTop: '0.3rem' }}>
            Specialization: {profile.specialization || 'General Repair'} • Active Workload: <strong style={{ color: '#ffffff' }}>{profile.currentWorkload || 0} tasks</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1.25rem', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SLA Performance</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>96% Met</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Avg Rating</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>⭐ {stats.avgRating || '5.0'} / 5</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Wrench size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.totalAssigned}</div>
            <div className="stat-label">Assigned Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Acceptance</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
            <Play size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">Work In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Completed Tasks</div>
          </div>
        </div>
      </div>

      {/* Tasks Table & Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedComplaint ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Your Maintenance Queue ({complaints.length})
          </h3>

          {complaints.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              You're all caught up! 🎉 No pending maintenance tasks.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
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
                      <td>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{c.hostel_block}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Room {c.room_number}</div>
                      </td>
                      <td>{c.category}</td>
                      <td>
                        <span className={`priority-badge priority-${c.priority}`}>{c.priority}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${c.status}`}>{c.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td>
                        {c.status === 'ASSIGNED' || (c.category === 'Direct Help' && (c.status === 'PENDING' || c.status === 'SUBMITTED')) ? (
                          <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleAcceptTask(c.id); }}>
                            Accept Task
                          </button>
                        ) : (
                          <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleOpenDetail(c.id); }}>
                            Open Task
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Task Details Drawer */}
        {selectedComplaint && (
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
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

            <div style={{ background: '#1e293b', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ROOM & STUDENT DETAILS</div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>{selectedComplaint.hostel_block} • Room {selectedComplaint.room_number}</div>
              <div style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>Student: {selectedComplaint.student_name} ({selectedComplaint.student_phone || 'No phone'})</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Problem Description</div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                {selectedComplaint.description}
              </div>
            </div>

            {/* SLA Timer */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>SLA Target Deadline</div>
              <SlaBadge slaDeadline={selectedComplaint.sla_deadline} status={selectedComplaint.status} />
            </div>

            {/* Action Buttons based on Status */}
            {(selectedComplaint.status === 'ASSIGNED' || (selectedComplaint.category === 'Direct Help' && (selectedComplaint.status === 'PENDING' || selectedComplaint.status === 'SUBMITTED'))) && (
              <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => handleAcceptTask(selectedComplaint.id)}>
                <Check size={16} /> Accept Maintenance Task
              </button>
            )}

            {selectedComplaint.status === 'ACCEPTED' && (
              <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setShowStartWorkModal(true)}>
                <Play size={16} /> Arrived On-Site / Start Work
              </button>
            )}

            {selectedComplaint.status === 'IN_PROGRESS' && (
              <button className="btn btn-success" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setShowResolveModal(true)}>
                <CheckCircle2 size={16} /> Mark Repair Completed & Resolved
              </button>
            )}

            {/* Followup Requests view */}
            {selectedComplaint.followups?.map((f) => (
              <div key={f.id} style={{ background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#f472b6', fontWeight: 700 }}>STUDENT FOLLOW-UP REQUEST</div>
                <div style={{ fontSize: '0.85rem', color: '#ffffff', marginTop: '0.2rem', fontWeight: 600 }}>"{f.reason}"</div>
                {f.status === 'REQUESTED' && (
                  <button className="btn btn-warning btn-sm" style={{ marginTop: '0.5rem', width: '100%' }} onClick={() => handleResolveFollowup(f.id)}>
                    Re-Inspect & Mark Follow-Up Resolved
                  </button>
                )}
              </div>
            ))}

            {/* View photos */}
            {selectedComplaint.photos?.length > 0 && (
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setShowPhotoModal(true)}>
                <ImageIcon size={16} /> View Before & After Photos ({selectedComplaint.photos.length})
              </button>
            )}

            <ComplaintTimeline history={selectedComplaint.history} currentStatus={selectedComplaint.status} />
          </div>
        )}
      </div>

      {/* Start Work Modal */}
      {showStartWorkModal && (
        <div className="modal-overlay" onClick={() => setShowStartWorkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Initiate Repair & Upload Before Photo</div>
              <button onClick={() => setShowStartWorkModal(false)} style={{ background: 'transparent', color: '#94a3b8' }}>X</button>
            </div>
            <form onSubmit={handleStartWorkSubmit}>
              <div className="form-group">
                <label className="form-label">Upload Before-Repair Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setBeforePhoto(e.target.files[0])} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStartWorkModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loadingAction}>
                  {loadingAction ? 'Starting...' : 'Start Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Resolved Modal */}
      {showResolveModal && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Mark Complaint as Resolved</div>
              <button onClick={() => setShowResolveModal(false)} style={{ background: 'transparent', color: '#94a3b8' }}>X</button>
            </div>
            <form onSubmit={handleMarkResolvedSubmit}>
              <div className="form-group">
                <label className="form-label">Resolution Remarks / Repairs Completed</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  placeholder="e.g. Replaced damaged pipe connector and verified zero leakage..."
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Upload After-Repair Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setAfterPhoto(e.target.files[0])} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={loadingAction}>
                  {loadingAction ? 'Resolving...' : 'Complete & Mark Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhotoModal && selectedComplaint && (
        <PhotoViewerModal photos={selectedComplaint.photos} onClose={() => setShowPhotoModal(false)} />
      )}
    </div>
  );
}
