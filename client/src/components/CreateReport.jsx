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
    status: 'draft',
    laborBreakdownTitle: 'Labor Breakdown',
    laborBreakdown: [
      { position: '', quantity: '', hours: '' }
    ],
    equipmentBreakdownTitle: 'Equipment Breakdown',
    equipmentBreakdown: [
      { equipment: '', quantity: '', hours: '' }
    ]
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

  const handleLaborChange = (index, field, value) => {
    const updatedLaborBreakdown = [...formData.laborBreakdown];
    updatedLaborBreakdown[index][field] = value;
    setFormData({
      ...formData,
      laborBreakdown: updatedLaborBreakdown
    });
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
    const updatedEquipmentBreakdown = [...formData.equipmentBreakdown];
    updatedEquipmentBreakdown[index][field] = value;
    setFormData({
      ...formData,
      equipmentBreakdown: updatedEquipmentBreakdown
    });
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
        status: formData.status,
        laborBreakdownTitle: formData.laborBreakdownTitle,
        laborBreakdown: formData.laborBreakdown,
        equipmentBreakdownTitle: formData.equipmentBreakdownTitle,
        equipmentBreakdown: formData.equipmentBreakdown
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

  const handleSaveDraft = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const draftData = {
        title: formData.title || 'Untitled Draft',
        content: formData.description,
        author: `${user.firstName} ${user.lastName}`,
        jobname: formData.title || 'Untitled Draft',
        jobid: `DRAFT-${Date.now()}`,
        projectId: formData.projectId,
        inspectorId: user.id || user._id,
        inspectionType: formData.inspectionType,
        findings: formData.findings,
        recommendations: formData.recommendations,
        status: 'draft', // Always save as draft
        laborBreakdownTitle: formData.laborBreakdownTitle,
        laborBreakdown: formData.laborBreakdown,
        equipmentBreakdownTitle: formData.equipmentBreakdownTitle,
        equipmentBreakdown: formData.equipmentBreakdown,
        isDraft: true // Flag to indicate this is a draft save
      };

      console.log('Saving draft:', draftData);
      
      const response = await axios.post('/reports/draft', draftData);
      console.log('Draft save response:', response.data);
      
      if (response.data.success) {
        setSuccess('Draft saved successfully! You can continue working on it later.');
        // Optionally redirect to reports list after a delay
        setTimeout(() => {
          navigate('/reports');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setError(error.response?.data?.error || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const inspectionTypes = [
    { value: 'mot', label: 'MOT Inspection' },
    { value: 'dwr', label: 'DWR' },
    { value: 'DUR', label: 'DUR' },
 
  ];

  return (
    <div className="page-layout">
      <div className="page-background"></div>
      <div className="page-content fade-in-up">
        {/* Page Header */}
        <div className="page-header-section">
          <h1 className="page-title">📝 Create Report</h1>
          <p className="page-description">
            Submit a new report with automatic PDF generation
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

          {/* Labor Breakdown Section */}
          <div className="modern-form-group" style={{ marginTop: '30px' }}>
            <label className="modern-label">👷 Labor Breakdown</label>
            
            {/* Labor Breakdown Title Input */}
            <div className="modern-form-group" style={{ marginBottom: '20px' }}>
              <label className="modern-label">Section Title</label>
              <input
                type="text"
                name="laborBreakdownTitle"
                className="modern-input"
                value={formData.laborBreakdownTitle}
                onChange={handleInputChange}
                placeholder="Enter title for this section (e.g., Labor Breakdown, Workforce Summary)"
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
          <div className="modern-form-group" style={{ marginTop: '30px' }}>
            <label className="modern-label">🚜 Equipment Breakdown</label>
            
            {/* Equipment Breakdown Title Input */}
            <div className="modern-form-group" style={{ marginBottom: '20px' }}>
              <label className="modern-label">Section Title</label>
              <input
                type="text"
                name="equipmentBreakdownTitle"
                className="modern-input"
                value={formData.equipmentBreakdownTitle}
                onChange={handleInputChange}
                placeholder="Enter title for this section (e.g., Equipment Breakdown, Machinery Hours)"
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
              type="button"
              onClick={handleSaveDraft}
              className="btn btn-outline"
              disabled={loading || !formData.title}
              style={{
                background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)',
                color: '#2d3436',
                border: 'none',
                fontWeight: '600'
              }}
            >
              {loading ? '⏳ Saving...' : '💾 Save Draft'}
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
