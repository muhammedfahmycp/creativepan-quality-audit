import React from 'react'
import Modal from './Modal'

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 700,
            color: '#FFFFFF',
            background: danger ? 'var(--color-danger)' : 'var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
