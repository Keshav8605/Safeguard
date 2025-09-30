import React, { useEffect, useState } from 'react'
import { notificationService } from '@/services/notification.service'
import { auth, db } from '@/config/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function Settings() {
  const [prefs, setPrefs] = useState<any>({
    emergency: true,
    checkins: true,
    community: true,
    tips: false,
    emailDigest: true,
    quietHours: { start: '22:00', end: '07:00' },
  })
  useEffect(() => { void load() }, [])
  async function load() {
    const user = auth.currentUser; if (!user) return
    const s = await getDoc(doc(db, 'users', user.uid, 'settings', 'notifications'))
    if (s.exists()) setPrefs({ ...prefs, ...(s.data()?.prefs || {}) })
  }
  async function save() { await notificationService.updatePrefs(prefs) }
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="rounded border bg-white p-4 shadow-sm space-y-3">
        <h2 className="font-semibold">Notifications</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prefs.emergency} onChange={(e) => setPrefs({ ...prefs, emergency: e.target.checked })} /> Emergency alerts (always on)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prefs.checkins} onChange={(e) => setPrefs({ ...prefs, checkins: e.target.checked })} /> Check-in reminders</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prefs.community} onChange={(e) => setPrefs({ ...prefs, community: e.target.checked })} /> Community alerts</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prefs.tips} onChange={(e) => setPrefs({ ...prefs, tips: e.target.checked })} /> Safety tips</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prefs.emailDigest} onChange={(e) => setPrefs({ ...prefs, emailDigest: e.target.checked })} /> Email digest</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Quiet hours start</label>
            <input type="time" value={prefs.quietHours.start} onChange={(e) => setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, start: e.target.value } })} className="mt-1 w-full h-11 border rounded px-3" />
          </div>
          <div>
            <label className="block text-sm">Quiet hours end</label>
            <input type="time" value={prefs.quietHours.end} onChange={(e) => setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, end: e.target.value } })} className="mt-1 w-full h-11 border rounded px-3" />
          </div>
        </div>
        <button onClick={save} className="h-10 px-4 rounded bg-black text-white">Save</button>
      </div>
    </div>
  )
}

