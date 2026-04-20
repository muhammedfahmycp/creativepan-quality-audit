import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    if (!api.getToken()) { setLoading(false); return }
    try {
      const data = await api.getMe()
      setUser(data.user)
    } catch {
      api.clearToken()
    } finally {
      setLoading(false)
    }
  }

  const login = async (idToken) => {
    const data = await api.loginWithGoogle(idToken)
    setUser(data.user)
    return data
  }

  const logout = () => {
    api.clearToken()
    setUser(null)
    window.location.href = '/login'
  }

  // Single role column on qa_users: 'top_management' | 'quality_manager' | 'quality_auditor'
  // top_management is a super-role: inherits all capabilities
  const role = user?.role || null
  const isAdmin          = role === 'top_management'
  const isQualityManager = role === 'top_management' || role === 'quality_manager'
  const isAuditor        = role === 'top_management' || role === 'quality_auditor'

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, checkAuth,
      role, isAdmin, isQualityManager, isAuditor,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
