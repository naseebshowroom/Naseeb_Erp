import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    // Try Zustand store first (in-memory token), fall back to localStorage
    const storeToken = useAuthStore.getState().accessToken
    const token = storeToken || localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle 401s and auto-refresh token silently
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retried, attempt a silent token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        if (res.data.success && res.data.accessToken) {
          useAuthStore.getState().setAccessToken(res.data.accessToken)
          localStorage.setItem('token', res.data.accessToken)
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed — log out fully
        useAuthStore.getState().logout()
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

