import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = () => {
    return ['admin', 'project_manager', 'supervisor'].includes(user?.role);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          🏗️ Construction Management
        </Link>
        
        <ul className="navbar-nav">
          <li>
            <Link to="/dashboard" className="nav-link">
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link to="/projects" className="nav-link">
              🏢 Projects
            </Link>
          </li>
          <li>
            <Link to="/reports" className="nav-link">
              📋 Reports
            </Link>
          </li>
          {isAdmin() && (
            <li>
              <Link to="/admin" className="nav-link">
                ⚙️ Admin
              </Link>
            </li>
          )}
          <li>
            <span className="nav-link">
              👤 {user?.firstName} {user?.lastName} ({user?.role})
            </span>
          </li>
          <li>
            <button 
              onClick={handleLogout}
              className="nav-link"
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '5px',
                transition: 'background 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.target.style.background = 'none'}
            >
              🚪 Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
