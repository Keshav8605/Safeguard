import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { guardianService } from '@/services/guardian.service'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  relationship: z.enum(['Family', 'Friend', 'Colleague', 'Other']),
  priority: z.enum(['Primary', 'Secondary', 'Tertiary']),
  phone: z.string().min(8),
})

type Values = z.infer<typeof schema>

export default function AddGuardian({ onAdded }: { onAdded?: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { relationship: 'Family', priority: 'Primary' } })
  const [dial, setDial] = useState('+1')
  const [photo, setPhoto] = useState<File | undefined>()
  const phoneRaw = watch('phone') || ''
  const fullPhone = useMemo(() => `${dial}${phoneRaw.replace(/\D/g, '')}`, [dial, phoneRaw])

  async function onSubmit(values: Values) {
    try {
      await guardianService.addGuardian({
        name: values.name,
        phoneNumber: fullPhone,
        email: values.email || undefined,
        relationship: values.relationship,
        priority: values.priority === 'Primary' ? 1 : values.priority === 'Secondary' ? 2 : 3,
        verified: false,
      } as any, photo)
      toast.success('Guardian added. Verification sent.')
      reset()
      setPhoto(undefined)
      onAdded?.()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add guardian')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm">Full name</label>
        <input {...register('name')} className="mt-1 w-full h-11 border rounded px-3" />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div className="flex gap-2">
        <div>
          <label className="block text-sm">Code</label>
          <select value={dial} onChange={(e) => setDial(e.target.value)} className="mt-1 h-11 border rounded px-2">
            <option value="+1">+1</option>
            <option value="+44">+44</option>
            <option value="+91">+91</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm">Phone</label>
          <input {...register('phone')} className="mt-1 w-full h-11 border rounded px-3" />
        {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm">Relationship</label>
        <select {...register('relationship')} className="mt-1 w-full h-11 border rounded px-2">
          <option>Family</option>
          <option>Friend</option>
          <option>Colleague</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm">Priority</label>
        <select {...register('priority')} className="mt-1 w-full h-11 border rounded px-2">
          <option>Primary</option>
          <option>Secondary</option>
          <option>Tertiary</option>
        </select>
      </div>
      <div>
        <label className="block text-sm">Email (optional)</label>
        <input {...register('email')} className="mt-1 w-full h-11 border rounded px-3" />
      </div>
      <div>
        <label className="block text-sm">Photo (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0])} className="mt-1 w-full" />
      </div>
      <button disabled={isSubmitting} className="h-11 w-full rounded bg-black text-white">{isSubmitting ? 'Adding…' : 'Add Guardian'}</button>
    </form>
  )
}

