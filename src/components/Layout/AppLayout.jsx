import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { ClipboardCheck, History, Settings, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function navLinkStyle(isActive, variant = 'side') {
  if (variant === 'bottom') {
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      padding: '8px 12px',
      fontSize: 11,
      fontWeight: 500,
      color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
      textDecoration: 'none',
      flex: 1,
      transition: 'color 0.15s',
    }
  }
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    background: isActive ? 'var(--color-bg-hover)' : 'transparent',
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
  }
}

export default function AppLayout() {
  const { user, logout, isQualityManager, isAuditor } = useAuth()

  const SIDEBAR_W = 224

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-elevated)' }}>
      {/* Desktop sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: SIDEBAR_W,
          background: 'var(--color-bg-card)',
          borderRight: '1px solid var(--color-border)',
          flexDirection: 'column',
          paddingTop: 16,
          zIndex: 30,
        }}
        className="qa-sidebar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px 24px' }}>
          <ClipboardCheck size={22} color="var(--color-primary)" />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Quality Audit</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive)}>
            <ClipboardCheck size={18} /> Audits
          </NavLink>
          {isAuditor && (
            <NavLink to="/history" style={({ isActive }) => navLinkStyle(isActive)}>
              <History size={18} /> History
            </NavLink>
          )}
          {isQualityManager && (
            <NavLink to="/settings" style={({ isActive }) => navLinkStyle(isActive)}>
              <Settings size={18} /> Settings
            </NavLink>
          )}
        </nav>
        <div
          style={{
            marginTop: 'auto',
            padding: 16,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{user?.name}</div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              textTransform: 'capitalize',
              marginTop: 2,
            }}
          >
            {user?.role?.replace(/_/g, ' ')}
          </div>
          <button
            onClick={logout}
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--color-text-muted)',
              padding: '4px 0',
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Top header — mobile only */}
      <header
        className="qa-topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          padding: '12px 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={20} color="var(--color-primary)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Quality Audit</span>
        </div>
        <button
          onClick={logout}
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main
        className="qa-main"
        style={{ paddingBottom: 80, minHeight: 'calc(100vh - 60px)' }}
      >
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <nav
        className="qa-bottomnav safe-bottom"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: 'var(--color-bg-card)',
          borderTop: '1px solid var(--color-border)',
          justifyContent: 'space-around',
          padding: '4px 0',
        }}
      >
        <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive, 'bottom')}>
          <ClipboardCheck size={22} /> <span>Audits</span>
        </NavLink>
        {isAuditor && (
          <NavLink to="/history" style={({ isActive }) => navLinkStyle(isActive, 'bottom')}>
            <History size={22} /> <span>History</span>
          </NavLink>
        )}
        {isQualityManager && (
          <NavLink to="/settings" style={({ isActive }) => navLinkStyle(isActive, 'bottom')}>
            <Settings size={22} /> <span>Settings</span>
          </NavLink>
        )}
        <NavLink to="/profile" style={({ isActive }) => navLinkStyle(isActive, 'bottom')}>
          <User size={22} /> <span>Profile</span>
        </NavLink>
      </nav>

      <style>{`
        .qa-sidebar   { display: none; }
        .qa-topbar    { display: flex; }
        .qa-bottomnav { display: flex; }
        @media (min-width: 768px) {
          .qa-sidebar   { display: flex; }
          .qa-topbar    { display: none; }
          .qa-bottomnav { display: none; }
          .qa-main      { margin-left: ${SIDEBAR_W}px; padding-bottom: 0; }
        }
      `}</style>
    </div>
  )
}
