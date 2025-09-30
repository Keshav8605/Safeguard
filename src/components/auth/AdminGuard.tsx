import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/config/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Navigate } from 'react-router-dom'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  useEffect(() => { void check() }, [currentUser])
  async function check() {
    if (!currentUser) { setAllowed(false); setLoading(false); return }
    const s = await getDoc(doc(db, 'admins', currentUser.uid))
    setAllowed(s.exists())
    setLoading(false)
  }
  if (loading) return <div className="p-6">Checking admin access…</div>
  if (!allowed) return <Navigate to="/" />
  return <>{children}</>
}

