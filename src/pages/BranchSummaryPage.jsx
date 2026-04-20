import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import StatusBadge from '../components/ui/StatusBadge'
import { useToast } from '../context/ToastContext'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function BranchSummaryPage() {
  const { branchId } = useParams()
  const toast = useToast()
  const [branch, setBranch] = useState(null)
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getAllBranches(),
      api.getAudits(),
    ])
      .then(([b, a]) => {
        setBranch((b.branches || []).find((x) => x.id === branchId) || null)
        setAudits((a.audits || []).filter((x) => x.branch_id === branchId))
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [branchId])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>

  const year = new Date().getFullYear()
  const monthRows = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const month = `${year}-${mm}`
    const audit = audits.find((a) => a.month === month)
    return { index: i, month, audit }
  })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={16} /> Back
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{branch?.name || 'Branch'}</h1>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>{year} history</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {monthRows.map((r) => (
          r.audit ? (
            <Link
              key={r.month}
              to={`/audits/${r.audit.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ width: 44, fontSize: 13, fontWeight: 700 }}>{MONTH_NAMES[r.index]}</div>
              <StatusBadge status={r.audit.status} />
              <div style={{ flex: 1 }} />
              {r.audit.score_percentage != null && r.audit.status !== 'in_progress' && (
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {Number(r.audit.score_percentage).toFixed(1)}%
                </span>
              )}
            </Link>
          ) : (
            <div
              key={r.month}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: 'var(--color-bg-elevated)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-muted)',
                fontSize: 13,
              }}
            >
              <div style={{ width: 44, fontWeight: 700 }}>{MONTH_NAMES[r.index]}</div>
              <span>No audit</span>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
