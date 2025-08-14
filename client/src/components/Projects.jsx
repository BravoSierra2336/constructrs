import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../utils/api.js';

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Simple modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: '',
    startDate: ''
  });

  console.log('Projects component rendered with modal state:', isModalOpen);

  // Add useEffect to monitor modal state changes
  useEffect(() => {
    console.log('Modal state changed via useEffect:', showCreateModal);
    // Force component re-mount when modal state changes
    setRenderKey(Date.now());
  }, [showCreateModal]);

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
    
    // Validate form data
    if (!newProject.name.trim() || !newProject.description.trim() || !newProject.location.trim() || !newProject.startDate) {
      setError('Please fill in all fields');
      return;
    }

    try {
      console.log('Creating project with data:', newProject);
      const response = await api.post('/projects', newProject);
      console.log('Create project response:', response.data);
      
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
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to create project');
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
    console.log('Checking canManageProjects:', {
      user: user,
      role: user?.role,
      canManage: ['admin', 'project_manager', 'supervisor'].includes(user?.role)
    });
    return ['admin', 'project_manager', 'supervisor'].includes(user?.role);
  };

  // Enhanced modal state handler
  const openCreateModal = () => {
    console.log('openCreateModal called - BEFORE state change:', showCreateModal);
    setShowCreateModal(true);
    setForceUpdate(prev => prev + 1);
    console.log('openCreateModal called - AFTER state change triggered');
  };

  const closeCreateModal = () => {
    console.log('closeCreateModal called - BEFORE state change:', showCreateModal);
    setShowCreateModal(false);
    setForceUpdate(prev => prev + 1);
    console.log('closeCreateModal called - AFTER state change triggered');
  };

  const handleViewReports = (project) => {
    // Navigate to reports page with project filter
    navigate(`/reports?project=${encodeURIComponent(project.name)}`);
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
    <div className="page-layout" key={renderKey}>
      <SimpleTest />
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
                onClick={() => {
                  console.log('Create project button clicked - using enhanced handler');
                  openCreateModal();
                }}
                className="modern-btn modern-btn-primary"
              >
                <i className="fas fa-plus me-2"></i>
                Create Project
              </button>
            )}
            {/* Debug button - always visible */}
            <button
              onClick={() => {
                console.log('Debug button clicked - BEFORE state change');
                console.log('Current showCreateModal:', showCreateModal);
                console.log('User:', user);
                console.log('Can manage projects:', canManageProjects());
                
                // Force state update with callback
                setShowCreateModal(prev => {
                  console.log('State updater called - prev:', prev, 'new:', true);
                  return true;
                });
                
                // Also try direct update
                console.log('Setting state to true directly');
                setShowCreateModal(true);
                
                console.log('Debug button clicked - AFTER state change');
              }}
              className="modern-btn modern-btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              Debug Create
            </button>
            <button
              onClick={() => {
                alert('Simple test button works!');
              }}
              className="modern-btn modern-btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              Test Alert
            </button>
            <button
              onClick={() => {
                console.log('Force update button clicked');
                setForceUpdate(prev => prev + 1);
                setShowCreateModal(true);
              }}
              className="modern-btn modern-btn-secondary"
              style={{ marginLeft: '10px', background: 'orange' }}
            >
              Force Modal
            </button>
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
                <button 
                  className="modern-btn modern-btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => handleViewReports(project)}
                >
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

      {/* Simple test modal - should always be visible when showCreateModal is true */}
      {showCreateModal && (
        <>
          {/* Test element that should always show */}
          <div style={{
            position: 'fixed',
            top: '50px',
            left: '50px',
            width: '200px',
            height: '100px',
            backgroundColor: 'red',
            color: 'white',
            zIndex: '999999',
            padding: '20px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            MODAL IS OPEN!<br/>
            State: {String(showCreateModal)}
            <br/>
            <button onClick={closeCreateModal} style={{marginTop: '10px'}}>
              Close
            </button>
          </div>
          
          {/* Main modal */}
          <div 
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(255,0,0,0.8)',
              zIndex: '999998',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeCreateModal();
              }
            }}
          >
            <div 
              style={{
                backgroundColor: 'yellow',
                padding: '50px',
                borderRadius: '10px',
                minWidth: '400px',
                border: '5px solid blue',
                fontSize: '20px',
                textAlign: 'center'
              }}
            >
              <h1 style={{ color: 'black', margin: '0 0 20px 0' }}>MODAL TEST</h1>
              <p style={{ color: 'black' }}>If you can see this, the modal is working!</p>
              <button 
                onClick={closeCreateModal}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                CLOSE MODAL
              </button>
            </div>
          </div>
        </>
      )}

      {/* Debug: Always show current modal state */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px',
        backgroundColor: showCreateModal ? 'green' : 'gray',
        color: 'white',
        zIndex: '999997',
        border: '2px solid black'
      }}>
        Modal State: {showCreateModal ? 'OPEN' : 'CLOSED'}
        <br />
        Force Update: {forceUpdate}
        <br />
        <button 
          onClick={() => {
            console.log('Toggle button clicked - Current state:', showCreateModal);
            if (showCreateModal) {
              closeCreateModal();
            } else {
              openCreateModal();
            }
          }}
          style={{ marginTop: '5px', fontSize: '12px' }}
        >
          Toggle Modal
        </button>
      </div>

      {/* Always show test element to verify rendering works */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '10px',
        backgroundColor: 'blue',
        color: 'white',
        zIndex: '999996'
      }}>
        Component is rendering: {Date.now()}
      </div>
      </div>
    </div>
  );
};

export default Projects;
