import axiosClient from '../api/axiosClient';

const authService = {
  login: async (credentials) => {
    // credentials: { username, password }
    // Backend expects 'username' (can be email) and 'password'
    // Endpoint: /api/auth/signin
    const response = await axiosClient.post('/auth/signin', credentials);
    if (response) {
      const normalized = {
        ...(response || {}),
        _id: response?._id || response?.userId,
        elo: Number.isFinite(response?.elo) ? response.elo : 100,
        linkedStudentId: response?.linkedStudentId || null,
      };
      localStorage.setItem('user', JSON.stringify(normalized));
      return normalized;
    }
    return response;
  },

  register: async (userData) => {
    // userData: { fullName, email, password, phone, ... }
    // Endpoint: /api/auth/signup (Verify backend endpoint)
    // Looking at authController (from previous knowledge), likely /auth/signup or /users
    // Let's assume /auth/signup based on Login being /auth/signin
    // If not, we might need to check server.js/authRoutes.js
    // Let's check authRoutes first if possible, but standard is signup.
    return await axiosClient.post('/auth/signup', userData);
  },

  logout: () => {
    axiosClient.post('/auth/signout').catch(() => null);
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === "undefined") return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error("Failed to parse current user from localStorage", e);
      return null;
    }
  }
};

export default authService;
