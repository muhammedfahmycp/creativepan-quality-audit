import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, ChevronRight, Play, RotateCcw } from 'lucide-react'
import api from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import Spinner from '../components/ui/Spinner'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function BranchListPage() {
  const { brandId, month } = useParams()
  const navigate = useNavigate()
  const { user, isAuditor } = useAuth()
  const toast = useToast()

  const [brand, setBrand] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null) // branchId being started
  const [confirmStart, setConfirmStart] = useState(null) // { branchId, branchName }

  const monthLabel = (() => {
    const [y, m] = month.split('-')
    return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`
  })()

  const load = useCallback(async () => {
    try {
      const [brandsData, branchData] = await Promise.all([
        api.getBrands(),
        api.getBrandBranches(brandId, month),
      ])
      const found = brandsData.brands?.find(b => b.id === brandId)
      setBrand(found)
      setBranches(branchData.branches || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [brandId, month])

  useEffect(() => { load() }, [load])

  const handleStart = async (branchId, branchName) => {
    setConfirmStart({ branchId, branchName })
  }

  const confirmStartAudit = async () => {
    const { branchId: bid } = confirmStart
    setConfirmStart(null)
    setStarting(bid)
    try {
      const data = await api.startAudit(bid, brandId, month)
      navigate(`/audits/${data.audit.id}`)
    } catch (err) {
      if (err.message.includes('already exists')) {
        toast.error('An audit already exists for this branch and month')
        load()
      } else {
        toast.error(err.message)
      }
    } finally {
      setStarting(null)
    }
  }

  const handleBranchClick = (branch) => {
    if (!branch.audit) return // not started — button handles it
    navigate(`/audits/${branch.audit.id}`)
  }

  if (loading) return <div className="flex justify-center pt-20"><Spinner /></div>

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-white">{brand?.name}</h1>
          <p className="text-xs text-gray-500">{monthLabel}</p>
        </div>
      </div>

      {/* Branch cards */}
      <div className="p-4 flex flex-col gap-3">
        {branches.length === 0 && (
          <div className="text-center text-gray-500 py-16 text-sm">
            No branches assigned to this brand yet.<br />
            <span className="text-gray-600">Go to Settings → Branches to add them.</span>
          </div>
        )}

        {branches.map(branch => {
          const audit = branch.audit
          const status = branch.status
          const isOwn = audit?.auditor_id === user?.id
          const canContinue = audit && isOwn && ['in_progress', 'edit_requested'].includes(status)
          const isLocked = audit && !isOwn && status === 'in_progress'

          return (
            <div
              key={branch.branch_id}
              onClick={() => audit && !isLocked && handleBranchClick(branch)}
              className={`bg-gray-900 border border-gray-800 rounded-xl p-4 transition-all ${
                audit && !isLocked ? 'cursor-pointer hover:border-gray-600 active:scale-[0.99]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm">{branch.branch_name}</h3>

                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <StatusBadge status={status} />

                    {audit?.auditor_name && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <User size={12} />
                        {audit.auditor_name}
                        {isOwn && <span className="text-amber-400">(you)</span>}
                      </span>
                    )}

                    {audit?.started_at && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {formatDate(audit.started_at)}
                      </span>
                    )}
                  </div>

                  {audit?.score_percentage != null && status === 'approved' && (
                    <div className="mt-2 text-xs font-medium" style={{ color: brand?.color }}>
                      Score: {audit.score_percentage}%
                    </div>
                  )}

                  {status === 'edit_requested' && isOwn && (
                    <div className="mt-2 text-xs text-orange-400">
                      Edit requested — tap to view feedback
                    </div>
                  )}

                  {isLocked && (
                    <div className="mt-2 text-xs text-gray-600">
                      Locked — being audited by {audit.auditor_name}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="shrink-0">
                  {!audit && isAuditor && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStart(branch.branch_id, branch.branch_name) }}
                      disabled={starting === branch.branch_id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-gray-900 transition-colors disabled:opacity-50"
                    >
                      <Play size={12} />
                      Start
                    </button>
                  )}

                  {canContinue && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/audits/${audit.id}`) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                      <RotateCcw size={12} />
                      Continue
                    </button>
                  )}

                  {(audit && !isLocked) && (
                    <ChevronRight size={18} className="text-gray-600 mt-0.5" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={!!confirmStart}
        onClose={() => setConfirmStart(null)}
        onConfirm={confirmStartAudit}
        title="Start Audit"
        message={`Start a new audit for ${confirmStart?.branchName} for ${monthLabel}? This will claim this branch for you.`}
        confirmLabel="Start Audit"
      />
    </div>
  )
}
