import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global API errors here (e.g., 401 Unauthorized for refresh tokens)
    return Promise.reject(error);
  }
);

export default api;
