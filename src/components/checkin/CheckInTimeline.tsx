import React, { useEffect, useState } from 'react'
import { checkInService, type CheckIn } from '@/services/checkin.service'

export default function CheckInTimeline() {
  const [items, setItems] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    async function load() {
      setLoading(true)
      try { setItems(await checkInService.getHistory(30)) } finally { setLoading(false) }
    }
    void load()
  }, [])
  if (loading) return <p className="text-sm text-gray-500">Loading…</p>
  if (!items.length) return <p className="text-sm text-gray-500">No recent check-ins.</p>
  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <li key={c.id} className="rounded border bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{(c.createdAt as any)?.toDate?.()?.toLocaleString?.() || ''}</p>
              <p className="text-sm text-gray-600">{c.location ? `${c.location.lat.toFixed(3)}, ${c.location.lng.toFixed(3)}` : 'No location'}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{c.status}</span>
          </div>
          {c.note && <p className="text-sm mt-2">{c.note}</p>}
        </li>
      ))}
    </ul>
  )
}

