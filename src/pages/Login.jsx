import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { ClipboardCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSuccess = async (credentialResponse) => {
    setLoading(true)
    try {
      await login(credentialResponse.credential)
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: `linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-elevated) 100%)`,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <ClipboardCheck size={32} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)' }}>Quality Audit</h1>
          <p style={{ marginTop: 4, fontSize: 14, color: 'var(--color-text-muted)' }}>
            Sign in with your company account
          </p>
        </div>

        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {loading ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 14, padding: '12px 0' }}>
              Signing in…
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => toast.error('Google sign-in failed')}
              useOneTap
              size="large"
              width="300"
            />
          )}
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Use your <strong>@creativepan.com.eg</strong> account
          </p>
        </div>
      </div>
    </div>
  )
}
