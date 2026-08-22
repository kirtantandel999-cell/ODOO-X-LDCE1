const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthService = {
  getToken: () => {
    try {
      return localStorage.getItem('globetrotter_token') || null;
    } catch {
      return null;
    }
  },

  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem('globetrotter_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getAuthHeaders: () => {
    const token = AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  logout: async () => {
    try {
      localStorage.removeItem('globetrotter_user');
      localStorage.removeItem('globetrotter_token');
    } catch (e) {
      console.error('Logout storage clear error:', e);
    }
    return { success: true };
  },

  login: async (emailOrUsername, password) => {
    console.log('Attempting backend login with:', { emailOrUsername });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailOrUsername.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      if (data.token) {
        localStorage.setItem('globetrotter_token', data.token);
      }

      const rawUser = data.user || {};
      const fullName = [rawUser.firstName, rawUser.lastName].filter(Boolean).join(' ') || rawUser.email || emailOrUsername;
      const username = rawUser.email ? rawUser.email.split('@')[0] : emailOrUsername;
      
      const userObj = {
        ...rawUser,
        name: fullName,
        username,
        avatar: rawUser.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };

      try {
        localStorage.setItem('globetrotter_user', JSON.stringify(userObj));
      } catch (e) {
        console.error('Failed to store user in localStorage:', e);
      }

      return {
        success: true,
        message: data.message || 'Logged in successfully',
        token: data.token,
        user: userObj,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Could not connect to backend server. Make sure the backend is running at ' + API_BASE_URL);
      }
      throw error;
    }
  },

  register: async (userData) => {
    console.log('Attempting backend registration with:', userData.email);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName?.trim(),
          lastName: userData.lastName?.trim(),
          email: userData.email?.trim().toLowerCase(),
          password: userData.password,
          phoneNumber: (userData.phoneNumber || userData.phone || '').trim(),
          city: userData.city?.trim(),
          country: userData.country?.trim(),
          additionalInformation: (userData.additionalInformation || userData.additionalInfo || '').trim() || null,
          photo: userData.photo || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      return {
        success: true,
        message: data.message || 'Registration successful. Please log in.',
        user: data.user,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Could not connect to backend server. Make sure the backend is running at ' + API_BASE_URL);
      }
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: AuthService.getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }
      return data.user || data.data?.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: AuthService.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      return data.user || data.data?.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  resetPassword: async (email) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Password reset link sent' });
      }, 500);
    });
  },
};
