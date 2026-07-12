import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: apiBaseUrl,
})

const authApi = axios.create({
  baseURL: apiBaseUrl,
})

const getAccessToken = () => localStorage.getItem('access_token')
const getRefreshToken = () => localStorage.getItem('refresh_token')
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return Promise.reject(error)
    }

    const refreshResponse = await authApi.post('/auth/refresh', { refresh_token: refreshToken })
    setTokens(refreshResponse.data.access_token, refreshResponse.data.refresh_token)
    originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`
    return api(originalRequest)
  },
)

export { getAccessToken, getRefreshToken, setTokens }
