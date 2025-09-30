import React from 'react'
import type { EmergencyContact } from '@/types/firebase.types'

export default function GuardianCard({ g, onVerify, onResend, onEdit, onDelete }: {
  g: EmergencyContact
  onVerify: (id: string) => void
  onResend: (id: string) => void
  onEdit: (g: EmergencyContact) => void
  onDelete: (id: string) => void
}) {
  const priorityColor = g.priority === 1 ? 'bg-red-100 text-red-700' : g.priority === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <img src={g.photoUrl || 'https://via.placeholder.com/48'} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{g.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded ${priorityColor}`}>{g.priority === 1 ? 'Primary' : g.priority === 2 ? 'Secondary' : 'Tertiary'}</span>
          </div>
          <p className="text-sm text-gray-600">{g.relationship || '—'} • {g.phoneNumber}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${g.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{g.verified ? 'Verified' : 'Pending'}</span>
      </div>
      <div className="flex gap-2">
        {!g.verified && <button onClick={() => onVerify(g.id)} className="h-9 px-3 rounded border">Verify</button>}
        {!g.verified && <button onClick={() => onResend(g.id)} className="h-9 px-3 rounded border">Resend</button>}
        <a href={`tel:${g.phoneNumber}`} className="h-9 px-3 rounded border">Call</a>
        <a href={`sms:${g.phoneNumber}`} className="h-9 px-3 rounded border">Message</a>
        <button onClick={() => onEdit(g)} className="h-9 px-3 rounded border">Edit</button>
        <button onClick={() => onDelete(g.id)} className="h-9 px-3 rounded border text-red-600">Delete</button>
      </div>
    </div>
  )
}

