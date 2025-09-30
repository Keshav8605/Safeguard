import React, { useEffect, useState } from 'react'
import { useEmergencyStore } from '@/store/emergency.store'

export default function EmergencyOverlay({ onCancel }: { onCancel: (pin: string) => void }) {
  const { active, endsAt } = useEmergencyStore()
  const [remaining, setRemaining] = useState<number>(0)
  const [pin, setPin] = useState('')

  useEffect(() => {
    const t = setInterval(() => {
      if (!endsAt) return
      setRemaining(Math.max(0, endsAt - Date.now()))
    }, 500)
    return () => clearInterval(t)
  }, [endsAt])

  if (!active) return null
  const mm = Math.floor(remaining / 60000)
  const ss = Math.floor((remaining % 60000) / 1000)

  return (
    <div className="fixed inset-0 z-50 bg-red-700/80 backdrop-blur-sm text-white">
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <h2 className="text-2xl font-extrabold mt-6">Emergency Active</h2>
        <p className="text-sm">Actions sent to guardians. Stay safe — help is on the way.</p>
        <div className="text-lg font-mono">Time remaining: {mm.toString().padStart(2,'0')}:{ss.toString().padStart(2,'0')}</div>
        <div className="space-y-2">
          <label className="block text-sm">Enter PIN to cancel</label>
          <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" className="w-full h-11 rounded px-3 text-black" />
          <button onClick={() => onCancel(pin)} className="h-11 px-4 rounded bg-black text-white">Cancel Emergency</button>
        </div>
        <div>
          <label className="block text-sm mb-1">Actions</label>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li>Location shared</li>
            <li>Guardians notified</li>
            <li>Audio recording</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

