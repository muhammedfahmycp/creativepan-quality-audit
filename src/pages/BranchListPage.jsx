import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Play, ChevronRight, RotateCcw } from 'lucide-react'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function statusPillStyle(status) {
  const map = {
    not_started:     { bg: 'var(--color-bg-hover)',     fg: 'var(--color-text-muted)',    label: 'Not started' },
    in_progress:     { bg: '#DBEAFE', fg: '#1E3A8A', label: 'In progress' },
    submitted:       { bg: '#FEF3C7', fg: '#92400E', label: 'Submitted' },
    edits_requested: { bg: '#FFEDD5', fg: '#9A3412', label: 'Edits requested' },
    approved:        { bg: '#DCFCE7', fg: '#166534', label: 'Approved' },
  }
  return map[status] || map.not_started
}

export default function BranchListPage() {
  const { brandId, month } = useParams()
  const navigate = useNavigate()
  const { isAuditor, user } = useAuth()
  const toast = useToast()

  const [brand, setBrand] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [brandsResp, branchResp] = await Promise.all([
        api.getBrands(),
        api.getBrandBranches(brandId, month),
      ])
      setBrand(brandsResp.brands.find((b) => b.id === brandId) || null)
      setBranches(branchResp.branches || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [brandId, month, toast])

  useEffect(() => { load() }, [load])

  async function startOrOpen(branch) {
    if (branch.audit) {
      navigate(`/audits/${branch.audit.id}`)
      return
    }
    if (!isAuditor) {
      toast.error('Only auditors can start audits')
      return
    }
    setStartingId(branch.id)
    try {
      const resp = await api.startAudit(branch.id, brandId, month)
      navigate(`/audits/${resp.audit.id}`)
    } catch (err) {
      toast.error(err.message)
      setStartingId(null)
    }
  }

  const [year, m] = month.split('-')
  const monthLabel = `${MONTHS[parseInt(m, 10) - 1]} ${year}`

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 16 }}>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--color-text-muted)',
          fontSize: 13,
          textDecoration: 'none',
          marginBottom: 12,
        }}
      >
        <ArrowLeft size={16} /> Back
      </Link>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        {brand && (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: brand.color,
              display: 'inline-block',
            }}
          />
        )}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>
          {brand?.name || '…'}
        </h1>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        {monthLabel}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Spinner size={28} />
        </div>
      ) : branches.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 16px',
            color: 'var(--color-text-muted)',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          No branches assigned to this brand yet.
          <br />
          <span style={{ fontSize: 13 }}>Assign branches in Settings → Branches.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {branches.map((b) => {
            const status = b.audit?.status || 'not_started'
            const pill = statusPillStyle(status)
            const isMine = b.audit && b.audit.auditor_id === user?.id
            const isLocked = b.audit && !isMine && ['in_progress', 'edits_requested'].includes(status)
            return (
              <button
                key={b.id}
                onClick={() => !isLocked && startOrOpen(b)}
                disabled={isLocked || startingId === b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'left',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.55 : 1,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
                    {b.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 6,
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span
                      style={{
                        padding: '3px 8px',
                        background: pill.bg,
                        color: pill.fg,
                        borderRadius: 999,
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    >
                      {pill.label}
                    </span>
                    {b.audit?.score_percentage != null && (
                      <span className="font-mono">{Number(b.audit.score_percentage).toFixed(1)}%</span>
                    )}
                    {b.audit?.auditor_name && (
                      <span>· {b.audit.auditor_name}</span>
                    )}
                  </div>
                </div>
                <div style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {startingId === b.id ? (
                    <Spinner size={18} />
                  ) : b.audit ? (
                    <ChevronRight size={20} />
                  ) : (
                    <>
                      <Play size={16} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Start</span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
