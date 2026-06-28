import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Activity, AlertCircle, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    critical: 0,
    categoryData: [],
    statusData: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "issues"));
        const issues = [];
        querySnapshot.forEach(doc => issues.push(doc.data()));

        let resolvedCount = 0;
        let criticalCount = 0;
        const catMap = {};
        const statMap = { 'reported': 0, 'in_progress': 0, 'resolved': 0 };

        issues.forEach(issue => {
          if (issue.status === 'resolved') resolvedCount++;
          if (issue.isCritical) criticalCount++;
          
          catMap[issue.category] = (catMap[issue.category] || 0) + 1;
          statMap[issue.status] = (statMap[issue.status] || 0) + 1;
        });

        const categoryData = Object.keys(catMap).map(key => ({ name: key, value: catMap[key] }));
        const statusData = Object.keys(statMap).map(key => ({ name: key.replace('_', ' ').toUpperCase(), value: statMap[key] }));

        setStats({
          total: issues.length,
          resolved: resolvedCount,
          critical: criticalCount,
          categoryData,
          statusData
        });
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading Impact Dashboard...</div>;
  }

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Impact Dashboard</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Real-time civic engagement and issue resolution metrics.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="bento-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Total Issues Reported</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{stats.total}</p>
        </div>
        <div className="bento-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Issues Resolved</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)', margin: 0 }}>{stats.resolved}</p>
        </div>
        <div className="bento-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Critical Alerts</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)', margin: 0 }}>{stats.critical}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        <div className="bento-card" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChartIcon size={20} color="var(--primary)"/> Issue Categories
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {stats.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bento-card" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--secondary)"/> Resolution Status
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={stats.statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)' }} />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

export default AnalyticsDashboard;
