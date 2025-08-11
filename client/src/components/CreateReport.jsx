import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const CreateReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    inspectionType: 'safety',
    findings: '',
    recommendations: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Map the form data to match server expectations
      console.log('User object:', user);
      console.log('Form data:', formData);
      
      const reportData = {
        title: formData.title,
        content: formData.description, // Map description to content
        author: `${user.firstName} ${user.lastName}`, // Use authenticated user info
        jobname: formData.title, // Use title as jobname for now
        jobid: `RPT-${Date.now()}`, // Generate a unique job ID
        projectId: formData.projectId,
        inspectorId: user.id || user._id, // Try both id and _id
        inspectionType: formData.inspectionType,
        findings: formData.findings,
        recommendations: formData.recommendations,
        status: formData.status
      };

      console.log('Sending report data:', reportData);
      
      const response = await axios.post('/reports', reportData);
      console.log('Server response:', response.data);
      if (response.data.success) {
        setSuccess('Report created successfully! PDF is being generated...');
        setTimeout(() => {
          navigate('/reports');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating report:', error);
      setError(error.response?.data?.error || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const inspectionTypes = [
    { value: 'safety', label: 'Safety Inspection' },
    { value: 'quality', label: 'Quality Control' },
    { value: 'progress', label: 'Progress Review' },
    { value: 'structural', label: 'Structural Inspection' },
    { value: 'electrical', label: 'Electrical Inspection' },
    { value: 'plumbing', label: 'Plumbing Inspection' },
    { value: 'environmental', label: 'Environmental Check' },
    { value: 'final', label: 'Final Inspection' }
  ];

  return (
    <div className="page-layout">
      <div className="page-background"></div>
      <div className="page-content fade-in-up">
        {/* Page Header */}
        <div className="page-header-section">
          <h1 className="page-title">📝 Create Inspection Report</h1>
          <p className="page-description">
            Submit a new construction inspection report with automatic PDF generation
          </p>
        </div>

        {error && <div className="page-error">{error}</div>}
        {success && <div className="page-card" style={{background: 'linear-gradient(135deg, #00b894, #00cec9)', color: 'white'}}>{success}</div>}

        <div className="page-card">
          <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="modern-form-group">
            <label className="modern-label required">Report Title</label>
            <input
              type="text"
              name="title"
              className="modern-input"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a descriptive title for this report"
              required
            />
          </div>

          <div className="modern-form-row">
            <div className="modern-form-group">
              <label className="modern-label required">Project</label>
              <select
                name="projectId"
                className="modern-select"
                value={formData.projectId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modern-form-group">
              <label className="modern-label required">Inspection Type</label>
              <select
                name="inspectionType"
                className="modern-select"
                value={formData.inspectionType}
                onChange={handleInputChange}
                required
              >
                {inspectionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modern-form-group">
            <label className="modern-label">Description</label>
            <textarea
              name="description"
              className="modern-textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide a brief description of the inspection scope and purpose"
              rows="3"
            />
          </div>

          {/* Inspection Details */}
          <div className="modern-form-group">
            <label className="modern-label required">Findings</label>
            <textarea
              name="findings"
              className="modern-textarea"
              value={formData.findings}
              onChange={handleInputChange}
              placeholder="Document your inspection findings, observations, and any issues discovered"
              rows="6"
              required
            />
          </div>

          <div className="modern-form-group">
            <label className="modern-label">Recommendations</label>
            <textarea
              name="recommendations"
              className="modern-textarea"
              value={formData.recommendations}
              onChange={handleInputChange}
              placeholder="Provide recommendations for addressing any issues or improving processes"
              rows="4"
            />
          </div>

          <div className="modern-form-group">
            <label className="modern-label">Status</label>
            <select
              name="status"
              className="modern-select"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.title || !formData.projectId || !formData.findings}
            >
              {loading ? '⏳ Creating Report...' : '📝 Create Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Information Section */}
      <div className="card" style={{ marginTop: '30px', background: '#f8f9fa' }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>📋 Report Information</h3>
        <ul style={{ color: '#666', lineHeight: '1.8', marginLeft: '20px' }}>
          <li>Reports are automatically assigned to you as the inspector</li>
          <li>A PDF will be generated automatically when you submit the report</li>
          <li>Project administrators can view and download all report PDFs</li>
          <li>Make sure to provide detailed findings for better record keeping</li>
          <li>You can edit draft reports before final submission</li>
        </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateReport;
