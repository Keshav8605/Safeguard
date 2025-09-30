import React, { useEffect, useMemo, useState } from 'react'
import { guardianService } from '@/services/guardian.service'
import type { EmergencyContact } from '@/types/firebase.types'
import GuardianCard from './GuardianCard'
import AddGuardian from './AddGuardian'
import toast from 'react-hot-toast'

export default function GuardianList() {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<EmergencyContact[]>([])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'priority' | 'name' | 'response'>('priority')

  async function refresh() {
    setLoading(true)
    try {
      const data = await guardianService.getGuardians()
      setList(data)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load guardians')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const filtered = useMemo(() => {
    const f = list.filter((g) => g.name.toLowerCase().includes(q.toLowerCase()) || g.phoneNumber.includes(q))
    if (sort === 'priority') return [...f].sort((a, b) => a.priority - b.priority)
    if (sort === 'name') return [...f].sort((a, b) => a.name.localeCompare(b.name))
    return f // response sorting placeholder
  }, [list, q, sort])

  async function onVerify(id: string) {
    try { await guardianService.verifyGuardian(id, '000000'); toast.success('Verified (demo)'); void refresh() } catch (e: any) { toast.error(e?.message || 'Verify failed') }
  }
  async function onResend(id: string) {
    const g = list.find((x) => x.id === id); if (!g) return
    try { await guardianService.resendVerification(id, g.phoneNumber, g.name); toast('Verification resent') } catch (e: any) { toast.error(e?.message || 'Resend failed') }
  }
  async function onDelete(id: string) {
    if (!confirm('Delete guardian?')) return
    try { await guardianService.deleteGuardian(id); toast.success('Deleted'); setList((cur) => cur.filter((x) => x.id !== id)) } catch (e: any) { toast.error(e?.message || 'Delete failed') }
  }
  function onEdit(_g: EmergencyContact) { toast('Edit not implemented in demo') }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input className="h-11 flex-1 border rounded px-3" placeholder="Search guardians" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="h-11 border rounded px-2" value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="priority">Priority</option>
          <option value="name">Name</option>
          <option value="response">Response Rate</option>
        </select>
      </div>

      <AddGuardian onAdded={refresh} />

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No guardians yet. Add your first guardian above.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <GuardianCard key={g.id} g={g} onVerify={onVerify} onResend={onResend} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

