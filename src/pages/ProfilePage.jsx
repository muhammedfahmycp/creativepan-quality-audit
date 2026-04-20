import React from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <div style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 24,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              style={{ width: 56, height: 56, borderRadius: 999, objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: 'var(--color-bg-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={24} color="var(--color-text-muted)" />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{user.email}</div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-primary)',
                textTransform: 'capitalize',
                marginTop: 4,
              }}
            >
              {user.role?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-danger)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  )
}
