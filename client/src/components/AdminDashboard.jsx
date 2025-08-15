import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../utils/api.js';
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
  // User management state
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', role: 'employee', password: '' });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingOriginalUser, setEditingOriginalUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  // Audit logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(20);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  useEffect(() => {
    // Only load data if authentication is loaded and user is authenticated
    if (!authLoading && user) {
      loadReports();
      loadStats();
  loadUsers();
  loadAuditLogs();
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
  const accessCheck = await api.get('/admin/check-access');
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

  const response = await api.get('/admin/reports');
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
  const response = await api.get('/admin/reports/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ===== User Management Functions =====
  const loadUsers = async (opts = {}) => {
    try {
      const q = opts.q !== undefined ? opts.q : userSearch;
      const page = opts.page !== undefined ? opts.page : userPage;
      const pageSize = opts.pageSize !== undefined ? opts.pageSize : userPageSize;
      const res = await api.get('/admin/users', { params: { q, page, pageSize } });
      setUsers(res.data.users || []);
      setUserTotal(res.data.total || 0);
      setUserPage(res.data.page || 1);
      setUserPageSize(res.data.pageSize || pageSize);
      setUserTotalPages(res.data.totalPages || 1);
    } catch (e) {
      console.error('Error loading users:', e);
    }
  };

  const loadAuditLogs = async (opts = {}) => {
    try {
      const page = opts.page !== undefined ? opts.page : auditPage;
      const pageSize = opts.pageSize !== undefined ? opts.pageSize : auditPageSize;
      const res = await api.get('/admin/audit-logs', { params: { page, pageSize } });
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.total || 0);
      setAuditPage(res.data.page || 1);
      setAuditPageSize(res.data.pageSize || pageSize);
      setAuditTotalPages(res.data.totalPages || 1);
    } catch (e) {
      console.error('Error loading audit logs:', e);
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const resetUserForm = () => {
    setUserForm({ firstName: '', lastName: '', email: '', role: 'employee', password: '' });
    setEditingUserId(null);
  setEditingOriginalUser(null);
  };

  const submitUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        const { password, ...payload } = userForm; // Only send password if provided
        const body = password ? { ...payload, password } : payload;
        // Confirm role demotion from admin to non-admin
        if (editingOriginalUser && editingOriginalUser.role === 'admin' && userForm.role !== 'admin') {
          const confirmMsg = `You're changing ${editingOriginalUser.firstName || ''} ${editingOriginalUser.lastName || ''}`.trim() +
            ` from Admin to ${userForm.role}.\n\nThis removes admin privileges. If this is the last admin, the server will block it.`;
          if (!window.confirm(confirmMsg)) {
            return;
          }
        }
        await api.put(`/admin/users/${editingUserId}`, body);
        setSuccess('User updated');
      } else {
        await api.post('/admin/users', userForm);
        setSuccess('User created');
      }
  resetUserForm();
  loadUsers({ page: 1 });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const editUser = (u) => {
    setEditingUserId(u._id);
    setEditingOriginalUser(u);
    setUserForm({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', role: u.role || 'employee', password: '' });
  };

  const deleteUser = async (u) => {
    const isAdminTarget = u.role === 'admin';
    const baseMsg = 'Delete this user?';
    const warning = isAdminTarget ? '\n\nWarning: You are deleting an admin. If they are the last admin, the server will block it.' : '';
    if (!window.confirm(baseMsg + warning)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
  setSuccess('User deleted');
  // If deleting reduces visible list size, adjust page
  const nextCount = users.length - 1;
  const nextPage = nextCount === 0 && userPage > 1 ? userPage - 1 : userPage;
  loadUsers({ page: nextPage });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // ===== CSV Export Helpers =====
  const toCSV = (rows, headers) => {
    const escape = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines = [];
    lines.push(headers.map(h => escape(h.label)).join(','));
    for (const r of rows) {
      lines.push(headers.map(h => escape(typeof h.value === 'function' ? h.value(r) : r[h.key])).join(','));
    }
    return lines.join('\r\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchAllUsers = async () => {
    const pageSize = 200;
    let page = 1;
    let all = [];
    const q = userSearch;
    while (true) {
      const res = await api.get('/admin/users', { params: { q, page, pageSize } });
      const list = res.data.users || [];
      all = all.concat(list);
      const total = res.data.total || list.length;
      if (all.length >= total || list.length === 0) break;
      page += 1;
    }
    return all;
  };

  const fetchAllAuditLogs = async () => {
    const pageSize = 200;
    let page = 1;
    let all = [];
    while (true) {
      const res = await api.get('/admin/audit-logs', { params: { page, pageSize } });
      const list = res.data.logs || [];
      all = all.concat(list);
      const total = res.data.total || list.length;
      if (all.length >= total || list.length === 0) break;
      page += 1;
    }
    return all;
  };

  const exportUsersCSV = async () => {
    try {
      const all = await fetchAllUsers();
      const headers = [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'authProvider', label: 'Provider' },
        { key: 'createdAt', label: 'Created At', value: (r) => (r.createdAt ? new Date(r.createdAt).toISOString() : '') }
      ];
      const csv = toCSV(all, headers);
      const ts = new Date().toISOString().replace(/[:]/g, '-');
      downloadCSV(csv, `users-${ts}.csv`);
    } catch (e) {
      setError(e.message);
    }
  };

  const exportAuditCSV = async () => {
    try {
      const all = await fetchAllAuditLogs();
      const headers = [
        { key: 'createdAt', label: 'Time', value: (r) => (r.createdAt ? new Date(r.createdAt).toISOString() : '') },
        { key: 'action', label: 'Action' },
        { key: 'actor', label: 'Actor' },
        { key: 'actorEmail', label: 'Actor Email' },
        { key: 'target', label: 'Target' },
        { key: 'targetEmail', label: 'Target Email' },
        { key: 'details', label: 'Details', value: (r) => JSON.stringify(r.details || {}) }
      ];
      const csv = toCSV(all, headers);
      const ts = new Date().toISOString().replace(/[:]/g, '-');
      downloadCSV(csv, `audit-logs-${ts}.csv`);
    } catch (e) {
      setError(e.message);
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
  const response = await api.post('/admin/reports/bulk-download', {
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
  const response = await api.delete('/admin/reports/bulk', {
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
  const response = await api.delete('/admin/reports/all');
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
  await api.delete(`/admin/reports/${reportId}`);
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

        {/* Users Management Card (Admin only) */}
  {user?.role === 'admin' && (
  <div className="card-modern">
          <div className="card-header">
            <h3 className="card-title">👥 User Management</h3>
            <div className="card-badge">{userTotal} Total</div>
            <div className="ms-auto">
              <button className="btn-modern btn-secondary" onClick={() => loadUsers()}>
                <span className="btn-icon">🔄</span>
                Refresh Users
              </button>
              <button className="btn-modern btn-secondary" onClick={exportUsersCSV} style={{ marginLeft: 8 }}>
                <span className="btn-icon">📤</span>
                Export CSV
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="filter-row-modern" style={{ marginBottom: '1rem' }}>
              <input
                className="modern-search"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadUsers({ page: 1, q: e.target.value });
                }}
              />
              <button className="btn-modern btn-primary" onClick={() => loadUsers({ page: 1 })}>Search</button>
              <select className="modern-select" value={userPageSize} onChange={(e) => { const ps = parseInt(e.target.value,10); setUserPageSize(ps); loadUsers({ page: 1, pageSize: ps }); }}>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ marginRight: 12 }}>Page {userPage} / {userTotalPages}</span>
                <button className="btn-modern btn-secondary" disabled={userPage <= 1} onClick={() => loadUsers({ page: userPage - 1 })}>Prev</button>
                <button className="btn-modern btn-secondary" disabled={userPage >= userTotalPages} onClick={() => loadUsers({ page: userPage + 1 })} style={{ marginLeft: 8 }}>Next</button>
              </div>
            </div>
            <form onSubmit={submitUser} className="modern-form-grid">
              <input className="modern-input" placeholder="First name" name="firstName" value={userForm.firstName} onChange={handleUserFormChange} required />
              <input className="modern-input" placeholder="Last name" name="lastName" value={userForm.lastName} onChange={handleUserFormChange} required />
              <input className="modern-input" placeholder="Email" name="email" type="email" value={userForm.email} onChange={handleUserFormChange} required />
              <select className="modern-select" name="role" value={userForm.role} onChange={handleUserFormChange}>
                <option value="employee">Employee</option>
                <option value="inspector">Inspector</option>
                <option value="supervisor">Supervisor</option>
    <option value="project_manager">Project Manager</option>
    <option value="admin">Admin</option>
              </select>
              <input className="modern-input" placeholder={editingUserId ? 'New password (optional)' : 'Password'} name="password" type="password" value={userForm.password} onChange={handleUserFormChange} {...(editingUserId ? {} : { required: true })} />
              <div className="d-flex gap-2">
                <button type="submit" className="btn-modern btn-primary">
                  {editingUserId ? 'Update User' : 'Add User'}
                </button>
                {editingUserId && (
                  <button type="button" className="btn-modern btn-secondary" onClick={resetUserForm}>Cancel</button>
                )}
              </div>
            </form>

            <div className="table-responsive" style={{ marginTop: '1rem' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Provider</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>{u.firstName} {u.lastName}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.authProvider || 'local'}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button className="btn-modern btn-secondary" onClick={() => editUser(u)}>Edit</button>
                          <button className="btn-modern btn-warning" onClick={() => deleteUser(u)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex align-items-center" style={{ marginTop: '0.75rem' }}>
              <span style={{ marginRight: 12 }}>Showing {(userPage - 1) * userPageSize + Math.min(users.length ? 1 : 0, 1)} - {(userPage - 1) * userPageSize + users.length} of {userTotal}</span>
              <div style={{ marginLeft: 'auto' }}>
                <button className="btn-modern btn-secondary" disabled={userPage <= 1} onClick={() => loadUsers({ page: userPage - 1 })}>Prev</button>
                <button className="btn-modern btn-secondary" disabled={userPage >= userTotalPages} onClick={() => loadUsers({ page: userPage + 1 })} style={{ marginLeft: 8 }}>Next</button>
              </div>
            </div>
          </div>
  </div>
  )}

        {/* Audit Logs (Admin only) */}
        {user?.role === 'admin' && (
        <div className="card-modern">
          <div className="card-header">
            <h3 className="card-title">🪪 Audit Logs</h3>
            <div className="card-badge">{auditTotal} Total</div>
            <div className="ms-auto">
              <button className="btn-modern btn-secondary" onClick={() => loadAuditLogs()}>
                <span className="btn-icon">🔄</span>
                Refresh Logs
              </button>
              <button className="btn-modern btn-secondary" onClick={exportAuditCSV} style={{ marginLeft: 8 }}>
                <span className="btn-icon">📤</span>
                Export CSV
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="d-flex align-items-center" style={{ marginBottom: '0.75rem' }}>
              <span style={{ marginRight: 12 }}>Page {auditPage} / {auditTotalPages}</span>
              <div style={{ marginLeft: 'auto' }}>
                <select className="modern-select" value={auditPageSize} onChange={(e) => { const ps = parseInt(e.target.value,10); setAuditPageSize(ps); loadAuditLogs({ page: 1, pageSize: ps }); }}>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
                <button className="btn-modern btn-secondary" disabled={auditPage <= 1} onClick={() => loadAuditLogs({ page: auditPage - 1 })} style={{ marginLeft: 8 }}>Prev</button>
                <button className="btn-modern btn-secondary" disabled={auditPage >= auditTotalPages} onClick={() => loadAuditLogs({ page: auditPage + 1 })} style={{ marginLeft: 8 }}>Next</button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Target</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
          {auditLogs.map(log => (
                    <tr key={log._id}>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.action}</td>
            <td>{log.actor || log.actorEmail || log.actorId || 'N/A'}</td>
            <td>{log.target || log.targetEmail || log.targetId || 'N/A'}</td>
            <td><code>{JSON.stringify(log.details || {})}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

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
