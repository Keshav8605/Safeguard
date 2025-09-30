import React from 'react'

export default function AnimatedCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded border bg-white p-4 shadow-sm card-anim ${className}`}>
      {children}
    </div>
  )
}

