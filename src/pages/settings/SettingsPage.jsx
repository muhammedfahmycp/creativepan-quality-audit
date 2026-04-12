import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Building2, Users, ChevronRight } from 'lucide-react'
import api from '../../utils/api'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'

export default function SettingsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    api.getBrands()
      .then(d => setBrands(d.brands || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center pt-20"><Spinner /></div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold text-white mb-6">Settings</h1>

      {/* Form Designer */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Audit Forms</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800">
          {brands.map(brand => (
            <button
              key={brand.id}
              onClick={() => navigate(`/settings/forms/${brand.id}`)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brand.color }} />
                <div>
                  <p className="text-sm font-medium text-white">{brand.name}</p>
                  <p className="text-xs text-gray-500">Manage sections & points</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          ))}
        </div>
      </section>

      {/* Branches */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Branches</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => navigate('/settings/branches')}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-800/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">Branch Assignments</p>
                <p className="text-xs text-gray-500">Assign branches to brands</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      </section>

      {/* Users */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Users</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => navigate('/settings/users')}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-800/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Users size={18} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">User Management</p>
                <p className="text-xs text-gray-500">Manage auditors, quality managers & branch access</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      </section>
    </div>
  )
}
