import React from 'react'
import CheckInButton from '@/components/checkin/CheckInButton'
import CheckInTimeline from '@/components/checkin/CheckInTimeline'

export default function CheckInPage() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Safety Check-ins</h1>
      <CheckInButton />
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Recent Check-ins</h2>
        <CheckInTimeline />
      </div>
    </div>
  )
}

