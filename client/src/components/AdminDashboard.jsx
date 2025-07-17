import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
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
    loadReports();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, projectFilter, pdfFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
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
      setError('Error loading reports: ' + (error.response?.data?.error || error.message));
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
        filtered = filtered.filter(report => report.pdfExists);
      } else if (pdfFilter === 'without-pdf') {
        filtered = filtered.filter(report => !report.pdfExists);
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

  const deleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report and its PDF? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/admin/reports/${reportId}`);
      setSuccess('Report deleted successfully');
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
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="container">
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">⚙️ Admin Dashboard</h1>
        <p className="page-description">
          Manage Construction Reports & PDFs - Project Administrator Access
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalReports}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.reportsWithPDFs}</div>
          <div className="stat-label">Reports with PDFs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalPDFSize}</div>
          <div className="stat-label">Total PDF Size (MB)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.averagePDFSize}</div>
          <div className="stat-label">Avg PDF Size (KB)</div>
        </div>
      </div>

      {/* Controls */}
      <div className="search-and-filter">
        <h3 style={{ marginBottom: '20px', color: '#333' }}>📋 Report Management</h3>
        <div className="filter-row">
          <input
            type="text"
            placeholder="Search reports by title, author, or project..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            value={pdfFilter}
            onChange={(e) => setPdfFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">PDF Status</option>
            <option value="with-pdf">With PDF</option>
            <option value="without-pdf">Without PDF</option>
          </select>
          <button className="btn btn-primary" onClick={loadReports}>
            🔄 Refresh
          </button>
        </div>
        <div className="filter-row">
          <button className="btn btn-success" onClick={bulkDownload}>
            📦 Bulk Download Selected
          </button>
          <button className="btn btn-secondary" onClick={selectAllReports}>
            ✅ Select All
          </button>
          <button className="btn btn-secondary" onClick={clearSelection}>
            ❌ Clear Selection
          </button>
        </div>
      </div>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>No Reports Found</h3>
          <p style={{ color: '#999' }}>
            {searchTerm || projectFilter || pdfFilter ? 'Try adjusting your search filters.' : 'No reports have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
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
                  <tr key={report._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report._id)}
                        onChange={() => handleReportSelection(report._id)}
                      />
                    </td>
                    <td>
                      <strong>{report.title || 'Untitled'}</strong>
                    </td>
                    <td>{getProjectName(report)}</td>
                    <td>{getInspectorName(report)}</td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      {report.pdfExists ? (
                        <span className="status-badge status-success">✅ Available</span>
                      ) : (
                        <span className="status-badge status-danger">❌ Missing</span>
                      )}
                    </td>
                    <td>{report.pdfSize ? `${report.pdfSize} KB` : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {report.pdfExists ? (
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                            onClick={() => downloadPDF(report._id)}
                          >
                            📥 Download
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                            disabled
                          >
                            🔄 Generate
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                          onClick={() => deleteReport(report._id)}
                        >
                          🗑️ Delete
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
  );
};

export default AdminDashboard;
