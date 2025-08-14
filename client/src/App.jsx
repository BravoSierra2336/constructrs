import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Projects from './components/ProjectsClean.jsx';
import ModalTest from './components/ModalTest.jsx';
import Reports from './components/Reports.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import CreateReport from './components/CreateReport.jsx';
import EditReport from './components/EditReport.jsx';
import Chat from './components/Chat.jsx';
import EmergencyReset from './components/EmergencyReset.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import './App.css';
// Import page layout system
import './styles/PageLayout.css';
// Import modern inputs last to ensure highest specificity
import './styles/ModernInputs.css';

// Protected Route component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <div className="error">Access denied. Insufficient permissions.</div>;
  }
  
  return children;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const allowedRoles = ['admin', 'project_manager', 'supervisor'];
  if (!allowedRoles.includes(user.role)) {
    return <div className="error">Access denied. Admin privileges required.</div>;
  }
  
  return children;
};

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [redirectCount, setRedirectCount] = useState(0);
  
  // Circuit breaker to prevent infinite redirects
  useEffect(() => {
    if (redirectCount > 5) {
      console.error('Too many redirects detected - clearing localStorage and reloading');
      localStorage.clear();
      window.location.reload();
    }
  }, [redirectCount]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading... (Auth check in progress)
      </div>
    );
  }

  return (
    <div className="App">
      {/* Always show emergency reset button */}
      <EmergencyReset />
      
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports/create" 
          element={
            <ProtectedRoute>
              <CreateReport />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports/edit/:id" 
          element={
            <ProtectedRoute>
              <EditReport />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
      
      {/* Chat Component - only show when authenticated */}
      {isAuthenticated && (
        <>
          <Chat isOpen={isChatOpen} onToggle={toggleChat} />
          
          {/* Chat Toggle Button */}
          <button
            className={`chat-toggle-btn ${isChatOpen ? 'active' : ''}`}
            onClick={toggleChat}
            aria-label="Toggle AI Chat"
          >
            <i className={isChatOpen ? 'fas fa-times' : 'fas fa-comments'}></i>
          </button>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;