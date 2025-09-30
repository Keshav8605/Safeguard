import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '@/services/auth.service'
import toast from 'react-hot-toast'

const passwordStrength = (pwd: string) => {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[!@#$%^&*]/.test(pwd)) score++
  return score
}

const schema = z.object({
  fullName: z.string().min(2, 'Name is too short'),
  email: z.string().email(),
  phone: z.string().min(10, 'Enter valid phone'),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  emergencyName: z.string().min(2),
  emergencyPhone: z.string().min(10),
  emergencyRelationship: z.string().optional(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept terms' }) }),
}).refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
})

type Values = z.infer<typeof schema>

export default function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) })
  const pwd = watch('password') || ''
  const strength = useMemo(() => passwordStrength(pwd), [pwd])
  const [dial, setDial] = useState('+1')

  async function onSubmit(values: Values) {
    try {
      await authService.signUpWithEmail(values.email, values.password, values.fullName, {
        phoneNumber: `${dial}${values.phone.replace(/\D/g, '')}`,
        emergencyContact: { name: values.emergencyName, phone: values.emergencyPhone, relationship: values.emergencyRelationship },
      })
      toast.success('Account created! Check your email to verify.')
      onSuccess?.()
    } catch (e: any) {
      toast.error(e?.message || 'Sign up failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Sign up form">
      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input {...register('fullName')} className="mt-1 w-full border rounded px-3 h-11" />
        {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input {...register('email')} className="mt-1 w-full border rounded px-3 h-11" />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
      </div>
      <div className="flex gap-2">
        <div>
          <label className="block text-sm font-medium">Code</label>
          <select value={dial} onChange={(e) => setDial(e.target.value)} className="mt-1 h-11 border rounded px-2">
            <option value="+1">+1</option>
            <option value="+44">+44</option>
            <option value="+91">+91</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium">Phone number</label>
          <input {...register('phone')} className="mt-1 w-full border rounded px-3 h-11" />
          {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input type="password" {...register('password')} className="mt-1 w-full border rounded px-3 h-11" />
        <div className="mt-2 h-2 bg-gray-200 rounded">
          <div className={`h-2 rounded ${strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-yellow-500' : 'bg-green-600'}`} style={{ width: `${(strength/5)*100}%` }} />
        </div>
        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Confirm password</label>
        <input type="password" {...register('confirmPassword')} className="mt-1 w-full border rounded px-3 h-11" />
        {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>
      <fieldset className="border rounded p-3">
        <legend className="px-1 text-sm font-medium">Emergency contact</legend>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm">Name</label>
            <input {...register('emergencyName')} className="mt-1 w-full border rounded px-3 h-11" />
            {errors.emergencyName && <p className="text-red-600 text-sm mt-1">{errors.emergencyName.message}</p>}
          </div>
          <div>
            <label className="block text-sm">Phone</label>
            <input {...register('emergencyPhone')} className="mt-1 w-full border rounded px-3 h-11" />
            {errors.emergencyPhone && <p className="text-red-600 text-sm mt-1">{errors.emergencyPhone.message}</p>}
          </div>
          <div>
            <label className="block text-sm">Relationship</label>
            <input {...register('emergencyRelationship')} className="mt-1 w-full border rounded px-3 h-11" />
          </div>
        </div>
      </fieldset>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('terms')} className="h-4 w-4" /> I agree to the terms
      </label>
      {errors.terms && <p className="text-red-600 text-sm mt-1">{errors.terms.message as string}</p>}
      <button disabled={isSubmitting} className="w-full h-12 rounded bg-black text-white font-semibold">{isSubmitting ? 'Creating…' : 'Create account'}</button>
      <p className="text-sm">Have an account? <a href="/login" className="text-blue-600">Login</a></p>
    </form>
  )
}

