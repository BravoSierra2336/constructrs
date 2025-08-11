import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: '',
    startDate: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    if (!searchTerm) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/projects', newProject);
      if (response.data.success) {
        setProjects([response.data.project, ...projects]);
        setShowCreateModal(false);
        setNewProject({
          name: '',
          description: '',
          location: '',
          startDate: ''
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project');
    }
  };

  const handleInputChange = (e) => {
    setNewProject({
      ...newProject,
      [e.target.name]: e.target.value
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      planning: { class: 'status-warning', text: 'Planning' },
      active: { class: 'status-success', text: 'Active' },
      completed: { class: 'status-success', text: 'Completed' },
      on_hold: { class: 'status-danger', text: 'On Hold' }
    };
    
    const config = statusConfig[status] || { class: 'status-warning', text: status };
    return (
      <span className={`status-badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const canManageProjects = () => {
    return ['admin', 'project_manager', 'supervisor'].includes(user?.role);
  };

  if (loading) {
    return (
      <div className="page-layout">
        <div className="page-content">
          <div className="page-loading fade-in-up">
            <div className="modern-spinner"></div>
            <p>Loading projects...</p>
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
          <h1 className="page-title">🏢 Construction Projects</h1>
          <p className="page-description">
            Manage and track construction projects across your organization
          </p>
        </div>

        {/* Search and Actions */}
        <div className="page-section">
          <div className="page-filters">
            <div className="page-search">
              <input
                type="text"
                placeholder="Search projects by name, description, or location..."
                className="modern-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {canManageProjects() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="modern-btn modern-btn-primary"
              >
                <i className="fas fa-plus me-2"></i>
                Create Project
              </button>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="page-section">
          {filteredProjects.length === 0 ? (
            <div className="page-empty">
              <div className="page-empty-icon">🏢</div>
              <h3>No Projects Found</h3>
              <p>
                {searchTerm ? 'Try adjusting your search terms.' : 'No projects have been created yet.'}
              </p>
              {canManageProjects() && !searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="modern-btn modern-btn-primary"
                >
                  <i className="fas fa-plus me-2"></i>
                  Create Your First Project
                </button>
              )}
            </div>
          ) : (
            <div className="page-grid page-grid-2">
              {filteredProjects.map(project => (
                <div key={project._id} className="page-card scale-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h3 style={{ color: '#333', margin: 0 }}>{project.name}</h3>
                {getStatusBadge(project.status)}
              </div>
              
              <p style={{ color: '#666', marginBottom: '15px' }}>
                {project.description}
              </p>
              
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#555' }}>📍 Location:</strong>
                <p style={{ margin: '5px 0', color: '#666' }}>{project.location}</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <strong style={{ color: '#555' }}>🗓️ Start Date:</strong>
                  <p style={{ margin: '5px 0', color: '#666' }}>{formatDate(project.startDate)}</p>
                </div>
                <div>
                  <strong style={{ color: '#555' }}>🏁 End Date:</strong>
                  <p style={{ margin: '5px 0', color: '#666' }}>{formatDate(project.endDate)}</p>
                </div>
              </div>
              
              {project.inspectors && project.inspectors.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#555' }}>👷 Inspectors:</strong>
                  <div style={{ marginTop: '5px' }}>
                    {project.inspectors.map((inspector, index) => (
                      <span 
                        key={index}
                        style={{
                          display: 'inline-block',
                          background: '#e9ecef',
                          color: '#495057',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          marginRight: '5px',
                          marginBottom: '5px'
                        }}
                      >
                        {inspector.firstName} {inspector.lastName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button className="modern-btn modern-btn-primary" style={{ flex: 1 }}>
                  <i className="fas fa-clipboard-list me-2"></i>
                  View Reports
                </button>
                {canManageProjects() && (
                  <button className="modern-btn modern-btn-secondary">
                    <i className="fas fa-edit me-2"></i>
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateProject}>
              <div className="modern-form-group">
                <label className="modern-label required">Project Name</label>
                <input
                  type="text"
                  name="name"
                  className="modern-input"
                  value={newProject.name}
                  onChange={handleInputChange}
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="modern-form-group">
                <label className="modern-label">Description</label>
                <textarea
                  name="description"
                  className="modern-textarea"
                  value={newProject.description}
                  onChange={handleInputChange}
                  placeholder="Describe the project scope and objectives"
                  rows="3"
                />
              </div>
              
              <div className="modern-form-group">
                <label className="modern-label required">Location</label>
                <input
                  type="text"
                  name="location"
                  className="modern-input"
                  value={newProject.location}
                  onChange={handleInputChange}
                  placeholder="Project location or address"
                  required
                />
              </div>
              
              <div className="modern-form-group">
                <label className="modern-label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  className="modern-input"
                  value={newProject.startDate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="modern-btn modern-btn-secondary"
                >
                  <i className="fas fa-times me-2"></i>
                  Cancel
                </button>
                <button type="submit" className="modern-btn modern-btn-primary">
                  <i className="fas fa-plus me-2"></i>
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Projects;
