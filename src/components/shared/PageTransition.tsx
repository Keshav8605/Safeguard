import React from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="anim-fade-in">
      {children}
    </div>
  )
}

