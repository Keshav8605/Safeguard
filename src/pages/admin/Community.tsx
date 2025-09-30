import React, { useEffect, useState } from 'react'
import { db } from '@/config/firebase'
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore'

export default function AdminCommunity() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [tips, setTips] = useState<any[]>([])
  useEffect(() => { void load() }, [])
  async function load() {
    const a = await getDocs(query(collection(db, 'community_alerts'), orderBy('createdAt', 'desc'), limit(50)))
    const t = await getDocs(query(collection(db, 'safety_tips'), orderBy('createdAt', 'desc'), limit(50)))
    setAlerts(a.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    setTips(t.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  }
  return (
    <div className="space-y-4">
      <div className="rounded border bg-white p-4 shadow-sm">
        <h3 className="font-semibold mb-2">Alerts</h3>
        <ul className="space-y-1">{alerts.map((x) => <li key={x.id} className="text-sm">{x.type}: {x.title}</li>)}</ul>
      </div>
      <div className="rounded border bg-white p-4 shadow-sm">
        <h3 className="font-semibold mb-2">Safety Tips</h3>
        <ul className="space-y-1">{tips.map((x) => <li key={x.id} className="text-sm">{x.title}</li>)}</ul>
      </div>
    </div>
  )
}

