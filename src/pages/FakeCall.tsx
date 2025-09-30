import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFakeCallStore } from '@/store/fakecall.store'

function useTimer(active: boolean, startedAt: number | null) {
  const [now, setNow] = useState<number>(Date.now())
  useEffect(() => { if (!active) return; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t) }, [active])
  const seconds = useMemo(() => startedAt ? Math.floor((now - startedAt) / 1000) : 0, [now, startedAt])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0'); const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function FakeCallPage() {
  const { incoming, active, caller, triggerIncoming, answer, end, startedAt } = useFakeCallStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timer = useTimer(active, startedAt)

  useEffect(() => { if (incoming) try { audioRef.current?.play() } catch {} }, [incoming])

  useEffect(() => {
    // keyboard shortcut Ctrl+Shift+C
    function onKey(e: KeyboardEvent) { if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') triggerIncoming() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [triggerIncoming])

  return (
    <div className="fixed inset-0 z-50 bg-black text-white">
      <audio ref={audioRef} src="/ringtone.mp3" loop />
      {!incoming && !active && (
        <div className="h-full grid place-items-center">
          <button onClick={triggerIncoming} className="h-12 px-6 rounded bg-white text-black">Simulate Incoming Call</button>
        </div>
      )}

      {incoming && (
        <div className="h-full flex flex-col items-center justify-center gap-6">
          <img src={caller.photoUrl || 'https://via.placeholder.com/96'} alt="caller" className="w-24 h-24 rounded-full object-cover" />
          <div className="text-center">
            <div className="text-xl font-semibold">{caller.name}</div>
            <div className="text-sm text-gray-300">{caller.phone}</div>
          </div>
          <div className="flex gap-10 mt-6">
            <button onClick={end} className="w-16 h-16 rounded-full bg-red-600" aria-label="Decline" />
            <button onClick={answer} className="w-16 h-16 rounded-full bg-green-600" aria-label="Answer" />
          </div>
        </div>
      )}

      {active && (
        <div className="h-full flex flex-col items-center justify-center gap-6">
          <img src={caller.photoUrl || 'https://via.placeholder.com/96'} alt="caller" className="w-24 h-24 rounded-full object-cover" />
          <div className="text-center">
            <div className="text-xl font-semibold">{caller.name}</div>
            <div className="text-sm text-gray-300">{caller.phone}</div>
            <div className="text-sm text-gray-300 mt-2">{timer}</div>
          </div>
          <div className="flex gap-3">
            <button className="h-10 px-4 rounded border">Mute</button>
            <button className="h-10 px-4 rounded border">Speaker</button>
          </div>
          <button onClick={end} className="w-16 h-16 rounded-full bg-red-600" aria-label="End call" />
        </div>
      )}
    </div>
  )
}

