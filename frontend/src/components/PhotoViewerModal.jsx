import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function PhotoViewerModal({ photos = [], onClose }) {
  const [activeTab, setActiveTab] = useState('ALL');

  const photoTypes = [
    { key: 'ALL', label: 'All Photos' },
    { key: 'STUDENT_PROBLEM', label: 'Problem (Student)' },
    { key: 'BEFORE_REPAIR', label: 'Before Repair' },
    { key: 'AFTER_REPAIR', label: 'After Repair' },
    { key: 'FOLLOW_UP', label: 'Follow-up Evidence' }
  ];

  const filteredPhotos = activeTab === 'ALL'
    ? photos
    : photos.filter(p => p.photo_type === activeTab);

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://hostel-complaint-maintenance-system.onrender.com${url}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
            <ImageIcon size={20} color="var(--accent-primary)" /> Complaint Evidence & Repair Photos
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {photoTypes.map(t => {
            const count = t.key === 'ALL' ? photos.length : photos.filter(p => p.photo_type === t.key).length;
            if (count === 0 && t.key !== 'ALL') return null;

            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`btn btn-sm ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Photos Grid / Side-by-side view */}
        {filteredPhotos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No photos available for this filter 📷
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {filteredPhotos.map((p) => (
              <div key={p.id} style={{
                background: '#1e293b',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  padding: '0.5rem 0.85rem',
                  background: 'rgba(0,0,0,0.3)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#60a5fa',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{p.photo_type.replace(/_/g, ' ')}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>{p.uploader_name}</span>
                </div>
                <div style={{ height: '200px', background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img
                    src={getFullUrl(p.photo_url)}
                    alt={p.photo_type}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop';
                    }}
                  />
                </div>
                <div style={{ padding: '0.5rem 0.85rem', fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  Uploaded: {new Date(p.uploaded_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
