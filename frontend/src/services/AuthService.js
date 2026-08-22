export const AuthService = {
  login: async (username, password) => {
    console.log("Attempting login with:", { username, password });
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username && password) {
          resolve({ success: true, message: "Logged in successfully", user: { username } });
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 1000);
    });
  },
  
  register: async (userData) => {
    console.log("Attempting registration with:", userData);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: "Registration successful" });
      }, 1500);
    });
  },
  
  resetPassword: async (email) => {
    console.log("Attempting password reset for:", email);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: "Password reset link sent" });
      }, 1000);
    });
  }
};
