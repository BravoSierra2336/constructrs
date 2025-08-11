import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    reportsWithPDFs: 0,
    totalPDFSize: '0.0',
    averagePDFSize: '0'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [pdfFilter, setPdfFilter] = useState('');
  const [selectedReports, setSelectedReports] = useState([]);

  useEffect(() => {
    // Only load data if authentication is loaded and user is authenticated
    if (!authLoading && user) {
      loadReports();
      loadStats();
    }
  }, [authLoading, user]);

  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, projectFilter, pdfFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // First check if user has admin access
      try {
        const accessCheck = await axios.get('/admin/check-access');
        console.log('Admin access check:', accessCheck.data);
        
        if (!accessCheck.data.hasAdminAccess) {
          setError(`Access denied. You need one of these roles: ${accessCheck.data.requiredRoles.join(', ')}. Your current role: ${accessCheck.data.user.role || 'none'}`);
          return;
        }
      } catch (accessError) {
        console.error('Access check failed:', accessError);
        if (accessError.response?.status === 403) {
          setError('You do not have permission to access the admin dashboard. Required roles: admin, project_manager, or supervisor.');
          return;
        }
      }

      const response = await axios.get('/admin/reports');
      const reportsData = response.data.reports || [];
      setReports(reportsData);
      
      // Extract unique projects
      const uniqueProjects = [...new Set(
        reportsData
          .filter(r => r.projectInfo)
          .map(r => r.projectInfo.name)
      )];
      setProjects(uniqueProjects);
      
    } catch (error) {
      console.error('Error loading reports:', error);
      if (error.response?.status === 403) {
        setError('Access denied. You need admin, project_manager, or supervisor role to access this dashboard.');
      } else {
        setError('Error loading reports: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/admin/reports/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        (report.title && report.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.author && report.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.projectInfo && report.projectInfo.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (projectFilter) {
      filtered = filtered.filter(report =>
        report.projectInfo && report.projectInfo.name === projectFilter
      );
    }

    if (pdfFilter) {
      if (pdfFilter === 'with-pdf') {
        filtered = filtered.filter(report => report.pdfPath);
      } else if (pdfFilter === 'without-pdf') {
        filtered = filtered.filter(report => !report.pdfPath);
      }
    }

    setFilteredReports(filtered);
  };

  const downloadPDF = async (reportId) => {
    try {
      const token = localStorage.getItem('authToken');
      window.open(`/admin/reports/${reportId}/download?token=${token}`, '_blank');
    } catch (error) {
      setError('Error downloading PDF: ' + error.message);
    }
  };

  const bulkDownload = async () => {
    if (selectedReports.length === 0) {
      setError('Please select reports to download');
      return;
    }

    try {
      const response = await axios.post('/admin/reports/bulk-download', {
        reportIds: selectedReports
      });

      const data = response.data;
      const token = localStorage.getItem('authToken');
      
      // Download each PDF individually
      data.availableReports.forEach((report, index) => {
        setTimeout(() => {
          window.open(`/admin/reports/${report.id}/download?token=${token}`, '_blank');
        }, index * 500);
      });

      setSuccess(`Downloading ${data.availableReports.length} PDFs`);
    } catch (error) {
      setError('Error with bulk download: ' + error.message);
    }
  };

  const bulkDelete = async () => {
    if (selectedReports.length === 0) {
      setError('Please select reports to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedReports.length} selected reports? PDFs will be moved to backup folder.`)) {
      return;
    }

    try {
      const response = await axios.delete('/admin/reports/bulk', {
        data: { reportIds: selectedReports }
      });

      setSuccess(`Successfully deleted ${response.data.deletedReports} reports and moved ${response.data.movedPDFs} PDFs to backup folder`);
      setSelectedReports([]);
      loadReports();
      loadStats();
    } catch (error) {
      setError('Error with bulk delete: ' + (error.response?.data?.error || error.message));
    }
  };

  const deleteAllReports = async () => {
    if (!window.confirm('⚠️ DANGER: Are you sure you want to delete ALL reports? PDFs will be moved to backup folder. This will permanently remove all inspection reports from the system database.')) {
      return;
    }

    if (!window.confirm('This is your final warning. Type DELETE in the next prompt to confirm.')) {
      return;
    }

    const confirmation = window.prompt('Type "DELETE" to confirm deletion of all reports:');
    if (confirmation !== 'DELETE') {
      setError('Deletion cancelled - confirmation text did not match');
      return;
    }

    try {
      const response = await axios.delete('/admin/reports/all');
      setSuccess(`Successfully deleted all ${response.data.deletedReports} reports and moved ${response.data.movedPDFs} PDFs to backup folder`);
      setSelectedReports([]);
      loadReports();
      loadStats();
    } catch (error) {
      setError('Error deleting all reports: ' + (error.response?.data?.error || error.message));
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? The PDF will be moved to backup folder.')) {
      return;
    }

    try {
      await axios.delete(`/admin/reports/${reportId}`);
      setSuccess('Report deleted successfully and PDF moved to backup folder');
      loadReports();
      loadStats();
    } catch (error) {
      setError('Error deleting report: ' + error.message);
    }
  };

  const handleReportSelection = (reportId) => {
    setSelectedReports(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else {
        return [...prev, reportId];
      }
    });
  };

  const selectAllReports = () => {
    setSelectedReports(filteredReports.map(r => r._id));
  };

  const clearSelection = () => {
    setSelectedReports([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getProjectName = (report) => {
    return report.projectInfo ? report.projectInfo.name : 'N/A';
  };

  const getInspectorName = (report) => {
    if (report.inspectorInfo) {
      return `${report.inspectorInfo.firstName} ${report.inspectorInfo.lastName}`;
    }
    return report.author || 'N/A';
  };

  if (loading) {
    return (
      <div className="page-layout admin-layout">
        <div className="modern-admin-dashboard">
          <div className="dashboard-background"></div>
          <div className="dashboard-container">
            <div className="page-loading fade-in-up">
              <div className="modern-spinner"></div>
              <p>Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout admin-layout">
      <div className="modern-admin-dashboard">
        {/* Background */}
        <div className="dashboard-background"></div>
        
        {/* Content Container */}
        <div className="dashboard-container">
        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">✅</div>
            <div className="alert-content">
              <strong>Success:</strong> {success}
            </div>
          </div>
        )}
        
        {/* Page Header */}
        <div className="page-header-modern">
          <div className="header-content">
            <div className="header-icon">⚙️</div>
            <div className="header-text">
              <h1 className="page-title-modern">Admin Dashboard</h1>
              <p className="page-subtitle">Manage Construction Reports & PDFs</p>
            </div>
          </div>
          <div className="header-badge">Administrator Access</div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid-modern">
          <div className="stat-card-modern stat-primary">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalReports}</div>
              <div className="stat-label">Total Reports</div>
            </div>
          </div>
          <div className="stat-card-modern stat-success">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <div className="stat-number">{stats.reportsWithPDFs}</div>
              <div className="stat-label">With PDFs</div>
            </div>
          </div>
          <div className="stat-card-modern stat-info">
            <div className="stat-icon">💾</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalPDFSize}</div>
              <div className="stat-label">Total Size (MB)</div>
            </div>
          </div>
          <div className="stat-card-modern stat-warning">
            <div className="stat-icon">📏</div>
            <div className="stat-content">
              <div className="stat-number">{stats.averagePDFSize}</div>
              <div className="stat-label">Avg Size (KB)</div>
            </div>
          </div>
        </div>

        {/* Controls Card */}
        <div className="card-modern controls-card">
          <div className="card-header">
            <h3 className="card-title">📋 Report Management</h3>
            <div className="card-badge">{filteredReports.length} Reports</div>
          </div>
          
          {/* Search and Filter Row */}
          <div className="filter-row-modern">
            <div className="search-group">
              <input
                type="text"
                placeholder="Search reports by title, author, or project..."
                className="modern-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="modern-select"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
            <select
              className="modern-select"
              value={pdfFilter}
              onChange={(e) => setPdfFilter(e.target.value)}
            >
              <option value="">PDF Status</option>
              <option value="with-pdf">With PDF</option>
              <option value="without-pdf">Without PDF</option>
            </select>
            <button className="btn-modern btn-primary" onClick={loadReports}>
              <span className="btn-icon">🔄</span>
              Refresh
            </button>
          </div>
          
          {/* Action Buttons Row */}
          <div className="action-row-modern">
            <div className="action-group">
              <button className="btn-modern btn-success" onClick={bulkDownload}>
                <span className="btn-icon">📦</span>
                Bulk Download Selected
              </button>
              <button className="btn-modern btn-warning" onClick={bulkDelete}>
                <span className="btn-icon">🗑️</span>
                Delete Selected
              </button>
              <button className="btn-modern btn-secondary" onClick={selectAllReports}>
                <span className="btn-icon">✅</span>
                Select All
              </button>
              <button className="btn-modern btn-secondary" onClick={clearSelection}>
                <span className="btn-icon">❌</span>
                Clear Selection
              </button>
            </div>
            <button 
              className="btn-modern btn-danger btn-danger-special" 
              onClick={deleteAllReports}
            >
              <span className="btn-icon">💥</span>
              DELETE ALL REPORTS
            </button>
          </div>
        </div>

        {/* Reports Table Card */}
        {filteredReports.length === 0 ? (
          <div className="card-modern empty-state">
            <div className="empty-icon">📂</div>
            <h3 className="empty-title">No Reports Found</h3>
            <p className="empty-description">
              {searchTerm || projectFilter || pdfFilter 
                ? 'Try adjusting your search filters to find more reports.' 
                : 'No reports have been created yet. Create your first report to get started.'}
            </p>
          </div>
        ) : (
          <div className="card-modern table-card">
            <div className="table-container-modern">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input
                        type="checkbox"
                        className="checkbox-modern"
                        checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllReports();
                          } else {
                            clearSelection();
                          }
                        }}
                      />
                    </th>
                    <th>Report Title</th>
                    <th>Project</th>
                    <th>Inspector</th>
                    <th>Created Date</th>
                    <th>PDF Status</th>
                    <th>PDF Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr key={report._id} className={selectedReports.includes(report._id) ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox-modern"
                          checked={selectedReports.includes(report._id)}
                          onChange={() => handleReportSelection(report._id)}
                        />
                      </td>
                      <td>
                        <div className="report-title">
                          <strong>{report.title || 'Untitled'}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="project-name">{getProjectName(report)}</div>
                      </td>
                      <td>
                        <div className="inspector-name">{getInspectorName(report)}</div>
                      </td>
                      <td>
                        <div className="date-display">{formatDate(report.createdAt)}</div>
                      </td>
                      <td>
                        {report.pdfPath ? (
                          <span className="status-badge-modern status-success">
                            <span className="status-icon">✅</span>
                            Available
                          </span>
                        ) : (
                          <span className="status-badge-modern status-danger">
                            <span className="status-icon">❌</span>
                            Missing
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="file-size">{report.pdfSize ? `${report.pdfSize} KB` : 'N/A'}</div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {report.pdfPath ? (
                            <button
                              className="btn-small btn-primary-small"
                              onClick={() => downloadPDF(report._id)}
                            >
                              <span className="btn-icon-small">📥</span>
                              Download
                            </button>
                          ) : (
                            <button
                              className="btn-small btn-secondary-small"
                              disabled
                            >
                              <span className="btn-icon-small">🔄</span>
                              Generate
                            </button>
                          )}
                          <button
                            className="btn-small btn-danger-small"
                            onClick={() => deleteReport(report._id)}
                          >
                            <span className="btn-icon-small">🗑️</span>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
