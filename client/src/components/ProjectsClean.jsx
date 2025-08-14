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

  const canManageProjects = () => {
    const hasPermission = ['admin', 'project_manager', 'supervisor'].includes(user?.role);
    console.log('canManageProjects check:', {
      user: user,
      role: user?.role,
      hasPermission: hasPermission
    });
    return hasPermission;
  };

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

  const handleCreateProject = async () => {
    try {
      console.log('Creating project with data:', newProject);
      
      const response = await api.post('/projects', newProject);
      console.log('Project created successfully:', response.data);
      
      // Reset form and close modal
      setNewProject({ name: '', description: '', location: '', startDate: '' });
      setIsModalOpen(false);
      
      // Refresh projects list
      fetchProjects();
      
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.response?.data?.error || 'Failed to create project');
    }
  };

  const openModal = () => {
    console.log('Opening modal...');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('Closing modal...');
    setIsModalOpen(false);
    setNewProject({ name: '', description: '', location: '', startDate: '' });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading projects...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', minHeight: '100vh', position: 'relative' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1>Projects</h1>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
      </div>

      {/* Create Project Button and Permission Info - Below Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        {canManageProjects() && (
          <button
            onClick={openModal}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Create Project
          </button>
        )}
        
        {!canManageProjects() && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            Role: {user?.role || 'undefined'} - No create permission
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {filteredProjects.map((project) => (
          <div
            key={project._id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0' }}>{project.name}</h3>
            <p style={{ color: '#666', marginBottom: '10px' }}>{project.description}</p>
            <p><strong>Location:</strong> {project.location}</p>
            <p><strong>Start Date:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {project.status}</p>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && !loading && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p>No projects found</p>
        </div>
      )}

      {/* SIMPLE MODAL - Always renders, uses display to show/hide */}
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: isModalOpen ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '999998'
        }}
        onClick={closeModal}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            minWidth: '400px',
            maxWidth: '500px',
            border: '3px solid #007bff'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>Create New Project</h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Project Name *
            </label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="Enter project name"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              rows="3"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
              placeholder="Enter project description"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Location
            </label>
            <input
              type="text"
              value={newProject.location}
              onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="Enter project location"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Start Date
            </label>
            <input
              type="date"
              value={newProject.startDate}
              onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={closeModal}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProject}
              disabled={!newProject.name}
              style={{
                padding: '10px 20px',
                backgroundColor: newProject.name ? '#007bff' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: newProject.name ? 'pointer' : 'not-allowed'
              }}
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
