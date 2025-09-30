import React, { useState } from 'react'
import { authService } from '@/services/auth.service'
import toast from 'react-hot-toast'

export default function Reset() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.resetPassword(email)
      toast.success('Password reset email sent')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button disabled={loading} className="w-full bg-black text-white p-2 rounded">{loading ? 'Sending…' : 'Send reset link'}</button>
        <a href="/login" className="text-sm text-blue-600">Back to login</a>
      </form>
    </div>
  )
}

