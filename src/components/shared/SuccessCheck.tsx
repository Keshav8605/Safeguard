import React, { useEffect, useState } from 'react'

export default function SuccessCheck({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { if (show) { setVisible(true); const t = setTimeout(() => setVisible(false), 1500); return () => clearTimeout(t) } }, [show])
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center pointer-events-none">
      <div className="bg-white/90 rounded-full p-6 shadow-xl anim-fade-in">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
    </div>
  )
}

