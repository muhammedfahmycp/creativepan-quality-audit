import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
  }

  const icons = { success: CheckCircle, error: XCircle, info: AlertCircle }
  const colorFor = {
    success: { bg: '#DCFCE7', fg: '#166534', border: '#BBF7D0' },
    error:   { bg: '#FEE2E2', fg: '#991B1B', border: '#FECACA' },
    info:    { bg: '#E0E7FF', fg: '#312E81', border: '#C7D2FE' },
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 420,
          width: 'calc(100% - 32px)',
        }}
      >
        {toasts.map((t) => {
          const Icon = icons[t.type]
          const c = colorFor[t.type]
          return (
            <div
              key={t.id}
              className="animate-slide-up"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                background: c.bg,
                color: c.fg,
                border: `1px solid ${c.border}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                fontSize: 14,
                lineHeight: 1.4,
              }}
            >
              <Icon size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
                style={{ color: 'inherit', padding: 2 }}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
