import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './Login.css';

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
    try {
      const result = await login(formData.email, formData.password);
      if (result?.success) {
        navigate('/dashboard');
      } else if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic client-side validation to avoid server 400s
    if ((registerData.firstName || '').trim().length < 2) {
      setError('First name must be at least 2 characters long');
      setLoading(false);
      return;
    }
    if ((registerData.lastName || '').trim().length < 2) {
      setError('Last name must be at least 2 characters long');
      setLoading(false);
      return;
    }
    if (!registerData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    if ((registerData.password || '').length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { confirmPassword, ...userData } = registerData;
    const result = await register(userData);
    if (result?.success) {
      navigate('/dashboard');
    } else {
      setError(result?.error || 'Registration failed');
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
              <div className="modern-form-group">
                <label className="modern-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="modern-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <div className="modern-form-group">
                <label className="modern-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="modern-input"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
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
              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label className="modern-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    className="modern-input"
                    value={registerData.firstName}
                    onChange={handleRegisterChange}
                    placeholder="First name"
                    required
                  />
                </div>
                
                <div className="modern-form-group">
                  <label className="modern-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    className="modern-input"
                    value={registerData.lastName}
                    onChange={handleRegisterChange}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
              
              <div className="modern-form-group">
                <label className="modern-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="modern-input"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <div className="modern-form-group">
                <label className="modern-label">Role</label>
                <select
                  name="role"
                  className="modern-select"
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
              
              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label className="modern-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="modern-input"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="Enter password"
                    required
                  />
                </div>
                
                <div className="modern-form-group">
                  <label className="modern-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="modern-input"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Confirm password"
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
