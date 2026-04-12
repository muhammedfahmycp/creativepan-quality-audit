import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Check, X } from 'lucide-react'
import api from '../../utils/api'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'

const QA_ROLES = ['quality_manager', 'auditor', 'branch_manager']
const ROLE_LABELS = {
  admin: 'Admin',
  top_management: 'Top Management',
  operations_manager: 'Ops Manager',
  area_manager: 'Area Manager',
  quality_manager: 'Quality Manager',
  auditor: 'Auditor',
  branch_manager: 'Branch Manager',
}
const ROLE_COLORS = {
  quality_manager: 'text-purple-400',
  auditor: 'text-blue-400',
  branch_manager: 'text-green-400',
  admin: 'text-amber-400',
}

function UserRow({ user, onRoleChange }) {
  const [editing, setEditing] = useState(false)
  const [role, setRole] = useState(user.role)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const save = async () => {
    setSaving(true)
    try {
      await api.updateUser(user.id, { role })
      onRoleChange(user.id, role)
      setEditing(false)
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {editing ? (
          <>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-xs text-white rounded px-2 py-1 focus:outline-none"
            >
              {Object.entries(ROLE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <button onClick={save} disabled={saving} className="text-green-400 hover:text-green-300 disabled:opacity-50"><Check size={14} /></button>
            <button onClick={() => { setEditing(false); setRole(user.role) }} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
          </>
        ) : (
          <>
            <span className={`text-xs font-medium ${ROLE_COLORS[user.role] || 'text-gray-400'}`}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
            <button onClick={() => setEditing(true)} className="text-gray-600 hover:text-gray-300 transition-colors"><Pencil size={13} /></button>
          </>
        )}
      </div>
    </div>
  )
}

export default function UsersPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')

  // New user form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('auditor')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    api.getUsers()
      .then(d => setUsers(d.users || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim()) { toast.error('Name and email required'); return }
    setAdding(true)
    try {
      const data = await api.createUser({ name: newName.trim(), email: newEmail.trim(), role: newRole, is_whitelisted: true, is_active: true })
      setUsers(u => [...u, data.user])
      setNewName(''); setNewEmail(''); setNewRole('auditor')
      setShowAdd(false)
      toast.success('User created')
    } catch (e) { toast.error(e.message) }
    finally { setAdding(false) }
  }

  const handleRoleChange = (userId, role) => {
    setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x))
  }

  const filtered = filter === 'all'
    ? users
    : users.filter(u => u.role === filter)

  if (loading) return <div className="flex justify-center pt-20"><Spinner /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <h1 className="text-sm font-semibold text-white flex-1">Users</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-900 text-xs font-semibold transition-colors"
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 py-3 border-b border-gray-800 overflow-x-auto">
        {['all', 'quality_manager', 'auditor', 'branch_manager'].map(r => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === r ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {r === 'all' ? 'All' : ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl m-4 overflow-hidden">
        {filtered.length === 0
          ? <p className="text-center text-gray-600 py-8 text-sm">No users found.</p>
          : filtered.map(u => <UserRow key={u.id} user={u} onRoleChange={handleRoleChange} />)
        }
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add User">
        <div className="flex flex-col gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Full name"
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
          />
          <input
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            {QA_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <p className="text-xs text-gray-500">The user must sign in with Google using this email to activate their account.</p>
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium">Cancel</button>
            <button onClick={handleAdd} disabled={adding} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-900 text-sm font-semibold disabled:opacity-50">
              {adding ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
