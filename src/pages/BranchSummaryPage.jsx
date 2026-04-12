import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function ScoreBar({ pct }) {
  const color = pct >= 90 ? '#22c55e' : pct >= 75 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium w-10 text-right" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function BranchSummaryPage() {
  const { branchId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))

  useEffect(() => {
    setLoading(true)
    api.getBranchSummary(branchId, year)
      .then(d => setData(d))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [branchId, year])

  // Build all 12 months, filling in nulls for missing
  const monthRows = Array.from({ length: 12 }, (_, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`
    const found = data?.months?.find(m => m.month === monthStr)
    return { monthStr, label: MONTH_NAMES[i], data: found || null }
  })

  const completed = monthRows.filter(r => r.data).length
  const avg = completed > 0
    ? Math.round(monthRows.filter(r => r.data).reduce((s, r) => s + parseFloat(r.data.score_percentage), 0) / completed)
    : null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-white">Branch Annual Summary</h1>
        </div>
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-sm text-white rounded-lg px-2 py-1 focus:outline-none"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20"><Spinner /></div>
      ) : (
        <div className="p-4">
          {avg != null && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{avg}%</div>
              <div className="text-xs text-gray-500 mt-1">Average across {completed} audited month{completed !== 1 ? 's' : ''}</div>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Month</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Awarded</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 w-40">Score</th>
                </tr>
              </thead>
              <tbody>
                {monthRows.map((row, i) => (
                  <tr key={row.monthStr} className={`border-b border-gray-800/50 ${i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'}`}>
                    <td className="px-4 py-3 text-gray-300 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {row.data ? row.data.total_awarded_score : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {row.data ? row.data.total_max_score : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.data
                        ? <ScoreBar pct={parseFloat(row.data.score_percentage)} />
                        : <span className="text-gray-700 text-xs">No audit</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
