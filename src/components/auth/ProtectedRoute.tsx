import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Loading from '@/components/shared/Loading'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  if (loading) return <Loading label="Checking authentication…" />
  if (!currentUser) return <Navigate to="/login" />
  return <>{children}</>
}

