import React from 'react'

const config = {
  not_started:     { label: 'Not started',     bg: 'var(--color-bg-hover)', fg: 'var(--color-text-muted)' },
  in_progress:     { label: 'In progress',     bg: '#DBEAFE', fg: '#1E3A8A' },
  submitted:       { label: 'Submitted',       bg: '#FEF3C7', fg: '#92400E' },
  edits_requested: { label: 'Edits requested', bg: '#FFEDD5', fg: '#9A3412' },
  approved:        { label: 'Approved',        bg: '#DCFCE7', fg: '#166534' },
}

export default function StatusBadge({ status }) {
  const c = config[status] || config.not_started
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        background: c.bg,
        color: c.fg,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  )
}
