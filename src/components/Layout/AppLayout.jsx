import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { ClipboardCheck, History, Settings, LogOut, User, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-2 px-4 text-xs font-medium transition-colors ${
          isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
        }`
      }
    >
      <Icon size={22} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const { user, logout, isQualityManager, isBranchManager } = useAuth()

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Top header — desktop sidebar replaces this on large screens */}
      <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck size={22} className="text-amber-400" />
          <span className="font-semibold text-white text-sm">Quality Audit</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="hidden sm:block">{user?.name}</span>
          <button onClick={logout} className="hover:text-white transition-colors" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 flex justify-around md:hidden safe-bottom">
        <NavItem to="/" end icon={ClipboardCheck} label="Audits" />
        {!isBranchManager && <NavItem to="/history" icon={History} label="History" />}
        {isQualityManager && <NavItem to="/settings" icon={Settings} label="Settings" />}
        <NavItem to="/profile" icon={User} label="Profile" />
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-gray-900 border-r border-gray-800 flex-col pt-4 z-30">
        <div className="flex items-center gap-3 px-5 py-3 mb-6">
          <ClipboardCheck size={24} className="text-amber-400" />
          <span className="font-semibold text-white">Quality Audit</span>
        </div>
        <div className="flex flex-col gap-1 px-3">
          <SideNavItem to="/" end icon={ClipboardCheck} label="Audits" />
          {!isBranchManager && <SideNavItem to="/history" icon={History} label="History" />}
          {isQualityManager && <SideNavItem to="/settings" icon={Settings} label="Settings" />}
        </div>
        <div className="mt-auto px-4 py-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-1">{user?.name}</div>
          <div className="text-xs text-gray-600">{user?.qa_role?.replace('_', ' ') || user?.platform_role?.replace('_', ' ')}</div>
          <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Desktop content offset */}
      <style>{`@media (min-width: 768px) { main { margin-left: 14rem; } }`}</style>
    </div>
  )
}

function SideNavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}
