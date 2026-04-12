import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = {
  admin: 'Admin',
  quality_manager: 'Quality Manager',
  auditor: 'Auditor',
  branch_manager: 'Branch Manager',
  top_management: 'Top Management',
  operations_manager: 'Ops Manager',
  area_manager: 'Area Manager',
}

export default function ProfilePage() {
  const { user, logout } = useAuth()

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold text-white mb-6">Profile</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
          <User size={28} className="text-gray-400" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">{user?.name}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-900/30 text-amber-400 text-xs font-medium">
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium text-white transition-colors w-full justify-center"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
