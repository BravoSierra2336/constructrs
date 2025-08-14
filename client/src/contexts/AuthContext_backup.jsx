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
      // First check localStorage
      const token = localStorage.getItem('token');
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
          setUser(normalizedUser);
          console.log('✅ User set from localStorage:', normalizedUser);
          return;
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError);
          localStorage.removeItem('userData');
          localStorage.removeItem('token');
        }
      }

      // Then check cookies as fallback
      const userDataCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userData='));
      
      console.log('🍪 Cookie check:', { hasUserDataCookie: !!userDataCookie });

      if (userDataCookie) {
        try {
          const cookieValue = decodeURIComponent(userDataCookie.split('=')[1]);
          const parsedUser = JSON.parse(cookieValue);
          
          // Handle both MongoDB _id and id formats
          const userId = parsedUser.id || parsedUser._id;
          const userEmail = parsedUser.email;
          
          // Validate user object structure
          if (!userId || !userEmail) {
            console.error('❌ Invalid user data structure from cookie:', parsedUser);
            throw new Error('Invalid user data structure');
          }

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
          
          // Store in localStorage for next time
          localStorage.setItem('userData', JSON.stringify(normalizedUser));
          console.log('✅ User set from cookie and stored in localStorage');
          return;
        } catch (parseError) {
          console.error('❌ Error parsing cookie user data:', parseError);
        }
      }

      // If no valid auth found, verify with server
      console.log('🔍 No local auth found, checking with server...');
      const apiUrl = getApiUrl();
      const tokenCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='));

      if (tokenCookie || token) {
        const authToken = token || tokenCookie?.split('=')[1];
        console.log('🔑 Found auth token, verifying with server...');
        
        const response = await axios.get(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.user) {
          const serverUser = response.data.user;
          
          // Handle both MongoDB _id and id formats
          const userId = serverUser.id || serverUser._id;
          const userEmail = serverUser.email;
          
          // Validate user object structure
          if (!userId || !userEmail) {
            console.error('❌ Invalid user data structure from server:', serverUser);
            throw new Error('Invalid user data structure');
          }

          // Normalize user object for consistency
          const normalizedUser = {
            ...serverUser,
            id: userId,
            _id: userId,
            email: userEmail 
          };

          console.log('✅ Valid user from server:', {
            id: normalizedUser.id,
            email: normalizedUser.email,
            role: normalizedUser.role
          });
          setUser(normalizedUser);
          
          // Store in localStorage
          localStorage.setItem('token', authToken);
          localStorage.setItem('userData', JSON.stringify(normalizedUser));
          console.log('✅ User verified with server and stored locally');
          return;
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

        localStorage.setItem('token', token);
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
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Clear cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
      const token = localStorage.getItem('token');
      if (!token || !user) return null;

      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/users/profile-photo`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data.photoUrl;
    } catch (error) {
      console.error('❌ Error fetching profile photo:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    updateUser,
    fetchProfilePhoto
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
