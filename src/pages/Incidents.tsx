import React, { useEffect, useState } from 'react'
import { incidentService } from '@/services/incident.service'
import { Link } from 'react-router-dom'

export default function Incidents() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void load() }, [])
  async function load() {
    setLoading(true); setError(null)
    try {
      const list = await incidentService.getUserIncidents()
      setItems(list)
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch incidents')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Incidents</h1>
        <Link to="/report-incident" className="h-10 px-4 rounded bg-black text-white">New Report</Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !items.length && <p className="text-sm text-gray-500">No incidents yet.</p>}
      {!!items.length && (
        <ul className="divide-y bg-white border rounded">
          {items.map((i) => (
            <li key={i.id} className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{i.title || i.type}</p>
                <p className="text-xs text-gray-500">{new Date(i.timestamp?.toMillis?.() || i.timestamp || Date.now()).toLocaleString()}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded border">{i.severity || '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

