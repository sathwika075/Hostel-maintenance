import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Filter, Calendar } from 'lucide-react';
import { api } from '../services/api';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('monthly');
  const [blockFilter, setBlockFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportType, blockFilter, categoryFilter]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReportSummary({ reportType, block: blockFilter, category: categoryFilter });
      setReportData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData?.records || reportData.records.length === 0) return;

    const headers = ['Complaint Code', 'Student', 'Roll', 'Block', 'Room', 'Category', 'Priority', 'Status', 'Staff', 'SLA Status', 'Rating'];
    const rows = reportData.records.map(r => [
      r.complaint_code,
      r.student_name,
      r.roll_number,
      r.hostel_block,
      r.room_number,
      r.category,
      r.priority,
      r.status,
      r.staff_name || 'Unassigned',
      r.sla_status,
      r.rating || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HOSTELCARE_${reportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const records = reportData?.records || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} color="var(--accent-primary)" /> Reports & Audit Documentation
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Generate and export official hostel maintenance summaries, block audits, and staff compliance logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV} disabled={records.length === 0}>
            <Download size={16} /> Export CSV Report
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: '#ffffff' }}>
          <Filter size={16} color="var(--accent-primary)" /> Configure Report Criteria
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label">Report Type</label>
            <select className="form-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="monthly">Monthly Summary Report</option>
              <option value="category">Category-wise Analysis</option>
              <option value="block">Hostel Block Audit</option>
              <option value="staff">Staff Performance & SLA</option>
              <option value="satisfaction">Student Satisfaction</option>
            </select>
          </div>

          <div>
            <label className="form-label">Filter Hostel Block</label>
            <select className="form-select" value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
              <option value="">All Blocks</option>
              <option value="Block A">Block A</option>
              <option value="Block B">Block B</option>
              <option value="Block C">Block C</option>
              <option value="Block D">Block D</option>
            </select>
          </div>

          <div>
            <label className="form-label">Filter Category</label>
            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Furniture">Furniture</option>
              <option value="Cleaning">Cleaning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Records Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
            Generated Report Data ({records.length} Records)
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            Generated: {new Date().toLocaleTimeString()}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Generating report data...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No records match the selected criteria.</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Student</th>
                  <th>Block & Room</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>SLA Audit</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa' }}>{r.complaint_code}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{r.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.roll_number}</div>
                    </td>
                    <td>{r.hostel_block} • {r.room_number}</td>
                    <td>{r.category}</td>
                    <td>
                      <span className={`priority-badge priority-${r.priority}`}>{r.priority}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-${r.status}`}>{r.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td>{r.staff_name || 'Unassigned'}</td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: r.sla_status === 'MET' ? '#10b981' : '#ef4444'
                      }}>
                        {r.sla_status === 'MET' ? '✓ MET' : '⚠ BREACHED'}
                      </span>
                    </td>
                    <td style={{ color: '#fbbf24', fontWeight: 700 }}>
                      {r.rating ? `⭐ ${r.rating}/5` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
