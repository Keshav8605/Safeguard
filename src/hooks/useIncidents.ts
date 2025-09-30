import { useEffect, useState } from 'react'
import { incidentService } from '@/services/incident.service'
import type { Incident } from '@/types/firebase.types'

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await incidentService.getUserIncidents(50)
      setIncidents(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  return { incidents, loading, error, refresh }
}

