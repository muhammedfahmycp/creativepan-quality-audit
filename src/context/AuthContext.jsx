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

  const isAdmin         = user?.role === 'admin'
  const isQualityManager = ['admin', 'quality_manager'].includes(user?.role)
  const isAuditor       = ['admin', 'quality_manager', 'auditor'].includes(user?.role)
  const isBranchManager = user?.role === 'branch_manager'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isQualityManager, isAuditor, isBranchManager, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
