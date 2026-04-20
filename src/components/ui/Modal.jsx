import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, maxWidth = 480 }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(26, 29, 46, 0.55)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="animate-slide-up"
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{title}</h2>
            <button onClick={onClose} style={{ color: 'var(--color-text-muted)', padding: 4 }} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1, padding: 18 }}>{children}</div>
      </div>
    </div>
  )
}
