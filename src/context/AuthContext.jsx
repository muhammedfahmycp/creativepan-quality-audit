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

  // Role helpers — derived from new unified role structure
  // platform_role: 'admin' | 'top_management' | 'it_team' | null
  // qa_role:       'quality_manager' | 'quality_auditor' | null

  const isAdmin          = user?.platform_role === 'admin'
  const isQualityManager = user?.platform_role === 'admin' || user?.qa_role === 'quality_manager'
  const isAuditor        = user?.platform_role === 'admin' || !!user?.qa_role
  const isBranchManager  = !!user?.branch   // branch-email login

  // Gate: only QA system users (+ platform admin) can use this app
  const hasQualityAccess = isAdmin || !!user?.qa_role

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, checkAuth,
      isAdmin, isQualityManager, isAuditor, isBranchManager, hasQualityAccess,
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
