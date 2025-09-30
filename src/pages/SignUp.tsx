import React from 'react'
import { useNavigate } from 'react-router-dom'
import SignUpForm from '@/components/auth/SignUpForm'

export default function SignUp() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-xl bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Create account</h1>
        <SignUpForm onSuccess={() => navigate('/dashboard')} />
      </div>
    </div>
  )
}

