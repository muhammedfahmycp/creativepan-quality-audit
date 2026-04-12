import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function MonthGrid({ brandId, brandColor }) {
  const navigate = useNavigate()
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = String(i + 1).padStart(2, '0')
    const monthStr = `${currentYear}-${monthNum}`
    const isPast = i < currentMonth
    const isCurrent = i === currentMonth
    const isFuture = i > currentMonth
    return { index: i, monthStr, label: MONTH_NAMES[i], isPast, isCurrent, isFuture }
  })

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-4">
      {months.map(m => (
        <button
          key={m.monthStr}
          onClick={() => navigate(`/brands/${brandId}/${m.monthStr}`)}
          disabled={m.isFuture}
          className={`
            relative rounded-xl p-4 text-center transition-all
            ${m.isFuture
              ? 'opacity-30 cursor-not-allowed bg-gray-900 border border-gray-800'
              : 'bg-gray-900 border border-gray-800 hover:border-gray-600 active:scale-95'
            }
            ${m.isCurrent ? 'ring-2' : ''}
          `}
          style={m.isCurrent ? { ringColor: brandColor, borderColor: brandColor } : {}}
        >
          <span
            className="text-sm font-semibold"
            style={m.isCurrent ? { color: brandColor } : { color: m.isFuture ? '#4b5563' : '#e5e7eb' }}
          >
            {m.label}
          </span>
          {m.isCurrent && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
          )}
        </button>
      ))}
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
      .then(d => setBrands(d.brands || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center pt-20"><Spinner /></div>
  if (!brands.length) return <div className="text-center text-gray-500 pt-20">No brands found</div>

  const active = brands[activeIdx]

  return (
    <div className="flex flex-col min-h-full">
      {/* Brand tab bar */}
      <div className="flex border-b border-gray-800 bg-gray-900 overflow-x-auto">
        {brands.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setActiveIdx(i)}
            className={`px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              i === activeIdx
                ? 'text-white border-current'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
            style={i === activeIdx ? { borderColor: b.color, color: b.color } : {}}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Year label */}
      <div className="px-4 pt-4 pb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{new Date().getFullYear()}</h2>
        <span className="text-xs text-gray-500">Select a month</span>
      </div>

      {/* Month grid */}
      <MonthGrid key={active.id} brandId={active.id} brandColor={active.color} />
    </div>
  )
}
