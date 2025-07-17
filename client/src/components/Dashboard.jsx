import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalReports: 0,
    recentReports: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const projectsResponse = await axios.get('/projects');
      const projects = projectsResponse.data.projects || [];
      
      // Fetch reports
      const reportsResponse = await axios.get('/reports');
      const reports = reportsResponse.data.reports || [];
      
      setStats({
        totalProjects: projects.length,
        totalReports: reports.length,
        recentReports: reports.slice(0, 5) // Get 5 most recent reports
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Administrator',
      project_manager: 'Project Manager',
      supervisor: 'Supervisor',
      inspector: 'Inspector',
      employee: 'Employee'
    };
    return roleNames[role] || role;
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="container">
      {error && <div className="error">{error}</div>}
      
      {/* Welcome Section */}
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="hero-subtitle">
            Welcome back to your Construction Management Dashboard. 
            You're logged in as {getRoleDisplayName(user?.role)}.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalProjects}</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalReports}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.recentReports.length}</div>
          <div className="stat-label">Recent Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{user?.role === 'admin' ? '∞' : '1'}</div>
          <div className="stat-label">Access Level</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="action-card">
          <div className="action-icon">🏢</div>
          <h3 className="action-title">View Projects</h3>
          <p className="action-description">
            Browse and manage construction projects
          </p>
          <Link to="/projects" className="btn btn-primary">
            Go to Projects
          </Link>
        </div>

        <div className="action-card">
          <div className="action-icon">📋</div>
          <h3 className="action-title">Create Report</h3>
          <p className="action-description">
            Submit a new construction inspection report
          </p>
          <Link to="/reports/create" className="btn btn-primary">
            Create Report
          </Link>
        </div>

        <div className="action-card">
          <div className="action-icon">📊</div>
          <h3 className="action-title">View Reports</h3>
          <p className="action-description">
            Review all submitted inspection reports
          </p>
          <Link to="/reports" className="btn btn-primary">
            View Reports
          </Link>
        </div>

        {['admin', 'project_manager', 'supervisor'].includes(user?.role) && (
          <div className="action-card">
            <div className="action-icon">⚙️</div>
            <h3 className="action-title">Admin Panel</h3>
            <p className="action-description">
              Manage users, projects, and system settings
            </p>
            <Link to="/admin" className="btn btn-primary">
              Admin Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Recent Reports */}
      {stats.recentReports.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: '#333' }}>📋 Recent Reports</h3>
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentReports.map((report, index) => (
                  <tr key={report._id || index}>
                    <td>{report.title || 'Untitled Report'}</td>
                    <td>{report.projectInfo?.name || 'N/A'}</td>
                    <td>{report.author || 'N/A'}</td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      <span className="status-badge status-success">
                        Submitted
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/reports" className="btn btn-secondary">
              View All Reports
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
