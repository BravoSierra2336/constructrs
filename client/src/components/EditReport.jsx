import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles/ModernInputs.css';
import '../styles/PageLayout.css';

const EditReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    jobname: '',
    jobid: '',
    projectId: '',
    inspectorId: '',
    inspectionType: 'safety',
    findings: '',
    recommendations: '',
    status: 'pending',
    laborBreakdownTitle: 'Labor Breakdown',
    laborBreakdown: [{ position: '', quantity: '', hours: '' }],
    equipmentBreakdownTitle: 'Equipment Breakdown',
    equipmentBreakdown: [{ equipment: '', quantity: '', hours: '' }]
  });

  const [projects, setProjects] = useState([]);

  // Load report data and projects
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load projects
  const projectsResponse = await api.get('/projects');
        setProjects(projectsResponse.data.projects || []);

        // Load existing report
  const reportResponse = await api.get(`/reports/${id}`);
        
        const report = reportResponse.data;
        
        // Check if user can edit this report
        const isReportAuthor = report.inspectorId && report.inspectorId === user?.id;
        const isProjectManagerOrHigher = ['admin', 'project_manager'].includes(user?.role);
        
        if (!isReportAuthor && !isProjectManagerOrHigher) {
          setError('You do not have permission to edit this report');
          return;
        }

        // Populate form with existing data
        setFormData({
          title: report.title || '',
          content: report.content || '',
          author: report.author || '',
          jobname: report.jobname || '',
          jobid: report.jobid || '',
          projectId: report.projectId || '',
          inspectorId: report.inspectorId || '',
          inspectionType: report.inspectionType || 'safety',
          findings: report.findings || '',
          recommendations: report.recommendations || '',
          status: report.status || 'pending',
          laborBreakdownTitle: report.laborBreakdownTitle || 'Labor Breakdown',
          laborBreakdown: report.laborBreakdown && report.laborBreakdown.length > 0 
            ? report.laborBreakdown 
            : [{ position: '', quantity: '', hours: '' }],
          equipmentBreakdownTitle: report.equipmentBreakdownTitle || 'Equipment Breakdown',
          equipmentBreakdown: report.equipmentBreakdown && report.equipmentBreakdown.length > 0 
            ? report.equipmentBreakdown 
            : [{ equipment: '', quantity: '', hours: '' }]
        });

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleLaborChange = (index, field, value) => {
    const newLaborBreakdown = [...formData.laborBreakdown];
    newLaborBreakdown[index][field] = value;
    setFormData(prev => ({
      ...prev,
      laborBreakdown: newLaborBreakdown
    }));
  };

  const addLaborRow = () => {
    setFormData(prev => ({
      ...prev,
      laborBreakdown: [...prev.laborBreakdown, { position: '', quantity: '', hours: '' }]
    }));
  };

  const removeLaborRow = (index) => {
    if (formData.laborBreakdown.length > 1) {
      const newLaborBreakdown = formData.laborBreakdown.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        laborBreakdown: newLaborBreakdown
      }));
    }
  };

  const handleEquipmentChange = (index, field, value) => {
    const newEquipmentBreakdown = [...formData.equipmentBreakdown];
    newEquipmentBreakdown[index][field] = value;
    setFormData(prev => ({
      ...prev,
      equipmentBreakdown: newEquipmentBreakdown
    }));
  };

  const addEquipmentRow = () => {
    setFormData(prev => ({
      ...prev,
      equipmentBreakdown: [...prev.equipmentBreakdown, { equipment: '', quantity: '', hours: '' }]
    }));
  };

  const removeEquipmentRow = (index) => {
    if (formData.equipmentBreakdown.length > 1) {
      const newEquipmentBreakdown = formData.equipmentBreakdown.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        equipmentBreakdown: newEquipmentBreakdown
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
  const response = await api.put(`/reports/${id}`, formData);

      setSuccessMessage('Report updated successfully! A new PDF has been generated.');
      setTimeout(() => {
        navigate('/reports');
      }, 2000);

    } catch (err) {
      console.error('Error updating report:', err);
      setError(err.response?.data?.error || 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-layout">
        <div className="page-content">
          <div className="page-loading fade-in-up">
            <div className="modern-spinner"></div>
            <p>Loading report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="page-layout">
        <div className="page-content">
          <div className="page-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <div className="page-background"></div>
      <div className="page-content fade-in-up">
        
        {/* Page Header */}
        <div className="page-header-section">
          <h1 className="page-title">✏️ Edit Report</h1>
          <p className="page-description">
            Update inspection report details. A new PDF will be generated upon saving.
          </p>
        </div>

        {error && <div className="page-error">{error}</div>}
        {successMessage && <div className="page-success">{successMessage}</div>}

        {/* Main Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="modern-form">
            
            {/* Report Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">Report Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="modern-input"
                required
                placeholder="Enter report title"
              />
            </div>

            {/* Project and Inspection Type Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="projectId" className="form-label">Project</label>
                <select
                  id="projectId"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  className="modern-select"
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="inspectionType" className="form-label">Inspection Type</label>
                <select
                  id="inspectionType"
                  name="inspectionType"
                  value={formData.inspectionType}
                  onChange={handleChange}
                  className="modern-select"
                  required
                >
                  <option value="safety">Safety Inspection</option>
                  <option value="quality">Quality Control</option>
                  <option value="structural">Structural Inspection</option>
                  <option value="compliance">Compliance Check</option>
                  <option value="progress">Progress Review</option>
                </select>
              </div>
            </div>

            {/* Labor Breakdown Section */}
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="laborBreakdownTitle" className="form-label">Labor Section Title</label>
                <input
                  type="text"
                  id="laborBreakdownTitle"
                  name="laborBreakdownTitle"
                  value={formData.laborBreakdownTitle}
                  onChange={handleChange}
                  className="modern-input"
                  placeholder="e.g., Labor Breakdown, Staff Assignment"
                />
              </div>

              <div className="labor-breakdown-table">
                <div className="table-header">
                  <div className="header-cell">Position</div>
                  <div className="header-cell">Quantity</div>
                  <div className="header-cell">Hours</div>
                  <div className="header-cell">Actions</div>
                </div>

                {formData.laborBreakdown.map((row, index) => (
                  <div key={index} className="table-row">
                    <div className="table-cell">
                      <input
                        type="text"
                        value={row.position}
                        onChange={(e) => handleLaborChange(index, 'position', e.target.value)}
                        className="modern-input"
                        placeholder="e.g., Superintendent, Foreman"
                      />
                    </div>
                    <div className="table-cell">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleLaborChange(index, 'quantity', e.target.value)}
                        className="modern-input"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="table-cell">
                      <input
                        type="number"
                        value={row.hours}
                        onChange={(e) => handleLaborChange(index, 'hours', e.target.value)}
                        className="modern-input"
                        placeholder="0"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div className="table-cell">
                      <button
                        type="button"
                        onClick={() => removeLaborRow(index)}
                        className="btn btn-danger btn-small"
                        disabled={formData.laborBreakdown.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLaborRow}
                  className="btn btn-secondary add-row-btn"
                >
                  + Add Labor Row
                </button>
              </div>
            </div>

            {/* Equipment Breakdown Section */}
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="equipmentBreakdownTitle" className="form-label">Equipment Section Title</label>
                <input
                  type="text"
                  id="equipmentBreakdownTitle"
                  name="equipmentBreakdownTitle"
                  value={formData.equipmentBreakdownTitle}
                  onChange={handleChange}
                  className="modern-input"
                  placeholder="e.g., Equipment Breakdown, Machinery Usage"
                />
              </div>

              <div className="labor-breakdown-table">
                <div className="table-header">
                  <div className="header-cell">Equipment</div>
                  <div className="header-cell">Quantity</div>
                  <div className="header-cell">Hours</div>
                  <div className="header-cell">Actions</div>
                </div>

                {formData.equipmentBreakdown.map((row, index) => (
                  <div key={index} className="table-row">
                    <div className="table-cell">
                      <input
                        type="text"
                        value={row.equipment}
                        onChange={(e) => handleEquipmentChange(index, 'equipment', e.target.value)}
                        className="modern-input"
                        placeholder="e.g., Excavator, Concrete Mixer"
                      />
                    </div>
                    <div className="table-cell">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleEquipmentChange(index, 'quantity', e.target.value)}
                        className="modern-input"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="table-cell">
                      <input
                        type="number"
                        value={row.hours}
                        onChange={(e) => handleEquipmentChange(index, 'hours', e.target.value)}
                        className="modern-input"
                        placeholder="0"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div className="table-cell">
                      <button
                        type="button"
                        onClick={() => removeEquipmentRow(index)}
                        className="btn btn-danger btn-small"
                        disabled={formData.equipmentBreakdown.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addEquipmentRow}
                  className="btn btn-secondary add-row-btn"
                >
                  + Add Equipment Row
                </button>
              </div>
            </div>

            {/* Content/Description */}
            <div className="form-group">
              <label htmlFor="content" className="form-label">Description</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="modern-textarea"
                rows="4"
                placeholder="Describe the inspection or work performed..."
              />
            </div>

            {/* Findings */}
            <div className="form-group">
              <label htmlFor="findings" className="form-label">Findings</label>
              <textarea
                id="findings"
                name="findings"
                value={formData.findings}
                onChange={handleChange}
                className="modern-textarea"
                rows="4"
                placeholder="Document key findings, observations, or issues..."
              />
            </div>

            {/* Recommendations */}
            <div className="form-group">
              <label htmlFor="recommendations" className="form-label">Recommendations</label>
              <textarea
                id="recommendations"
                name="recommendations"
                value={formData.recommendations}
                onChange={handleChange}
                className="modern-textarea"
                rows="4"
                placeholder="Provide recommendations for improvements or next steps..."
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">Report Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="modern-select"
                required
              >
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Needs Revision</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/reports')}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="spinner"></div>
                    Updating Report...
                  </>
                ) : (
                  'Update Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditReport;
