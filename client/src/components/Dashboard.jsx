import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../utils/api';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalReports: 0,
    recentReports: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only fetch data if authentication is loaded and user is authenticated
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [authLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Fetch projects
      const projectsResponse = await api.get('/projects');
      const projects = projectsResponse.data.projects || [];
      
      // Fetch reports
      const reportsResponse = await api.get('/reports');
      const reports = reportsResponse.data.reports || [];
      
      setStats({
        totalProjects: projects.length,
        totalReports: reports.length,
        recentReports: reports.slice(0, 5) // Get 5 most recent reports
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection and try again.');
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
    return (
      <div className="page-layout dashboard-layout">
        <div className="page-content">
          <div className="page-loading fade-in-up">
            <div className="modern-spinner"></div>
            <p className="text-muted">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout dashboard-layout">
      <div className="page-background"></div>
      <div className="page-content fade-in-up">
        {error && (
          <Alert variant="danger" className="page-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={fetchDashboardData}
                disabled={loading}
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin me-1"></i>Retrying...</>
                ) : (
                  <><i className="fas fa-redo me-1"></i>Retry</>
                )}
              </Button>
            </div>
          </Alert>
        )}
        
        {/* Modern Hero Section */}
        <div className="modern-hero slide-up">
          <div className="modern-hero-content">
            <h1 className="mb-3">
              {getGreeting()}, {user?.firstName}! 👋
            </h1>
            <p className="lead mb-0">
              Welcome to your Construction Management Dashboard. 
              Logged in as <span className="fw-bold">{getRoleDisplayName(user?.role)}</span>
            </p>
          </div>
        </div>

      {/* Modern Stats Grid */}
      <div className="modern-stats-grid">
        <div className="modern-stat-card no-interact">
          <div className="modern-stat-number">{stats.totalProjects}</div>
          <div className="modern-stat-label">🏗️ Active Projects</div>
        </div>
        <div className="modern-stat-card no-interact">
          <div className="modern-stat-number">{stats.totalReports}</div>
          <div className="modern-stat-label">📋 Total Reports</div>
        </div>
        <div className="modern-stat-card no-interact">
          <div className="modern-stat-number">{stats.recentReports.length}</div>
          <div className="modern-stat-label">📄 Recent Reports</div>
        </div>
        <div className="modern-stat-card no-interact">
          <div className="modern-stat-number">{user?.role === 'admin' ? '∞' : '1'}</div>
          <div className="modern-stat-label">🔐 Access Level</div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <Row className="g-4 mb-4">
        <Col md={6} lg={3}>
          <div className="modern-card h-100">
            <div className="modern-card-body text-center">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
              <h5 className="fw-bold mb-3">Manage Projects</h5>
              <p className="text-muted mb-4">
                Browse, create and manage your construction projects with ease
              </p>
              <Button 
                as={Link} 
                to="/projects" 
                className="modern-btn modern-btn-primary w-100"
                style={{ textDecoration: 'none' }}
              >
                <i className="fas fa-building me-2"></i>
                View Projects
              </Button>
            </div>
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="modern-card h-100">
            <div className="modern-card-body text-center">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>�</div>
              <h5 className="fw-bold mb-3">Create Report</h5>
              <p className="text-muted mb-4">
                Submit detailed inspection reports and track progress
              </p>
              <Button 
                as={Link} 
                to="/reports/create" 
                className="modern-btn modern-btn-primary w-100"
                style={{ textDecoration: 'none' }}
              >
                <i className="fas fa-plus me-2"></i>
                New Report
              </Button>
            </div>
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="modern-card h-100">
            <div className="modern-card-body text-center">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h5 className="fw-bold mb-3">View Reports</h5>
              <p className="text-muted mb-4">
                Review all submitted reports and track compliance
              </p>
              <Button 
                as={Link} 
                to="/reports" 
                className="modern-btn modern-btn-primary w-100"
                style={{ textDecoration: 'none' }}
              >
                <i className="fas fa-chart-bar me-2"></i>
                All Reports
              </Button>
            </div>
          </div>
        </Col>

        {['admin', 'project_manager', 'supervisor'].includes(user?.role) && (
          <Col md={6} lg={3}>
            <div className="modern-card h-100">
              <div className="modern-card-body text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
                <h5 className="fw-bold mb-3">Admin Panel</h5>
                <p className="text-muted mb-4">
                  Manage users, settings and system configuration
                </p>
                <Button 
                  as={Link} 
                  to="/admin" 
                  className="modern-btn modern-btn-primary w-100"
                  style={{ textDecoration: 'none' }}
                >
                  <i className="fas fa-cogs me-2"></i>
                  Admin Panel
                </Button>
              </div>
            </div>
          </Col>
        )}
      </Row>

      {/* Recent Reports Table */}
      {stats.recentReports.length > 0 && (
        <div className="modern-card">
          <div className="modern-card-header">
            <h4 className="mb-0 d-flex align-items-center">
              <i className="fas fa-clock me-2 text-primary"></i>
              Recent Reports
            </h4>
          </div>
          <div className="modern-card-body p-0">
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th><i className="fas fa-file-alt me-2"></i>Title</th>
                    <th><i className="fas fa-building me-2"></i>Project</th>
                    <th><i className="fas fa-user me-2"></i>Author</th>
                    <th><i className="fas fa-calendar me-2"></i>Date</th>
                    <th><i className="fas fa-check-circle me-2"></i>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentReports.map((report, index) => (
                    <tr key={report._id || index}>
                      <td className="fw-medium">{report.title || 'Untitled Report'}</td>
                      <td className="text-muted">{report.projectInfo?.name || 'N/A'}</td>
                      <td className="text-muted">{report.author || 'N/A'}</td>
                      <td className="text-muted">{formatDate(report.createdAt)}</td>
                      <td>
                        <span className="modern-badge modern-badge-success">
                          <i className="fas fa-check me-1"></i>
                          Submitted
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 text-center border-top">
              <Button 
                as={Link} 
                to="/reports" 
                className="modern-btn modern-btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                <i className="fas fa-arrow-right me-2"></i>
                View All Reports
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
