import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT Token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('assetflow_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Handle auth failures globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401 (Unauthorized) and it's not a login attempt
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.url?.includes('/auth/login') &&
      !error.config.url?.includes('/auth/signup')
    ) {
      localStorage.removeItem('assetflow_token')
      localStorage.removeItem('assetflow_user')
      // Redirect to login page if window is available
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
