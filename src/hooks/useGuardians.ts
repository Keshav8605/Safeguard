import { useEffect, useState } from 'react'
import { guardianService } from '@/services/guardian.service'
import type { EmergencyContact } from '@/types/firebase.types'

export function useGuardians() {
  const [guardians, setGuardians] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await guardianService.getGuardians()
      setGuardians(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load guardians')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  return { guardians, loading, error, refresh }
}

