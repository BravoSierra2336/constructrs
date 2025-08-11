import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, fetchProfilePhoto } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  // Fetch profile photo when component mounts or user changes
  useEffect(() => {
    const loadProfilePhoto = async () => {
      console.log('Loading profile photo for user:', user);
      if (user && user.authProvider === 'microsoft') {
        console.log('User is Microsoft OAuth user, fetching photo...');
        const photoUrl = await fetchProfilePhoto();
        console.log('Received photo URL:', photoUrl);
        setProfilePhotoUrl(photoUrl);
      } else {
        console.log('User is not Microsoft OAuth user or no user found');
      }
    };

    loadProfilePhoto();
  }, [user, fetchProfilePhoto]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsUserMenuOpen(false);
  };

  const isAdmin = () => {
    return ['admin', 'project_manager', 'supervisor'].includes(user?.role);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="modern-navbar">
      <div className="navbar-background"></div>
      <div className="navbar-container">
        {/* Brand/Logo */}
        <Link to="/dashboard" className="navbar-brand" onClick={closeMenus}>
          <div className="brand-icon">🏗️</div>
          <div className="brand-text">
            <span className="brand-title">ConstructRS</span>
            <span className="brand-subtitle">Management System</span>
          </div>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <div className={`navbar-nav ${isMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActiveRoute('/dashboard') ? 'active' : ''}`}
            onClick={closeMenus}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </Link>
          
          <Link 
            to="/projects" 
            className={`nav-link ${isActiveRoute('/projects') ? 'active' : ''}`}
            onClick={closeMenus}
          >
            <span className="nav-icon">🏢</span>
            <span className="nav-text">Projects</span>
          </Link>
          
          <Link 
            to="/reports" 
            className={`nav-link ${isActiveRoute('/reports') ? 'active' : ''}`}
            onClick={closeMenus}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Reports</span>
          </Link>
          
          {isAdmin() && (
            <Link 
              to="/admin" 
              className={`nav-link admin-link ${isActiveRoute('/admin') ? 'active' : ''}`}
              onClick={closeMenus}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Admin</span>
            </Link>
          )}
        </div>

        {/* User Menu */}
        <div className="user-menu-container">
          <button 
            className={`user-menu-button ${isUserMenuOpen ? 'active' : ''}`}
            onClick={toggleUserMenu}
            aria-label="User menu"
          >
            <div className="user-avatar">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Profile" className="avatar-icon" />
              ) : (
                <span className="avatar-icon">👤</span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <div className="dropdown-arrow">
              <span>▼</span>
            </div>
          </button>

          {/* User Dropdown Menu */}
          <div className={`user-dropdown ${isUserMenuOpen ? 'active' : ''}`}>
            <div className="dropdown-header">
              <div className="user-avatar-large">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Profile" className="avatar-icon-large" />
                ) : (
                  <span className="avatar-icon-large">👤</span>
                )}
              </div>
              <div className="user-details">
                <div className="user-name-large">{user?.firstName} {user?.lastName}</div>
                <div className="user-email">{user?.email}</div>
                <div className="user-role-badge">
                  <span className="role-icon">🏷️</span>
                  {user?.role}
                </div>
              </div>
            </div>
            
            <div className="dropdown-divider"></div>
            
            <div className="dropdown-actions">
              <button className="dropdown-item profile-item">
                <span className="item-icon">👤</span>
                <span className="item-text">Profile Settings</span>
              </button>
              
              <button className="dropdown-item preferences-item">
                <span className="item-icon">⚙️</span>
                <span className="item-text">Preferences</span>
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item logout-item" onClick={handleLogout}>
                <span className="item-icon">🚪</span>
                <span className="item-text">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {(isMenuOpen || isUserMenuOpen) && (
        <div className="mobile-overlay" onClick={closeMenus}></div>
      )}
    </nav>
  );
};

export default Navbar;
