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
    contractDay: '',
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
    ],
    weather: {
      current: null,
      forecast24h: null,
      location: '',
      lastUpdated: null
    }
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Get API URL properly
      const getApiUrl = () => {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5050';
          }
        }
        return window.location.origin.replace(':5173', ':5050').replace(':3000', ':5050');
      };

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const response = await axios.get(`${getApiUrl()}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to load projects');
      }
    }
  };

  const calculateContractDay = (projectId) => {
    const selectedProject = projects.find(project => project._id === projectId);
    if (selectedProject && selectedProject.startDate) {
      const startDate = new Date(selectedProject.startDate);
      const currentDate = new Date();
      const timeDiff = currentDate - startDate;
      const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return Math.max(0, dayDiff); // Ensure non-negative value
    }
    return '';
  };

  // Weather functions
  const fetchWeatherData = async (location) => {
    if (!location || location.trim() === '') {
      setWeatherError('Please provide a location for weather data');
      return;
    }

    setWeatherLoading(true);
    setWeatherError('');

    try {
      // Get API URL and token
      const getApiUrl = () => {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5050';
          }
        }
        return window.location.origin.replace(':5173', ':5050').replace(':3000', ':5050');
      };

      const token = localStorage.getItem('token');
      if (!token) {
        setWeatherError('Authentication required. Please log in.');
        return;
      }

      const encodedLocation = encodeURIComponent(location.trim());
      const response = await axios.get(`${getApiUrl()}/weather/complete/${encodedLocation}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          weather: {
            current: response.data.data.current,
            forecast24h: response.data.data.forecast24h,
            location: location,
            lastUpdated: new Date().toISOString()
          }
        }));
        setWeatherError('');
      } else {
        setWeatherError('Failed to fetch weather data');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherError(error.response?.data?.error || 'Failed to fetch weather data');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleLocationChange = (e) => {
    const location = e.target.value;
    setFormData(prev => ({
      ...prev,
      weather: {
        ...prev.weather,
        location: location
      }
    }));
  };

  const handleFetchWeather = () => {
    if (formData.weather.location) {
      fetchWeatherData(formData.weather.location);
    }
  };

  // Auto-fetch weather when project location is available
  const autoFetchWeatherFromProject = (projectId) => {
    const selectedProject = projects.find(project => project._id === projectId);
    if (selectedProject && selectedProject.location) {
      setFormData(prev => ({
        ...prev,
        weather: {
          ...prev.weather,
          location: selectedProject.location
        }
      }));
      // Auto-fetch weather after setting location
      setTimeout(() => {
        fetchWeatherData(selectedProject.location);
      }, 100);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'projectId') {
      const contractDay = calculateContractDay(value);
      setFormData({
        ...formData,
        [name]: value,
        contractDay: contractDay
      });
      // Auto-fetch weather data for selected project
      autoFetchWeatherFromProject(value);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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
        contractDay: formData.contractDay,
        findings: formData.findings,
        recommendations: formData.recommendations,
        status: formData.status,
        laborBreakdownTitle: formData.laborBreakdownTitle,
        laborBreakdown: formData.laborBreakdown,
        equipmentBreakdownTitle: formData.equipmentBreakdownTitle,
        equipmentBreakdown: formData.equipmentBreakdown,
        weather: formData.weather
      };

      console.log('Sending report data:', reportData);
      
      // Get API URL and token
      const getApiUrl = () => {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5050';
          }
        }
        return window.location.origin.replace(':5173', ':5050').replace(':3000', ':5050');
      };

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const response = await axios.post(`${getApiUrl()}/reports`, reportData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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
        contractDay: formData.contractDay,
        findings: formData.findings,
        recommendations: formData.recommendations,
        status: 'draft', // Always save as draft
        laborBreakdownTitle: formData.laborBreakdownTitle,
        laborBreakdown: formData.laborBreakdown,
        equipmentBreakdownTitle: formData.equipmentBreakdownTitle,
        equipmentBreakdown: formData.equipmentBreakdown,
        weather: formData.weather,
        isDraft: true // Flag to indicate this is a draft save
      };

      console.log('Saving draft:', draftData);
      
      // Get API URL and token
      const getApiUrl = () => {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5050';
          }
        }
        return window.location.origin.replace(':5173', ':5050').replace(':3000', ':5050');
      };

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const response = await axios.post(`${getApiUrl()}/reports/draft`, draftData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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
          {/* Basic Information Section */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
              📋 Basic Information
            </h3>
            
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
              <label className="modern-label">Contract Day</label>
              <input
                type="number"
                name="contractDay"
                className="modern-input"
                value={formData.contractDay}
                readOnly
                placeholder="Auto-calculated when project is selected"
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
              <small className="form-helper-text">
                Days since project start date (auto-calculated)
              </small>
            </div>
          </div>

          <div className="modern-form-row">
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
          </div>

          {/* Weather Information Section */}
          <div className="modern-form-group" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
              🌤️ Weather Information (24-Hour Forecast)
            </h3>
            
            <div className="modern-form-row">
              <div className="modern-form-group" style={{ flex: '2' }}>
                <label className="modern-label">Location</label>
                <input
                  type="text"
                  name="weatherLocation"
                  className="modern-input"
                  value={formData.weather.location}
                  onChange={handleLocationChange}
                  placeholder="Enter city name or coordinates (e.g., 'New York, NY' or '40.7128,-74.0060')"
                />
                <small className="form-helper-text">
                  Location for weather forecast (auto-populated from project location)
                </small>
              </div>
              
              <div className="modern-form-group">
                <label className="modern-label" style={{ visibility: 'hidden' }}>Action</label>
                <button
                  type="button"
                  onClick={handleFetchWeather}
                  disabled={weatherLoading || !formData.weather.location}
                  className="modern-button"
                  style={{
                    backgroundColor: weatherLoading ? '#95a5a6' : '#3498db',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: weatherLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {weatherLoading ? 'Loading...' : 'Get Weather'}
                </button>
              </div>
            </div>

            {weatherError && (
              <div style={{ color: '#e74c3c', fontSize: '14px', marginTop: '10px', padding: '10px', backgroundColor: '#fdf2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
                ⚠️ {weatherError}
              </div>
            )}

            {formData.weather.current && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>Current Conditions</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                      {formData.weather.current.temperature}°F
                    </div>
                    <div style={{ fontSize: '14px', color: '#7f8c8d', textTransform: 'capitalize' }}>
                      {formData.weather.current.description}
                    </div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3498db' }}>
                      {formData.weather.current.humidity}%
                    </div>
                    <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Humidity</div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60' }}>
                      {formData.weather.current.windSpeed} mph
                    </div>
                    <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Wind Speed</div>
                  </div>
                </div>
              </div>
            )}

            {formData.weather.forecast24h && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>24-Hour Forecast Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Temperature Range</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e67e22' }}>
                      {formData.weather.forecast24h.summary.minTemp}° - {formData.weather.forecast24h.summary.maxTemp}°F
                    </div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Rain Probability</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3498db' }}>
                      {Math.round(formData.weather.forecast24h.summary.maxPrecipitationProb)}%
                    </div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Expected Rain</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#9b59b6' }}>
                      {formData.weather.forecast24h.summary.totalPrecipitation > 0 
                        ? `${formData.weather.forecast24h.summary.totalPrecipitation.toFixed(2)} mm`
                        : 'None'
                      }
                    </div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Avg Humidity</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#16a085' }}>
                      {formData.weather.forecast24h.summary.avgHumidity}%
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '10px' }}>
                  Last updated: {formData.weather.lastUpdated ? new Date(formData.weather.lastUpdated).toLocaleString() : 'Never'}
                </div>
              </div>
            )}
          </div>

          {/* Labor Breakdown Section */}
          <div className="modern-form-group" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #27ae60', paddingBottom: '10px' }}>
              👷 Labor Breakdown
            </h3>
            
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
          <div className="modern-form-group" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #f39c12', paddingBottom: '10px' }}>
              🚜 Equipment Breakdown
            </h3>
            
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

          {/* Inspection Details Section */}
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #e74c3c', paddingBottom: '10px' }}>
              🔍 Inspection Details
            </h3>
            
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
