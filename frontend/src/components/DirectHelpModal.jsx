import React, { useState } from 'react';
import { HelpCircle, X, Send } from 'lucide-react';
import { api } from '../services/api';

export default function DirectHelpModal({ currentUser, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // We can just raise this as a special complaint or direct request
      const formData = new FormData();
      formData.append('category', 'Direct Help');
      formData.append('priority', 'LOW');
      formData.append('description', `[DIRECT HELP REQUEST]: ${description}`);
      formData.append('roomNumber', currentUser?.roomNumber || 'Unknown');
      formData.append('hostelBlock', currentUser?.hostelBlock || 'Unknown');
      
      await api.raiseComplaint(formData);
      onSuccess();
    } catch (err) {
      alert(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={20} color="#60a5fa" />
            Direct Help From Staff
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
          Use this if you made a mistake or need direct assistance from maintenance staff without raising a formal administrative complaint.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">How can the staff help you?</label>
            <textarea
              className="form-input"
              rows="4"
              placeholder="Describe what you need help with..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
              <Send size={18} /> {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
