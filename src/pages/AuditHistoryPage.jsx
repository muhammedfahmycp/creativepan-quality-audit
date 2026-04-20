import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import StatusBadge from '../components/ui/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Admin / quality-manager view: 5 status buckets for current month.
// Auditor view: 4 status buckets (no "not started") across all their audits.
const ADMIN_STATUSES = ['not_started', 'in_progress', 'submitted', 'edits_requested', 'approved']
const AUDITOR_STATUSES = ['in_progress', 'submitted', 'edits_requested', 'approved']

const STATUS_LABELS = {
  not_started:     'Not started',
  in_progress:     'In progress',
  submitted:       'Submitted for review',
  edits_requested: 'Sent back to editor',
  approved:        'Approved',
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(m) {
  const [y, mm] = m.split('-')
  return `${MONTH_NAMES[parseInt(mm, 10) - 1]} ${y}`
}

function ItemCard({ href, title, subtitle, right, color }) {
  return (
    <Link
      to={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <Building2 size={16} color={color || 'var(--color-text-muted)'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {right}
    </Link>
  )
}

function StatusSection({ status, items, brand, renderItem }) {
  const [open, setOpen] = useState(status !== 'not_started')
  if (items.length === 0) return null
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 2px',
          background: 'transparent',
          textAlign: 'left',
        }}
      >
        {open ? <ChevronDown size={16} color="var(--color-text-muted)" /> : <ChevronRight size={16} color="var(--color-text-muted)" />}
        <StatusBadge status={status} />
        <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-muted)' }}>
          {items.length}
        </span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {items.map((item) => renderItem(item, brand))}
        </div>
      )}
    </div>
  )
}

function BrandSection({ brand, groups, statuses, renderItem, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const totalCount = statuses.reduce((s, st) => s + (groups[st]?.length || 0), 0)
  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          background: 'transparent',
          textAlign: 'left',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 999, background: brand.color }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>
          {brand.name}
        </span>
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {totalCount}
        </span>
        {open ? <ChevronDown size={18} color="var(--color-text-muted)" /> : <ChevronRight size={18} color="var(--color-text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '4px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {statuses.map((st) => (
            <StatusSection
              key={st}
              status={st}
              items={groups[st] || []}
              brand={brand}
              renderItem={renderItem}
            />
          ))}
          {totalCount === 0 && (
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '6px 4px' }}>
              Nothing here.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AuditHistoryPage() {
  const { user, role } = useAuth()
  const isAuditorOnly = role === 'quality_auditor'
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([]) // [{ brand, groups: { status: [items] } }]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isAuditorOnly) {
        // Auditor view: all of my audits across all months, grouped by brand then status
        const [brandsResp, auditsResp] = await Promise.all([
          api.getBrands(),
          api.getAudits({ mine: '1' }),
        ])
        const brands = brandsResp.brands || []
        const audits = auditsResp.audits || []

        // Need branch names — fetch in one call
        const branchResp = await api.getAllBranches()
        const branchMap = new Map((branchResp.branches || []).map((b) => [b.id, b]))

        const byBrand = new Map(brands.map((b) => [b.id, { brand: b, groups: {} }]))
        for (const a of audits) {
          const entry = byBrand.get(a.brand_id)
          if (!entry) continue
          const st = a.status
          if (!entry.groups[st]) entry.groups[st] = []
          entry.groups[st].push({ ...a, branch: branchMap.get(a.branch_id) || null })
        }

        const result = brands
          .map((b) => byBrand.get(b.id))
          .filter((e) => Object.values(e.groups).some((arr) => arr.length > 0))
        setData(result)
      } else {
        // Admin / quality_manager view: current-month status board
        const brandsResp = await api.getBrands()
        const brands = brandsResp.brands || []
        const month = currentMonth()

        const perBrand = await Promise.all(
          brands.map((b) =>
            api.getBrandBranches(b.id, month).then((resp) => ({
              brand: b,
              branches: resp.branches || [],
            }))
          )
        )

        const result = perBrand.map(({ brand, branches }) => {
          const groups = { not_started: [], in_progress: [], submitted: [], edits_requested: [], approved: [] }
          for (const b of branches) {
            if (!b.audit) {
              groups.not_started.push({ id: `nb-${b.id}`, branch: b, month })
            } else {
              const st = b.audit.status
              if (groups[st]) {
                groups[st].push({ ...b.audit, branch: b, month })
              }
            }
          }
          return { brand, groups }
        })
        setData(result)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [isAuditorOnly, toast])

  useEffect(() => { load() }, [load])

  const statuses = isAuditorOnly ? AUDITOR_STATUSES : ADMIN_STATUSES

  // Item renderer for admin view (and auditor — same layout works for both)
  const renderItem = (item, brand) => {
    if (item.id?.startsWith('nb-')) {
      // "Not started" branch (admin only)
      return (
        <ItemCard
          key={item.id}
          href={`/brands/${brand.id}/${item.month}`}
          title={item.branch.name}
          subtitle={formatMonth(item.month)}
          color={brand.color}
        />
      )
    }
    // Real audit
    return (
      <ItemCard
        key={item.id}
        href={`/audits/${item.id}`}
        title={item.branch?.name || 'Branch'}
        subtitle={
          <span>
            {formatMonth(item.month)}
            {item.auditor_name ? ` · ${item.auditor_name}` : ''}
          </span>
        }
        color={brand.color}
        right={
          item.score_percentage != null && item.status !== 'in_progress' ? (
            <span
              className="font-mono"
              style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}
            >
              {Number(item.score_percentage).toFixed(1)}%
            </span>
          ) : null
        }
      />
    )
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        {isAuditorOnly ? 'My audits' : 'Audit status'}
      </h1>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        {isAuditorOnly
          ? 'Your audits grouped by brand and status.'
          : `Current-month status by brand (${formatMonth(currentMonth())}).`}
      </div>

      {data.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: 'var(--color-text-muted)',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          Nothing yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((entry, idx) => (
            <BrandSection
              key={entry.brand.id}
              brand={entry.brand}
              groups={entry.groups}
              statuses={statuses}
              renderItem={renderItem}
              defaultOpen={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
