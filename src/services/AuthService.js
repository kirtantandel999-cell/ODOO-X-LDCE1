const API_BASE = 'http://localhost:5000/api/auth';
const USER_KEY = 'globetrotter_user';
const TOKEN_KEY = 'globetrotter_token';

export const AuthService = {
  // ── Read persisted session ────────────────────
  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  },

  // ── Logout ────────────────────────────────────
  logout: async () => {
    try {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    return { success: true };
  },

  // ── Login ─────────────────────────────────────
  // POST /api/auth/login  { email, password }
  // Returns { message, token, user }
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Persist user + token
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_KEY, data.token);
    } catch (e) {
      console.error('Failed to persist auth data', e);
    }

    return { success: true, message: data.message, user: data.user, token: data.token };
  },

  // ── Register ──────────────────────────────────
  // POST /api/auth/register
  // Returns { message, user }  (no token)
  register: async (userData) => {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phoneNumber: userData.phone || userData.phoneNumber,
        city: userData.city,
        country: userData.country,
        additionalInformation: userData.additionalInfo || userData.additionalInformation || '',
        photo: userData.photo || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return { success: true, message: data.message, user: data.user };
  },

  // ── Get Profile (protected) ───────────────────
  // GET /api/auth/profile
  getProfile: async (token) => {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }

    return data.user;
  },

  // ── Update Profile (protected) ────────────────
  // PUT /api/auth/profile
  updateProfile: async (token, profileData) => {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return { message: data.message, user: data.user };
  },

  // ── Reset Password (placeholder) ──────────────
  resetPassword: async (email) => {
    console.log('Attempting password reset for:', email);
    return { success: true, message: 'Password reset link sent' };
  },
};
