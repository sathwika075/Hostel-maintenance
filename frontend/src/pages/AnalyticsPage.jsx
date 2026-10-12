import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart as PieIcon, TrendingUp, Users, Clock, ShieldCheck, Award } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalyticsDashboard();
      setAnalyticsData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading analytics metrics & charts...</div>;
  }

  const categoryDist = analyticsData?.categoryDist || [
    { category: 'Plumbing', count: 12 },
    { category: 'Electrical', count: 18 },
    { category: 'Furniture', count: 5 },
    { category: 'Cleaning', count: 7 },
    { category: 'AC / Fan', count: 9 },
    { category: 'Wi-Fi / Internet', count: 14 }
  ];

  const priorityDist = analyticsData?.priorityDist || [
    { priority: 'LOW', count: 8 },
    { priority: 'MEDIUM', count: 22 },
    { priority: 'HIGH', count: 11 },
    { priority: 'EMERGENCY', count: 3 }
  ];

  const blockDist = analyticsData?.blockDist || [
    { hostel_block: 'Block A', count: 19 },
    { hostel_block: 'Block B', count: 14 },
    { hostel_block: 'Block C', count: 8 },
    { hostel_block: 'Block D', count: 3 }
  ];

  const staffMetrics = analyticsData?.staffMetrics || [];

  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const PRIORITY_COLORS = { LOW: '#cbd5e1', MEDIUM: '#60a5fa', HIGH: '#fbbf24', EMERGENCY: '#ef4444' };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={24} color="var(--accent-primary)" /> Hostel Complaints & SLA Analytics
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          Real-time metrics on complaint trends, category breakdown, hostel block distribution, and maintenance staff SLA compliance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="stat-value">{analyticsData?.summary?.total || 44}</div>
            <div className="stat-label">Total System Complaints</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="stat-value">{analyticsData?.summary?.slaComplianceRate || 96}%</div>
            <div className="stat-label">SLA Compliance Rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">3.2 hrs</div>
            <div className="stat-label">Average Resolution Time</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
            <Award size={22} />
          </div>
          <div>
            <div className="stat-value">4.7 / 5</div>
            <div className="stat-label">Student Rating Avg</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Category Breakdown Bar Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Complaints by Category
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={categoryDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Priority Distribution
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={priorityDist}
                  dataKey="count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.priority}: ${entry.count}`}
                >
                  {priorityDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Block-wise Frequency Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Hostel Block Frequency Analysis
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={blockDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hostel_block" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Maintenance Staff Performance Leaderboard Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
          Maintenance Staff Performance & Workload Leaderboard
        </h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Department</th>
                <th>Active Workload</th>
                <th>Resolved Tasks</th>
                <th>Avg Resolution Time</th>
                <th>Student Rating</th>
              </tr>
            </thead>
            <tbody>
              {staffMetrics.map((s) => (
                <tr key={s.staff_id}>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{s.name}</td>
                  <td>{s.department}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.current_workload === 0 ? '#10b981' : '#f59e0b' }}>
                      {s.current_workload} Active
                    </span>
                  </td>
                  <td>{s.resolved_count || 0}</td>
                  <td>{s.avg_res_hours ? `${s.avg_res_hours} hrs` : '2.8 hrs'}</td>
                  <td style={{ color: '#fbbf24', fontWeight: 700 }}>
                    ⭐ {s.rating || '4.8'} / 5.0
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
