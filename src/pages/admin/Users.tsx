import React, { useEffect, useState } from 'react'
import { db } from '@/config/firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

export default function AdminUsers() {
  const [items, setItems] = useState<any[]>([])
  const [qtext, setQtext] = useState('')
  useEffect(() => { void load() }, [])
  async function load() {
    // Placeholder: expecting users base profile stored in users/{uid}
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
    setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  }
  const filtered = items.filter((u) => (u.displayName || '').toLowerCase().includes(qtext.toLowerCase()) || (u.email || '').toLowerCase().includes(qtext.toLowerCase()))
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input value={qtext} onChange={(e) => setQtext(e.target.value)} placeholder="Search name/email" className="h-10 border rounded px-3" />
        <button onClick={load} className="h-10 px-3 rounded border">Refresh</button>
      </div>
      <div className="rounded border bg-white p-4 shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}><td>{u.displayName || '—'}</td><td>{u.email || '—'}</td><td>{u.createdAt?.toDate?.()?.toLocaleString?.() || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

