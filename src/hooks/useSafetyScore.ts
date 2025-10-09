import { useEffect, useState } from 'react'
import { SafetyDataService, type SafetyScore } from '@/services/safety-scoring'

export function useSafetyScore(lat: number | null, lng: number | null) {
  const [score, setScore] = useState<SafetyScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lat == null || lng == null) return
    let mounted = true
    async function run() {
      setLoading(true); setError(null)
      try {
        const res = await SafetyDataService.getOrCalculateScore({ lat: lat as number, lng: lng as number }, new Date())
        if (mounted) setScore(res)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load safety score')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    const t = setInterval(run, 60 * 60 * 1000)
    return () => { mounted = false; clearInterval(t) }
  }, [lat, lng])

  return { score, loading, error }
}

