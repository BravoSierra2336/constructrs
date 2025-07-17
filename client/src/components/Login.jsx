import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginWithMicrosoft, register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { confirmPassword, ...userData } = registerData;
    const result = await register(userData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleMicrosoftLogin = () => {
    loginWithMicrosoft();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          🏗️ Construction Management
        </h1>
        
        {error && <div className="error">{error}</div>}
        
        {!isRegistering ? (
          <>
            {/* Login Form */}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginBottom: '15px' }}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <button 
              onClick={handleMicrosoftLogin}
              className="microsoft-login-btn"
              disabled={loading}
            >
              <span>🔐</span>
              Continue with Microsoft
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#666' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sign up here
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Registration Form */}
            <form onSubmit={handleRegister}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-input"
                    value={registerData.firstName}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-input"
                    value={registerData.lastName}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  name="role"
                  className="form-select"
                  value={registerData.role}
                  onChange={handleRegisterChange}
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="inspector">Inspector</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="project_manager">Project Manager</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-input"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-input"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginBottom: '15px' }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#666' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sign in here
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
