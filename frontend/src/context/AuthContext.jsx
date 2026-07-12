import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, getAccessToken, setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const boot = async () => {
      const token = getAccessToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const response = await api.get('/auth/me')
        setUser(response.data)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    boot()
  }, [])

  const login = async (email, password, expectedRole = null) => {
    const response = await api.post('/auth/login', { email, password })
    if (expectedRole && response.data.role !== expectedRole) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      throw new Error('Role mismatch')
    }
    setTokens(response.data.access_token, response.data.refresh_token)
    const meResponse = await api.get('/auth/me')
    setUser(meResponse.data)
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const value = useMemo(() => ({ user, setUser, loading, login, logout }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
