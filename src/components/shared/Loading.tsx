import React from 'react'

export default function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="p-6 text-center text-gray-600">
      {label}
    </div>
  )
}

