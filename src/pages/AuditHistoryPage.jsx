import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Building2 } from 'lucide-react'
import api from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AuditHistoryPage() {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    api.getAuditorHistory()
      .then(d => setAudits(d.audits || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Group by month
  const grouped = {}
  for (const a of audits) {
    if (!grouped[a.month]) grouped[a.month] = []
    grouped[a.month].push(a)
  }
  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (loading) return <div className="flex justify-center pt-20"><Spinner /></div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold text-white mb-6">My Audit History</h1>

      {audits.length === 0 && (
        <div className="text-center text-gray-500 py-16">No audits conducted yet.</div>
      )}

      {sortedMonths.map(month => (
        <div key={month} className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{month}</h2>
          <div className="flex flex-col gap-2">
            {grouped[month].map(audit => (
              <button
                key={audit.id}
                onClick={() => navigate(`/audits/${audit.id}`)}
                className="w-full bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 text-left transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{audit.branches?.name}</span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: audit.qa_brands?.color }} />
                      <span className="text-xs text-gray-500">{audit.qa_brands?.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(audit.started_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={audit.status} />
                    {audit.score_percentage != null && audit.status === 'approved' && (
                      <span className="text-xs font-semibold text-amber-400">{audit.score_percentage}%</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
