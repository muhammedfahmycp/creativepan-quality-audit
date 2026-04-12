import React from 'react'

export default function Spinner({ size = 6, className = '' }) {
  return (
    <div className={`inline-block w-${size} h-${size} border-2 border-gray-600 border-t-white rounded-full animate-spin ${className}`} />
  )
}
