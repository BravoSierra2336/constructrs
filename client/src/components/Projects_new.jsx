import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../utils/api.js';
import './Projects.css';

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      const response = await api.get('/projects');
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
    
    if (!newProject.name.trim() || !newProject.description.trim() || !newProject.location.trim() || !newProject.startDate) {
      setError('Please fill in all fields');
      return;
    }

    try {
      console.log('Creating project with data:', newProject);
      const response = await api.post('/projects', newProject);
      
      if (response.data.success) {
        setProjects([response.data.project, ...projects]);
        setShowCreateModal(false);
        setNewProject({
          name: '',
          description: '',
          location: '',
          startDate: ''
        });
        setError('');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to create project');
    }
  };

  const handleInputChange = (e) => {
    setNewProject({
      ...newProject,
      [e.target.name]: e.target.value
    });
  };

  const canManageProjects = () => {
    console.log('Checking canManageProjects:', {
      user: user,
      role: user?.role,
      canManage: ['admin', 'project_manager', 'supervisor'].includes(user?.role)
    });
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
        
        <div className="page-header-section">
          <h1 className="page-title">🏢 Construction Projects</h1>
          <p className="page-description">
            Manage and track construction projects across your organization
          </p>
        </div>

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
                onClick={() => {
                  console.log('Create project button clicked');
                  setShowCreateModal(true);
                }}
                className="modern-btn modern-btn-primary"
              >
                <i className="fas fa-plus me-2"></i>
                Create Project
              </button>
            )}
            <button
              onClick={() => {
                console.log('Debug button clicked - user:', user);
                console.log('Can manage projects:', canManageProjects());
                setShowCreateModal(true);
              }}
              className="modern-btn modern-btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              Debug Create
            </button>
          </div>
        </div>

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
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                  <p><strong>Location:</strong> {project.location}</p>
                  <p><strong>Start Date:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateProject}>
              {error && (
                <div style={{ 
                  background: '#fee', 
                  color: '#c33', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  marginBottom: '15px',
                  border: '1px solid #fcc'
                }}>
                  {error}
                </div>
              )}
              
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
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                  }}
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
  );
};

export default Projects;
