import React, { useEffect, useState } from 'react'
import AudioRecorder from '@/components/evidence/AudioRecorder'
import { auth, db } from '@/config/firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

export default function EvidencePage() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => { void load() }, [])
  async function load() {
    const user = auth.currentUser; if (!user) return
    const snap = await getDocs(query(collection(db, 'users', user.uid, 'evidence'), orderBy('createdAt', 'desc')))
    setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  }
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Evidence Vault</h1>
      <AudioRecorder />
      <div className="rounded border bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Your Evidence</h2>
        {!items.length ? <p className="text-sm text-gray-500">No evidence yet.</p> : (
          <ul className="space-y-2">
            {items.map((e) => (
              <li key={e.id} className="flex items-center justify-between">
                <span className="text-sm">{e.type} • {(e.createdAt as any)?.toDate?.()?.toLocaleString?.() || ''}</span>
                {e.url && <a href={e.url} target="_blank" className="text-sm text-blue-600">Open</a>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

