import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import api from '../../utils/api'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const ROLES = [
  { value: 'top_management',  label: 'Top Management' },
  { value: 'quality_manager', label: 'Quality Manager' },
  { value: 'quality_auditor', label: 'Quality Auditor' },
]

export default function UsersPage() {
  const { user: me } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', role: 'quality_auditor' })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    try { const d = await api.getQAUsers(); setUsers(d.users || []) }
    catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  async function createUser() {
    if (!form.email.trim() || !form.name.trim()) {
      toast.error('Email and name are required')
      return
    }
    setSaving(true)
    try {
      await api.createQAUser({ email: form.email.trim().toLowerCase(), name: form.name.trim(), role: form.role })
      setShowNew(false); setForm({ email: '', name: '', role: 'quality_auditor' })
      await load()
      toast.success('User created')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function changeRole(u, role) {
    try { await api.updateQAUserRole(u.id, role); await load() }
    catch (e) { toast.error(e.message) }
  }

  async function removeUser(u) {
    try { await api.removeQAUser(u.id); setConfirm(null); await load(); toast.success('User deactivated') }
    catch (e) { toast.error(e.message) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 16 }}>
      <Link to="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={16} /> Back to settings
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Users</h1>
        <button
          onClick={() => setShowNew(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <Plus size={16} /> Add user
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              opacity: u.is_active ? 1 : 0.5,
            }}
          >
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--color-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{u.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
            </div>
            <select
              value={u.role}
              onChange={(e) => changeRole(u, e.target.value)}
              disabled={u.id === me?.id}
              style={{
                padding: '6px 8px',
                fontSize: 12,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-elevated)',
              }}
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {u.id !== me?.id && u.is_active && (
              <button
                onClick={() => setConfirm(u)}
                style={{ color: 'var(--color-danger)', padding: 6 }}
                aria-label="Deactivate"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add user">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Email</div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="someone@creativepan.com.eg"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </label>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Name</div>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </label>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Role</div>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
            <button onClick={() => setShowNew(false)} style={{ padding: '10px 14px', fontSize: 14, color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button
              onClick={createUser}
              disabled={saving}
              style={{
                padding: '10px 14px',
                fontSize: 14,
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => removeUser(confirm)}
        title="Deactivate user?"
        message={`${confirm?.name} won't be able to log in until reactivated.`}
        confirmLabel="Deactivate"
        danger
      />
    </div>
  )
}
