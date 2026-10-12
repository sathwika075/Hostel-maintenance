import React, { useState } from 'react';
import { X, UserPlus, Shield, Wrench } from 'lucide-react';
import { api } from '../services/api';

export default function CreateUserModal({ onClose, onSuccess }) {
  const [roleType, setRoleType] = useState('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('password123');
  const [phone, setPhone] = useState('');

  // Student specific
  const [rollNumber, setRollNumber] = useState('');
  const [hostelBlock, setHostelBlock] = useState('Block A');
  const [roomNumber, setRoomNumber] = useState('');

  // Staff specific
  const [department, setDepartment] = useState('Plumbing');
  const [specialization, setSpecialization] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (roleType === 'STUDENT') {
        await api.createStudent({
          name,
          email,
          tempPassword,
          rollNumber,
          hostelBlock,
          roomNumber,
          phone
        });
      } else {
        await api.createStaff({
          name,
          email,
          tempPassword,
          department,
          specialization,
          phone
        });
      }
      setLoading(false);
      onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to create user account');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>
            <UserPlus size={20} color="var(--accent-primary)" /> Admin Account Provisioning
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* Role Type Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`btn ${roleType === 'STUDENT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRoleType('STUDENT')}
          >
            🎓 Create Student
          </button>
          <button
            type="button"
            className={`btn ${roleType === 'STAFF' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRoleType('STAFF')}
          >
            🔧 Create Staff
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.825rem',
            marginBottom: '1rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@hostelcare.demo"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input
                type="text"
                className="form-input"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          {roleType === 'STUDENT' ? (
            <>
              <div className="form-group">
                <label className="form-label">Student Roll / ID Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 2026-CS-105"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Hostel Block</label>
                  <select
                    className="form-select"
                    value={hostelBlock}
                    onChange={(e) => setHostelBlock(e.target.value)}
                  >
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                    <option value="Block D">Block D</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. A-204"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Maintenance Department</label>
                <select
                  className="form-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Civil / Carpentry">Civil / Carpentry</option>
                  <option value="IT & Network">IT & Network</option>
                  <option value="General Maintenance">General Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Specialization / Skills</label>
                <input
                  type="text"
                  className="form-input"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Tap leakages, pipe fitting, drainage"
                  required
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
