import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Add event listener to refetch data when window gains focus
    const handleWindowFocus = () => {
      fetchData();
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, projectFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reports and projects in parallel
      const [reportsResponse, projectsResponse] = await Promise.all([
        axios.get('/reports'),
        axios.get('/projects')
      ]);
      
      console.log('Reports response:', reportsResponse.data);
      console.log('Projects response:', projectsResponse.data);
      
      setReports(reportsResponse.data.reports || []);
      setProjects(projectsResponse.data.projects || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
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

    setFilteredReports(filtered);
  };

  const downloadPDF = async (reportId) => {
    try {
      // Check if the report exists and has a PDF
      const report = reports.find(r => r._id === reportId);
      if (!report) {
        setError('Report not found');
        return;
      }
      
      // Check if PDF exists using pdfPath property
      if (!report.pdfPath) {
        setError('PDF is still being generated. Please try again in a moment.');
        return;
      }
      
      // Use the correct PDF download endpoint
      const token = localStorage.getItem('authToken');
      const downloadUrl = `/reports/${reportId}/pdf`;
      
      // Add authorization header by opening in new window with token
      window.open(`${downloadUrl}?token=${token}`, '_blank');
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download PDF. Please try again.');
    }
  };

  const deleteReport = async (reportId, reportTitle) => {
    // Check if user is admin before attempting deletion
    if (!isAdmin()) {
      setError('Only admin users can delete reports.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the report "${reportTitle}"? The PDF will be moved to backup folder.`)) {
      return;
    }

    try {
      const response = await axios.delete(`/reports/${reportId}`);
      
      if (response.data.success) {
        // Remove the deleted report from the local state
        setReports(reports.filter(r => r._id !== reportId));
        setError(''); // Clear any previous errors
        
        // Show success message temporarily
        const successMessage = 'Report deleted successfully - PDF moved to backup folder';
        setError(successMessage);
        setTimeout(() => {
          if (error === successMessage) {
            setError('');
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 403) {
        setError('You do not have permission to delete reports. Admin role required.');
      } else if (error.response?.status === 404) {
        setError('Report not found.');
      } else {
        setError('Failed to delete report. Please try again.');
      }
    }
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

  const canCreateReports = () => {
    return ['admin', 'project_manager', 'supervisor', 'inspector'].includes(user?.role);
  };

  const isAdmin = () => {
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    console.log('Is admin check:', user?.role === 'admin');
    return user?.role === 'admin';
  };

  if (loading) {
    return (
      <div className="page-layout">
        <div className="page-content">
          <div className="page-loading fade-in-up">
            <div className="modern-spinner"></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <div className="page-background"></div>
      <div className="page-content fade-in-up">
        {error && <div className="page-error">{error}</div>}
        
        {/* Page Header */}
        <div className="page-header-section">
          <h1 className="page-title">📋 Inspection Reports</h1>
          <p className="page-description">
            View and manage construction inspection reports
          </p>
        </div>

        {/* Search and Filter */}
        <div className="page-section">
          <div className="page-filters">
            <div className="page-search">
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
              style={{ minWidth: '200px' }}
            >
              <option value="">All Projects</option>
              {projects.map(project => (
              <option key={project._id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline-secondary"
            onClick={fetchData}
            disabled={loading}
            title="Refresh reports"
          >
            🔄 {loading ? 'Loading...' : 'Refresh'}
          </button>
          {canCreateReports() && (
            <Link to="/reports/create" className="btn btn-primary">
              ➕ Create Report
            </Link>
          )}
        </div>
      </div>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>No Reports Found</h3>
          <p style={{ color: '#999' }}>
            {searchTerm || projectFilter ? 'Try adjusting your search filters.' : 'No reports have been created yet.'}
          </p>
          {canCreateReports() && !searchTerm && !projectFilter && (
            <Link to="/reports/create" className="btn btn-primary" style={{ marginTop: '20px' }}>
              Create Your First Report
            </Link>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Project</th>
                  <th>Inspector</th>
                  <th>Date Created</th>
                  <th>PDF Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr key={report._id}>
                    <td>
                      <strong>{report.title || 'Untitled Report'}</strong>
                      {report.description && (
                        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                          {report.description.length > 100 
                            ? `${report.description.substring(0, 100)}...`
                            : report.description
                          }
                        </div>
                      )}
                    </td>
                    <td>{getProjectName(report)}</td>
                    <td>{getInspectorName(report)}</td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      {report.pdfPath ? (
                        <span className="status-badge status-success">
                          ✅ Available
                        </span>
                      ) : (
                        <span className="status-badge status-warning">
                          ⏳ Generating
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                          onClick={() => downloadPDF(report._id)}
                          disabled={!report.pdfPath}
                          title={report.pdfPath ? 'Download report PDF' : 'PDF not available yet'}
                        >
                          👁️ View Report
                        </button>
                        {isAdmin() && (
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                            onClick={() => deleteReport(report._id, report.title || 'Untitled Report')}
                            title={`Delete this report (Admin only) - Current role: ${user?.role || 'unknown'}`}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {filteredReports.length > 0 && (
        <div className="stats-grid" style={{ marginTop: '30px' }}>
          <div className="stat-card">
            <div className="stat-number">{filteredReports.length}</div>
            <div className="stat-label">Total Reports</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {filteredReports.filter(r => r.pdfPath).length}
            </div>
            <div className="stat-label">PDFs Available</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {new Set(filteredReports.map(r => getProjectName(r))).size}
            </div>
            <div className="stat-label">Projects Covered</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {new Set(filteredReports.map(r => getInspectorName(r))).size}
            </div>
            <div className="stat-label">Inspectors</div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Reports;
