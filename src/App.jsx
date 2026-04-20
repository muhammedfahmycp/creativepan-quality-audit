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

function FullScreenLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
      }}
    >
      <Spinner size={32} />
    </div>
  )
}

function ProtectedRoute({ children, need }) {
  const { user, loading, isQualityManager, isAuditor } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  if (need === 'quality_manager' && !isQualityManager) return <Navigate to="/" replace />
  if (need === 'auditor' && !isAuditor) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />

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
            <ProtectedRoute need="auditor">
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
            <ProtectedRoute need="quality_manager">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/forms/:brandId"
          element={
            <ProtectedRoute need="quality_manager">
              <FormDesignerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/branches"
          element={
            <ProtectedRoute need="quality_manager">
              <BranchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/users"
          element={
            <ProtectedRoute need="quality_manager">
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
