import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, UserPlus, Filter, Search, AlertTriangle, CheckCircle2, Clock, Wrench, RefreshCw, Eye } from 'lucide-react';
import { api } from '../services/api';
import StaffAssignmentModal from '../components/StaffAssignmentModal';
import CreateUserModal from '../components/CreateUserModal';
import SlaBadge from '../components/SlaBadge';
import ComplaintTimeline from '../components/ComplaintTimeline';
import PhotoViewerModal from '../components/PhotoViewerModal';

export default function AdminDashboard({ currentUser }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Filters
  const [blockFilter, setBlockFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetComplaint, setAssignTargetComplaint] = useState(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Priority Update state
  const [editingPriority, setEditingPriority] = useState(false);
  const [newPriority, setNewPriority] = useState('MEDIUM');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, [blockFilter, categoryFilter, priorityFilter, statusFilter, searchTerm]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const dash = await api.getAnalyticsDashboard();
      setDashboardData(dash);

      const params = {};
      if (blockFilter) params.block = blockFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const list = await api.getComplaints(params);
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
      setNewPriority(detail.priority);
      setEditingPriority(false);
    } catch (err) {
      alert('Failed to load complaint details');
    }
  };

  const handlePriorityUpdate = async () => {
    if (!selectedComplaint) return;
    try {
      await api.updateAdmin(selectedComplaint.id, selectedComplaint.category, newPriority);
      setEditingPriority(false);
      handleOpenDetail(selectedComplaint.id);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update priority');
    }
  };

  const summary = dashboardData?.summary || {};

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        border: '1px solid var(--border-highlight)',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>Hostel Management & Warden Portal</h2>
            <span className="role-tag admin">ADMIN CONTROL</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Monitor hostel complaints, assign maintenance staff, and enforce SLA resolution compliance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => loadAdminData()}>
            <RefreshCw size={16} /> Refresh Data
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateUserModal(true)}>
            <UserPlus size={16} /> Provision User Account
          </button>
        </div>
      </div>

      {/* Emergency Alert Banner if Emergency Complaints Exist */}
      {summary.emergency > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#f87171'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
            <AlertTriangle size={20} color="#ef4444" />
            <span>🚨 ALERT: {summary.emergency} EMERGENCY COMPLAINT(S) REQUIRE IMMEDIATE ATTENTION!</span>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setPriorityFilter('EMERGENCY')}>
            Filter Emergency Complaints
          </button>
        </div>
      )}

      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="stat-value">{summary.total || 0}</div>
            <div className="stat-label">Total Complaints</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{summary.pending || 0}</div>
            <div className="stat-label">Pending Staff Assign</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
            <Wrench size={22} />
          </div>
          <div>
            <div className="stat-value">{summary.inProgress || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-value">{summary.followups || 0}</div>
            <div className="stat-label">Follow-up Requests</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="stat-value">{summary.slaComplianceRate || 96}%</div>
            <div className="stat-label">SLA Compliance Rate</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: '#ffffff' }}>
          <Filter size={16} color="var(--accent-primary)" /> Search & Filter Complaints
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search code, room, student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <select className="form-select" value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
            <option value="">All Hostel Blocks</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
            <option value="Block C">Block C</option>
            <option value="Block D">Block D</option>
          </select>

          <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Furniture">Furniture</option>
            <option value="Cleaning">Cleaning</option>
            <option value="AC / Fan">AC / Fan</option>
            <option value="Wi-Fi / Internet">Wi-Fi / Internet</option>
          </select>

          <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="EMERGENCY">🚨 Emergency</option>
          </select>

          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FOLLOW_UP_REQUESTED">Follow-up Requested</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Table & Detail split view */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedComplaint ? '1.2fr 1fr' : '1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Hostel Complaints ({complaints.length})</h3>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading complaints data...</div>
          ) : complaints.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No complaints match the filter criteria 🎉</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Student & Room</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Assigned Staff</th>
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
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{c.student_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.hostel_block} • Room {c.room_number}</div>
                      </td>
                      <td>{c.category}</td>
                      <td>
                        <span className={`priority-badge priority-${c.priority}`}>{c.priority}</span>
                      </td>
                      <td>
                        {c.staff_name ? (
                          <span style={{ fontSize: '0.825rem', color: '#cbd5e1', fontWeight: 600 }}>{c.staff_name}</span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge status-${c.status}`}>{c.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => { e.stopPropagation(); setAssignTargetComplaint(c); setShowAssignModal(true); }}
                            title="Assign Staff"
                          >
                            <Wrench size={14} /> Assign
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => { e.stopPropagation(); handleOpenDetail(c.id); }}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail View Drawer */}
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

            <div style={{ background: '#1e293b', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Student Info</div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{selectedComplaint.student_name} ({selectedComplaint.roll_number})</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Location: {selectedComplaint.hostel_block} • Room {selectedComplaint.room_number}</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Phone: {selectedComplaint.student_phone || 'N/A'}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Description</div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                {selectedComplaint.description}
              </div>
            </div>

            {/* Admin Override Priority Controls */}
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700 }}>PRIORITY & SLA CONTROL</div>
                  <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                    Current Priority: <span className={`priority-badge priority-${selectedComplaint.priority}`}>{selectedComplaint.priority}</span>
                  </div>
                </div>
                {!editingPriority ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingPriority(true)}>Modify</button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={handlePriorityUpdate}>Save</button>
                )}
              </div>

              {editingPriority && (
                <div style={{ marginTop: '0.75rem' }}>
                  <select className="form-select" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                    <option value="LOW">LOW (48 Hours SLA)</option>
                    <option value="MEDIUM">MEDIUM (24 Hours SLA)</option>
                    <option value="HIGH">HIGH (8 Hours SLA)</option>
                    <option value="EMERGENCY">🚨 EMERGENCY (2 Hours SLA)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Staff Assignment Button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1rem' }}
              onClick={() => { setAssignTargetComplaint(selectedComplaint); setShowAssignModal(true); }}
            >
              <Wrench size={16} /> {selectedComplaint.staff_name ? `Reassign Staff (${selectedComplaint.staff_name})` : 'Assign Maintenance Staff'}
            </button>

            {/* View photos */}
            {selectedComplaint.photos?.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginBottom: '1rem' }}
                onClick={() => setShowPhotoModal(true)}
              >
                View Evidence & Repair Photos ({selectedComplaint.photos.length})
              </button>
            )}

            <ComplaintTimeline history={selectedComplaint.history} currentStatus={selectedComplaint.status} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssignModal && assignTargetComplaint && (
        <StaffAssignmentModal
          complaint={assignTargetComplaint}
          onClose={() => { setShowAssignModal(false); setAssignTargetComplaint(null); }}
          onSuccess={() => {
            setShowAssignModal(false);
            setAssignTargetComplaint(null);
            if (selectedComplaint) handleOpenDetail(selectedComplaint.id);
            loadAdminData();
          }}
        />
      )}

      {showCreateUserModal && (
        <CreateUserModal
          onClose={() => setShowCreateUserModal(false)}
          onSuccess={() => {
            setShowCreateUserModal(false);
            alert('Account created successfully!');
          }}
        />
      )}

      {showPhotoModal && selectedComplaint && (
        <PhotoViewerModal photos={selectedComplaint.photos} onClose={() => setShowPhotoModal(false)} />
      )}
    </div>
  );
}
