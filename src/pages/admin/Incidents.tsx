import React, { useEffect, useState } from 'react'
import { db } from '@/config/firebase'
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore'

export default function AdminIncidents() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => { void load() }, [])
  async function load() {
    const snap = await getDocs(query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(100)))
    setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={load} className="h-10 px-3 rounded border">Refresh</button>
      </div>
      <div className="rounded border bg-white p-4 shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Type</th><th>Severity</th><th>Timestamp</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}><td>{i.type}</td><td>{i.severity}</td><td>{i.createdAt?.toDate?.()?.toLocaleString?.() || '—'}</td><td>{i.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

