import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get API base URL based on environment
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5050';
      }
    }
    return 'https://constructrs.onrender.com';
  };

  const checkAuthStatus = async () => {
    console.log('🔍 Checking auth status...');
    try {
      // First check localStorage for both token keys
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      console.log('📦 localStorage check:', { 
        hasToken: !!token, 
        hasUserData: !!userData,
        userDataPreview: userData ? userData.substring(0, 100) : null
      });

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          
          // Handle both MongoDB _id and id formats
          const userId = parsedUser.id || parsedUser._id;
          const userEmail = parsedUser.email;
          
          // Validate user object structure
          if (!userId || !userEmail) {
            console.error('❌ Invalid user data structure:', parsedUser);
            throw new Error('Invalid user data structure');
          }

          // Normalize user object for consistency
          const normalizedUser = {
            ...parsedUser,
            id: userId,
            _id: userId,
            email: userEmail 
          };

          console.log('✅ Valid user from localStorage:', {
            id: normalizedUser.id,
            email: normalizedUser.email,
            role: normalizedUser.role
          });

          // Verify token with server before trusting local data
          console.log('🔑 Verifying token with server...');
          const apiUrl = getApiUrl();
          const response = await axios.get(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success && response.data.user) {
            console.log('✅ Token verified, user is authenticated');
            setUser(normalizedUser);
            return;
          } else {
            throw new Error('Token verification failed');
          }
        } catch (error) {
          console.error('❌ Error parsing user data or token verification failed:', error);
          localStorage.removeItem('userData');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
        }
      }

      // Check cookies as fallback
      const userDataCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userData='));
      
      const tokenCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='));
      
      console.log('🍪 Cookie check:', { 
        hasUserDataCookie: !!userDataCookie,
        hasTokenCookie: !!tokenCookie 
      });

      if (userDataCookie && tokenCookie) {
        try {
          const cookieValue = decodeURIComponent(userDataCookie.split('=')[1]);
          const parsedUser = JSON.parse(cookieValue);
          const cookieToken = tokenCookie.split('=')[1];
          
          // Handle both MongoDB _id and id formats
          const userId = parsedUser.id || parsedUser._id;
          const userEmail = parsedUser.email;
          
          // Validate user object structure
          if (!userId || !userEmail) {
            console.error('❌ Invalid user data structure from cookie:', parsedUser);
            throw new Error('Invalid user data structure');
          }

          // Verify token with server
          console.log('🔑 Verifying cookie token with server...');
          const apiUrl = getApiUrl();
          const response = await axios.get(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${cookieToken}` }
          });

          if (response.data.success && response.data.user) {
            // Normalize user object for consistency
            const normalizedUser = {
              ...parsedUser,
              id: userId,
              _id: userId,
              email: userEmail 
            };

            console.log('✅ Valid user from cookie:', {
              id: normalizedUser.id,
              email: normalizedUser.email,
              role: normalizedUser.role
            });
            setUser(normalizedUser);
            
            // Store in localStorage for next time with both token keys
            localStorage.setItem('token', cookieToken);
            localStorage.setItem('authToken', cookieToken); // For admin panel compatibility
            localStorage.setItem('userData', JSON.stringify(normalizedUser));
            console.log('✅ User set from cookie and stored in localStorage');
            return;
          } else {
            throw new Error('Cookie token verification failed');
          }
        } catch (parseError) {
          console.error('❌ Error parsing cookie user data or token verification failed:', parseError);
          // Clear invalid cookies
          document.cookie = 'userData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      }

      console.log('❌ No valid authentication found');
      setUser(null);
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setUser(null);
      // Clear invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const apiUrl = getApiUrl();
      console.log('🔐 Attempting login with:', { email, apiUrl });
      
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password
      });

      console.log('📬 Login response:', response.data);

      if (response.data.success || response.data.token) {
        const { token, user: userData } = response.data;
        
        // Handle both MongoDB _id and id formats
        const userId = userData.id || userData._id;
        const userEmail = userData.email;
        
        // Validate user object structure
        if (!userId || !userEmail) {
          console.error('❌ Invalid user data structure from login:', userData);
          throw new Error('Invalid user data structure');
        }

        // Normalize user object for consistency
        const normalizedUser = {
          ...userData,
          id: userId,
          _id: userId,
          email: userEmail 
        };

        console.log('✅ Login successful:', {
          id: normalizedUser.id,
          email: normalizedUser.email,
          role: normalizedUser.role
        });

        // Store token under both keys for compatibility with admin panel
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token); // For admin panel compatibility
        localStorage.setItem('userData', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    // Remove both token keys for compatibility
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Clear cookies (both old and new names to be safe)
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    setUser(null);
    console.log('✅ Logout complete');
  };

  const register = async (userData) => {
    try {
      const apiUrl = getApiUrl();
      console.log('📝 Attempting registration with:', { ...userData, password: '[HIDDEN]' });
      
      const response = await axios.post(`${apiUrl}/auth/register`, userData);
      
      console.log('📬 Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const updateUser = (updatedUser) => {
    // Handle both MongoDB _id and id formats
    const userId = updatedUser.id || updatedUser._id;
    const userEmail = updatedUser.email;
    
    // Validate user object structure
    if (!userId || !userEmail) {
      console.error('❌ Invalid user data structure for update:', updatedUser);
      return;
    }

    // Normalize user object for consistency
    const normalizedUser = {
      ...updatedUser,
      id: userId,
      _id: userId,
      email: userEmail 
    };

    console.log('🔄 Updating user:', {
      id: normalizedUser.id,
      email: normalizedUser.email,
      role: normalizedUser.role
    });

    setUser(normalizedUser);
    localStorage.setItem('userData', JSON.stringify(normalizedUser));
  };

  const fetchProfilePhoto = async () => {
    try {
      console.log('🔍 fetchProfilePhoto called');
      console.log('   Current user:', user);
      
      const token = localStorage.getItem('token');
      console.log('   Token from localStorage:', token ? 'EXISTS' : 'MISSING');
      
      if (!token) {
        console.log('❌ No token found - user not authenticated');
        return null;
      }
      
      if (!user) {
        console.log('❌ No user object - authentication not complete');
        return null;
      }

      const apiUrl = getApiUrl();
      console.log('   Making request to:', `${apiUrl}/users/profile-photo`);
      
      const response = await axios.get(`${apiUrl}/users/profile-photo`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Profile photo request successful:', response.data);
      return response.data.photoUrl;
    } catch (error) {
      console.error('❌ Error fetching profile photo:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // If 401, user needs to re-authenticate
      if (error.response?.status === 401) {
        console.log('🔄 Token expired or invalid - logging out user');
        logout();
      }
      
      return null;
    }
  };

  const loginWithMicrosoft = () => {
    console.log('🔐 Initiating Microsoft OAuth login...');
    const apiUrl = getApiUrl();
    const microsoftAuthUrl = `${apiUrl}/auth/microsoft`;
    console.log('🌐 Redirecting to:', microsoftAuthUrl);
    window.location.href = microsoftAuthUrl;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user, // True if user exists, false otherwise
    login,
    logout,
    register,
    updateUser,
    fetchProfilePhoto,
    loginWithMicrosoft
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
