import { useEffect, useRef } from 'react'

export function useShakeDetection(enabled: boolean, onTrigger: () => void, sensitivity: number = 18) {
  const last = useRef<{ x: number; y: number; z: number; t: number } | null>(null)

  useEffect(() => {
    if (!enabled) return
    function handler(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const x = acc.x || 0, y = acc.y || 0, z = acc.z || 0
      const t = Date.now()
      const l = last.current
      if (l) {
        const speed = Math.abs(x + y + z - l.x - l.y - l.z) / (t - l.t) * 10000
        if (speed > sensitivity) onTrigger()
      }
      last.current = { x, y, z, t }
    }
    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [enabled, onTrigger, sensitivity])
}

