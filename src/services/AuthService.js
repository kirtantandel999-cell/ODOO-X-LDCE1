export const AuthService = {
  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem('globetrotter_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  logout: async () => {
    try {
      localStorage.removeItem('globetrotter_user');
    } catch {
      // ignore
    }
    return { success: true };
  },

  login: async (username, password) => {
    console.log("Attempting login with:", { username, password });
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username && password) {
          const userObj = {
            username,
            name: username.charAt(0).toUpperCase() + username.slice(1),
            email: `${username}@globetrotter.io`,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          };
          try {
            localStorage.setItem('globetrotter_user', JSON.stringify(userObj));
          } catch (e) {
            console.error(e);
          }
          resolve({ success: true, message: "Logged in successfully", user: userObj });
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 500);
    });
  },
  
  register: async (userData) => {
    console.log("Attempting registration with:", userData);
    return new Promise((resolve) => {
      setTimeout(() => {
        const userObj = {
          username: (userData.firstName || 'User').toLowerCase(),
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
          email: userData.email,
          city: userData.city,
          country: userData.country,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        };
        try {
          localStorage.setItem('globetrotter_user', JSON.stringify(userObj));
        } catch (e) {
          console.error(e);
        }
        resolve({ success: true, message: "Registration successful", user: userObj });
      }, 600);
    });
  },
  
  resetPassword: async (email) => {
    console.log("Attempting password reset for:", email);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: "Password reset link sent" });
      }, 500);
    });
  }
};
