import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Building2, Users, ChevronRight } from 'lucide-react'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Spinner from '../../components/ui/Spinner'

function Row({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-hover)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{subtitle}</div>
      </div>
      <ChevronRight size={18} color="var(--color-text-muted)" />
    </Link>
  )
}

export default function SettingsPage() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getBrands()
      .then((d) => setBrands(d.brands || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: 'var(--color-text)' }}>
        Settings
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-muted)', margin: '4px 0' }}>
          Form templates
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>
        ) : (
          brands.map((b) => (
            <Row
              key={b.id}
              to={`/settings/forms/${b.id}`}
              icon={ClipboardList}
              title={b.name}
              subtitle="Edit sections and points"
            />
          ))
        )}

        {isAdmin && (
          <>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-muted)', margin: '12px 0 4px' }}>
              Administration
            </div>
            <Row to="/settings/branches" icon={Building2} title="Branches" subtitle="Assign branches to brands" />
            <Row to="/settings/users"    icon={Users}      title="Users"    subtitle="Add and manage QA users" />
          </>
        )}
      </div>
    </div>
  )
}
