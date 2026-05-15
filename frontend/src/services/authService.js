import api from '../lib/axios';
import { API_ENDPOINTS } from '../constants/api';

const authService = {
  login: async (username, password) => {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, { username, password });
    return res.data;
  },

  logout: async () => {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    return res.data;
  },

  refreshToken: async () => {
    const res = await api.post(API_ENDPOINTS.AUTH.REFRESH);
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await api.get(API_ENDPOINTS.AUTH.ME);
    return res.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
    return res.data;
  },
};

export default authService;
