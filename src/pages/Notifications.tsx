import React, { useEffect, useState } from 'react'
import { auth, db } from '@/config/firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { notificationService } from '@/services/notification.service'

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    const user = auth.currentUser; if (!user) return
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc')))
    setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    setLoading(false)
  }
  useEffect(() => { void load() }, [])

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : items.length === 0 ? <p className="text-sm text-gray-500">No notifications yet.</p> : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className="rounded border bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{n.payload?.title}</div>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{n.channel}</span>
              </div>
              <p className="text-sm text-gray-600">{n.payload?.body}</p>
              <div className="text-xs text-gray-500 mt-1">{n.type} • {(n.createdAt as any)?.toDate?.()?.toLocaleString?.() || ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

