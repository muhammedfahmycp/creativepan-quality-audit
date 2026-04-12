import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './components/Layout/AppLayout'
import Spinner from './components/ui/Spinner'

import Login from './pages/Login'
import BrandTabs from './pages/BrandTabs'
import BranchListPage from './pages/BranchListPage'
import AuditFormPage from './pages/AuditFormPage'
import AuditHistoryPage from './pages/AuditHistoryPage'
import BranchSummaryPage from './pages/BranchSummaryPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/settings/SettingsPage'
import FormDesignerPage from './pages/settings/FormDesignerPage'
import BranchesPage from './pages/settings/BranchesPage'
import UsersPage from './pages/settings/UsersPage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size={8} /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size={8} /></div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Main audit flow */}
        <Route index element={<BrandTabs />} />
        <Route path="brands/:brandId/:month" element={<BranchListPage />} />
        <Route path="audits/:auditId" element={<AuditFormPage />} />

        {/* Auditor history */}
        <Route
          path="history"
          element={
            <ProtectedRoute roles={['admin', 'quality_manager', 'auditor']}>
              <AuditHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Branch summary (branch managers + quality managers) */}
        <Route path="branches/:branchId/summary" element={<BranchSummaryPage />} />

        {/* Profile */}
        <Route path="profile" element={<ProfilePage />} />

        {/* Settings (quality_manager + admin only) */}
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={['admin', 'quality_manager']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/forms/:brandId"
          element={
            <ProtectedRoute roles={['admin', 'quality_manager']}>
              <FormDesignerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/branches"
          element={
            <ProtectedRoute roles={['admin', 'quality_manager']}>
              <BranchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/users"
          element={
            <ProtectedRoute roles={['admin', 'quality_manager']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
