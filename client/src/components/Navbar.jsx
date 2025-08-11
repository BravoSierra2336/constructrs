import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
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
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="mb-0">
      <Container fluid>
        <BootstrapNavbar.Brand as={Link} to="/dashboard">
          🏗️ Construction Management
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              📊 Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/projects">
              🏢 Projects
            </Nav.Link>
            <Nav.Link as={Link} to="/reports">
              📋 Reports
            </Nav.Link>
            {isAdmin() && (
              <Nav.Link as={Link} to="/admin">
                ⚙️ Admin
              </Nav.Link>
            )}
          </Nav>
          
          <Nav>
            <NavDropdown 
              title={`👤 ${user?.firstName} ${user?.lastName}`} 
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Item disabled>
                <small className="text-muted">Role: {user?.role}</small>
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                🚪 Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
