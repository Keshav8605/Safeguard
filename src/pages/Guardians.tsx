import React from 'react'
import GuardianList from '@/components/guardians/GuardianList'

export default function Guardians() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Guardians</h1>
      <GuardianList />
    </div>
  )
}

