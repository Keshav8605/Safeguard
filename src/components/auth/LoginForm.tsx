import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '@/services/auth.service'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  remember: z.boolean().optional(),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { remember: true } })
  const [phone, setPhone] = useState('')
  const [dial, setDial] = useState('+1')
  const [loadingPhone, setLoadingPhone] = useState(false)

  const fullPhone = useMemo(() => `${dial}${phone.replace(/\D/g, '')}`, [dial, phone])

  async function onSubmit(values: LoginValues) {
    try {
      if (values.remember) await authService.setAuthPersistence(true)
      await authService.signInWithEmail(values.email, values.password)
      toast.success('Welcome back!')
      onSuccess?.()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to login')
    }
  }

  async function onGoogle() {
    try {
      await authService.signInWithGoogle()
      toast.success('Signed in with Google')
      onSuccess?.()
    } catch (e: any) {
      toast.error(e?.message || 'Google sign-in failed')
    }
  }

  useEffect(() => { /* placeholder for recaptcha mount if needed */ }, [])

  async function onPhoneLogin() {
    setLoadingPhone(true)
    try {
      const verifier = await authService.initRecaptcha('recaptcha-container')
      const confirmation = await authService.signInWithPhone(fullPhone, verifier)
      // This should be followed by OTP verification UI; emit event upward if needed
      toast.success('OTP sent to your phone')
      ;(window as any)._phoneConfirmation = confirmation
    } catch (e: any) {
      toast.error(e?.message || 'Phone sign-in failed')
    } finally {
      setLoadingPhone(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Login form">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input aria-invalid={!!errors.email} {...register('email')} className="mt-1 w-full border rounded px-3 h-11 focus:outline-none focus:ring" placeholder="you@example.com" />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input aria-invalid={!!errors.password} type="password" {...register('password')} className="mt-1 w-full border rounded px-3 h-11 focus:outline-none focus:ring" placeholder="••••••••" />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('remember')} className="h-4 w-4" /> Remember me
          </label>
          <a href="/reset" className="text-sm text-blue-600">Forgot password?</a>
        </div>
        <button disabled={isSubmitting} className="w-full h-12 rounded bg-black text-white font-semibold shadow">{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
        <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button onClick={onGoogle} className="h-12 rounded border font-medium">Google</button>
        <div className="flex gap-2">
          <select aria-label="Country code" value={dial} onChange={(e) => setDial(e.target.value)} className="h-12 border rounded px-2">
            <option value="+1">+1</option>
            <option value="+44">+44</option>
            <option value="+91">+91</option>
          </select>
          <input aria-label="Phone number" inputMode="numeric" className="flex-1 h-12 border rounded px-3" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button onClick={onPhoneLogin} disabled={loadingPhone} className="h-12 px-4 rounded bg-black text-white">{loadingPhone ? 'Sending…' : 'Send OTP'}</button>
        </div>
      </div>

      <div id="recaptcha-container" />

      <p className="text-sm">Don't have an account? <a href="/signup" className="text-blue-600">Sign up</a></p>
    </motion.div>
  )
}

