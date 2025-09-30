import React, { useEffect, useState } from 'react'
import { incidentService } from '@/services/incident.service'
import type { Incident } from '@/types/firebase.types'
import toast from 'react-hot-toast'

export default function MyReportsPage() {
  const [items, setItems] = useState<Incident[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try { setItems(await incidentService.listMyReports(100)) } catch (e: any) { toast.error(e?.message || 'Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function onDelete(id: string) {
    if (!confirm('Delete this report?')) return
    try { await incidentService.deleteIncident(id); toast.success('Deleted'); setItems((cur) => cur.filter((x) => x.id !== id)) } catch (e: any) { toast.error(e?.message || 'Delete failed') }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Reports</h1>
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : items.length === 0 ? <p className="text-sm text-gray-500">No reports yet.</p> : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="rounded border bg-white p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{(i as any).title || i.type}</p>
                  <p className="text-sm text-gray-600">{(i as any).timestamp?.toDate?.()?.toLocaleString?.() || ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{i.status}</span>
                  <button onClick={() => onDelete(i.id!)} className="h-8 px-3 rounded border text-red-600">Delete</button>
                </div>
              </div>
              {i.location && <p className="text-sm mt-1 text-gray-600">{(i.location as any).address || `${(i.location as any).coordinates?.latitude?.toFixed?.(3)}, ${(i.location as any).coordinates?.longitude?.toFixed?.(3)}`}</p>}
              {(i as any).description && <p className="text-sm mt-2">{(i as any).description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

