import React from 'react'

export default function Spinner({ size = 20, color = 'var(--color-primary)' }) {
  return (
    <div
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: '2px solid var(--color-border-light)',
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}
