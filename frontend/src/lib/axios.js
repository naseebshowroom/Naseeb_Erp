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

// ── BUG 1 FIX: Queue-based token refresh ────────────────────────────────────
// Problem: With the old code, when the access token expires, ALL concurrent
// API calls fail with 401 simultaneously and each one fires its own
// /auth/refresh — a race condition that can cause multiple logouts or
// conflicting new tokens.
//
// Fix: Use a single isRefreshing flag + failedQueue. Only ONE refresh call
// is ever in-flight at a time; every other concurrent 401 waits in the queue
// and is retried automatically once the single refresh succeeds.
// ────────────────────────────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue = [] // [{ resolve, reject }]

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    // Only intercept 401s that haven't already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // If a refresh is already in-flight, queue this request and wait
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => {
          // Re-attach the (now updated) access token and retry
          const token = useAuthStore.getState().accessToken || localStorage.getItem('token')
          if (token) originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const res = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      )

      if (res.data.success && res.data.accessToken) {
        const newToken = res.data.accessToken
        useAuthStore.getState().setAccessToken(newToken)
        localStorage.setItem('token', newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        processQueue(null) // Unblock all queued requests
        isRefreshing = false
        return api(originalRequest)
      }

      throw new Error('Refresh response missing accessToken')
    } catch (refreshError) {
      processQueue(refreshError) // Reject all queued requests
      isRefreshing = false
      useAuthStore.getState().logout()
      localStorage.removeItem('token')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    }
  }
)

export default api
