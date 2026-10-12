import React, { useState } from 'react';
import { X, Upload, AlertTriangle, Send } from 'lucide-react';
import { api } from '../services/api';

export default function RaiseComplaintModal({ currentUser, onClose, onSuccess }) {
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [roomNumber, setRoomNumber] = useState(currentUser?.roomNumber || 'A-204');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { name: 'Electrical', icon: '⚡' },
    { name: 'Plumbing', icon: '🚰' },
    { name: 'Furniture', icon: '🪑' },
    { name: 'Cleaning', icon: '🧹' },
    { name: 'Bathroom', icon: '🚿' },
    { name: 'Room Maintenance', icon: '🏠' },
    { name: 'Wi-Fi / Internet', icon: '📶' },
    { name: 'AC / Fan', icon: '❄️' },
    { name: 'Lights', icon: '💡' },
    { name: 'Other', icon: '🔧' }
  ];

  const priorities = [
    { key: 'LOW', label: 'Low (48h SLA)', color: '#cbd5e1' },
    { key: 'MEDIUM', label: 'Medium (24h SLA)', color: '#60a5fa' },
    { key: 'HIGH', label: 'High (8h SLA)', color: '#fbbf24' },
    { key: 'EMERGENCY', label: '🚨 Emergency (2h SLA)', color: '#f87171' }
  ];

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a detailed description of the maintenance issue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('description', description);
      formData.append('roomNumber', roomNumber);
      if (photo) {
        formData.append('photo', photo);
      }

      await api.raiseComplaint(formData);
      setLoading(false);
      onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to submit complaint');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Raise New Complaint</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Hostel {currentUser?.hostelBlock || 'Block A'} • Room {roomNumber}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Select Category */}
          <div className="form-group">
            <label className="form-label">Complaint Category</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '0.5rem',
              maxHeight: '180px',
              overflowY: 'auto',
              paddingRight: '0.25rem'
            }}>
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.name}
                  onClick={() => setCategory(c.name)}
                  style={{
                    padding: '0.5rem 0.65rem',
                    borderRadius: '8px',
                    background: category === c.name ? 'rgba(59, 130, 246, 0.25)' : '#1e293b',
                    border: category === c.name ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    color: category === c.name ? '#ffffff' : '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{c.icon}</span> <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Initial Priority */}
          <div className="form-group">
            <label className="form-label">Initial Priority (Admin may review)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {priorities.map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => setPriority(p.key)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: priority === p.key ? 'rgba(255,255,255,0.08)' : '#1e293b',
                    border: priority === p.key ? `2px solid ${p.color}` : '1px solid var(--border-color)',
                    color: p.color,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textAlign: 'center'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Room Number */}
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

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description of Problem</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail (e.g. Water leaking from bathroom pipe connector)..."
              required
            ></textarea>
          </div>

          {/* Photo Upload with Preview */}
          <div className="form-group">
            <label className="form-label">Upload Photo Evidence (Optional)</label>
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
              background: '#1e293b',
              cursor: 'pointer'
            }} onClick={() => document.getElementById('photo-file-input').click()}>
              <input
                id="photo-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              {photoPreview ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={photoPreview} alt="Preview" style={{ maxHeight: '120px', borderRadius: '6px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ Photo selected ({photo.name})</span>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  <Upload size={24} color="#60a5fa" style={{ marginBottom: '0.3rem' }} />
                  <div>Drag & drop or click to attach photo</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>JPG, PNG up to 10MB</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : <><Send size={16} /> Submit Complaint</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
