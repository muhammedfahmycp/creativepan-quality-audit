import React from 'react'

const config = {
  not_started:    { label: 'Not Started',      cls: 'bg-gray-700 text-gray-300' },
  in_progress:    { label: 'In Progress',      cls: 'bg-blue-900 text-blue-300' },
  submitted:      { label: 'Submitted',         cls: 'bg-amber-900 text-amber-300' },
  edit_requested: { label: 'Edit Requested',   cls: 'bg-orange-900 text-orange-300' },
  approved:       { label: 'Approved',          cls: 'bg-green-900 text-green-300' },
}

export default function StatusBadge({ status, className = '' }) {
  const { label, cls } = config[status] || config.not_started
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {label}
    </span>
  )
}
