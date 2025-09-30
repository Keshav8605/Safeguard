import React from 'react'

const CONTACTS = [
  { label: 'Police', number: '100' },
  { label: 'Ambulance', number: '102' },
  { label: 'Women Helpline', number: '1091' },
]

export default function ContactSheet() {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold mb-2">Emergency Contacts</h3>
      <ul className="space-y-2">
        {CONTACTS.map((c) => (
          <li key={c.label} className="flex items-center justify-between">
            <span>{c.label}</span>
            <a href={`tel:${c.number}`} className="h-9 px-3 rounded bg-black text-white">Call {c.number}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

