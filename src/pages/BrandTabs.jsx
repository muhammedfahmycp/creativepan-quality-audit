import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function MonthGrid({ brandId, brandColor }) {
  const navigate = useNavigate()
  const now = new Date()
  const year = now.getFullYear()
  const currentMonth = now.getMonth()

  const months = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0')
    return {
      index: i,
      monthStr: `${year}-${mm}`,
      label: MONTH_NAMES[i],
      isCurrent: i === currentMonth,
      isFuture: i > currentMonth,
    }
  })

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 12,
        padding: 16,
      }}
    >
      {months.map((m) => {
        const base = {
          position: 'relative',
          padding: '18px 12px',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-bg-card)',
          border: `1px solid ${m.isCurrent ? brandColor : 'var(--color-border)'}`,
          boxShadow: m.isCurrent ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          color: m.isFuture ? 'var(--color-text-muted)' : 'var(--color-text)',
          opacity: m.isFuture ? 0.4 : 1,
          cursor: m.isFuture ? 'not-allowed' : 'pointer',
          transition: 'transform 0.1s, border-color 0.15s, box-shadow 0.15s',
          fontSize: 14,
          fontWeight: 600,
        }
        return (
          <button
            key={m.monthStr}
            onClick={() => !m.isFuture && navigate(`/brands/${brandId}/${m.monthStr}`)}
            disabled={m.isFuture}
            style={base}
          >
            <span style={m.isCurrent ? { color: brandColor } : undefined}>{m.label}</span>
            {m.isCurrent && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: brandColor,
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function BrandTabs() {
  const [brands, setBrands] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    api.getBrands()
      .then((d) => setBrands(d.brands || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Spinner size={32} />
      </div>
    )
  }
  if (!brands.length) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '80px 16px' }}>
        No brands found
      </div>
    )
  }

  const active = brands[activeIdx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {brands.map((b, i) => {
          const active = i === activeIdx
          return (
            <button
              key={b.id}
              onClick={() => setActiveIdx(i)}
              style={{
                padding: '16px 20px',
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: active ? b.color : 'var(--color-text-muted)',
                borderBottom: `2px solid ${active ? b.color : 'transparent'}`,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {b.name}
            </button>
          )
        })}
      </div>

      <div
        style={{
          padding: '16px 16px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
          {new Date().getFullYear()}
        </h2>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Select a month</span>
      </div>

      <MonthGrid key={active.id} brandId={active.id} brandColor={active.color} />
    </div>
  )
}
