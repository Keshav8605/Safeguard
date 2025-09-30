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
  const [editing, setEditing] = useState<EmergencyContact | null>(null)
  function onEdit(g: EmergencyContact) { setEditing(g) }

  async function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') || editing.name).trim()
    const email = String(form.get('email') || '').trim()
    const relationship = String(form.get('relationship') || editing.relationship || 'Other') as any
    const priorityLabel = String(form.get('priority') || (editing.priority === 1 ? 'Primary' : editing.priority === 2 ? 'Secondary' : 'Tertiary'))
    const priority = priorityLabel === 'Primary' ? 1 : priorityLabel === 'Secondary' ? 2 : 3
    try {
      await guardianService.updateGuardian(editing.id, { name, email: email || undefined, relationship, priority } as any)
      toast.success('Guardian updated')
      setEditing(null)
      await refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Update failed')
    }
  }

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

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center">
          <div className="w-full max-w-lg bg-white rounded shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Edit guardian</h3>
              <button className="text-sm" onClick={() => setEditing(null)}>Close</button>
            </div>
            <form onSubmit={submitEdit} className="space-y-3">
              <div>
                <label className="block text-sm">Full name</label>
                <input name="name" defaultValue={editing.name} className="mt-1 w-full h-11 border rounded px-3" />
              </div>
              <div>
                <label className="block text-sm">Email</label>
                <input name="email" defaultValue={editing.email || ''} className="mt-1 w-full h-11 border rounded px-3" />
              </div>
              <div>
                <label className="block text-sm">Relationship</label>
                <select name="relationship" defaultValue={editing.relationship || 'Other'} className="mt-1 w-full h-11 border rounded px-2">
                  <option>Family</option>
                  <option>Friend</option>
                  <option>Colleague</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Priority</label>
                <select name="priority" defaultValue={editing.priority === 1 ? 'Primary' : editing.priority === 2 ? 'Secondary' : 'Tertiary'} className="mt-1 w-full h-11 border rounded px-2">
                  <option>Primary</option>
                  <option>Secondary</option>
                  <option>Tertiary</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="h-10 px-4 rounded border" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="h-10 px-4 rounded bg-black text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

