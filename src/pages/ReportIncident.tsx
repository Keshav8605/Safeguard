import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { incidentService } from '@/services/incident.service'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const schema = z.object({
  category: z.enum(['harassment', 'assault', 'stalking', 'suspicious', 'eve_teasing', 'unsafe_area', 'other']),
  subcategory: z.string().optional(),
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.string(),
  time: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  peopleInvolved: z.coerce.number().min(0).max(50).optional(),
  perpetrator: z.string().optional(),
  witnesses: z.enum(['yes', 'no']).optional(),
  policeReported: z.enum(['yes', 'no']).optional(),
  anonymous: z.boolean().default(true),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  address: z.string().optional(),
})

type Values = z.infer<typeof schema>

export default function ReportIncidentPage() {
  const { register, handleSubmit, setValue, watch, getValues, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { severity: 'medium', category: 'harassment', anonymous: true } })
  const [files, setFiles] = useState<File[]>([])
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // load current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setValue('lat', pos.coords.latitude)
        setValue('lng', pos.coords.longitude)
      })
    }
  }, [setValue])

  // load draft if present
  useEffect(() => {
    const draft = incidentService.loadDraft() as any
    if (draft) {
      try {
        if (draft.title) setValue('title', draft.title)
        if (draft.description) setValue('description', draft.description)
        if (draft.severity) setValue('severity', draft.severity)
        if (draft.type) setValue('category', draft.type)
        if (draft.location?.coordinates) {
          setValue('lat', draft.location.coordinates.latitude)
          setValue('lng', draft.location.coordinates.longitude)
        }
      } catch {}
    }
  }, [setValue])

  // autosave draft (basic)
  const allVals = watch()
  useEffect(() => {
    incidentService.saveDraft({
      type: allVals.category,
      description: allVals.description,
      title: allVals.title,
      severity: allVals.severity as any,
      location: allVals.lat && allVals.lng ? { coordinates: { latitude: allVals.lat, longitude: allVals.lng } } as any : undefined,
    } as any)
  }, [allVals])

  // load maps
  useEffect(() => {
    if ((window as any).google) return
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}`
    s.async = true
    document.body.appendChild(s)
    return () => { s.remove() }
  }, [])

  // init map when coords available
  const lat = watch('lat'); const lng = watch('lng')
  useEffect(() => {
    if (!(window as any).google || !mapEl.current || lat == null || lng == null) return
    const center = { lat, lng }
    if (!mapRef.current) {
      mapRef.current = new (window as any).google.maps.Map(mapEl.current, { center, zoom: 16 })
      markerRef.current = new (window as any).google.maps.Marker({ position: center, map: mapRef.current, draggable: true })
      markerRef.current.addListener('dragend', (e: any) => {
        setValue('lat', e.latLng.lat())
        setValue('lng', e.latLng.lng())
      })
      mapRef.current.addListener('click', (e: any) => {
        markerRef.current.setPosition(e.latLng)
        setValue('lat', e.latLng.lat())
        setValue('lng', e.latLng.lng())
      })
    } else {
      mapRef.current.panTo(center)
      markerRef.current.setPosition(center)
    }
  }, [lat, lng, setValue])

  async function onSubmit(values: Values) {
    try {
      // simple review confirm
      const confirmText = `Review:\n${values.title}\n${values.description.slice(0,100)}...\nSeverity: ${values.severity}\nCategory: ${values.category}\nProceed to submit?`
      if (!window.confirm(confirmText)) return
      const when = new Date(`${values.date}T${values.time}:00`)
      const data: any = {
        type: values.category,
        description: values.description,
        severity: values.severity,
        title: values.title,
        location: { coordinates: { latitude: values.lat || 0, longitude: values.lng || 0 }, address: values.address || '' },
        timestamp: when as any,
        peopleInvolved: values.peopleInvolved,
        perpetrator: values.perpetrator,
        witnesses: values.witnesses === 'yes',
        policeReported: values.policeReported === 'yes',
        anonymous: values.anonymous,
      }
      const id = await incidentService.reportIncident(data, files)
      toast.success(`Report submitted. ID: ${id}`)
      incidentService.clearDraft()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit incident')
    }
  }

  // Templates
  const templates = [
    { key: 'stalking', title: 'Stalking near home', description: 'Observed an individual following me for several blocks near my residence.' },
    { key: 'eve', title: 'Eve-teasing at market', description: 'Group of individuals making inappropriate comments and gestures at the market.' },
  ]
  function applyTemplate(t: { title: string; description: string }) {
    setValue('title', t.title)
    setValue('description', t.description)
  }

  // Voice to text for description
  function toggleVoice() {
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SR) return toast('Speech recognition not supported')
    if (!listening) {
      const rec = new SR()
      rec.lang = 'en-US'
      rec.continuous = true
      rec.onresult = (e: any) => {
        const text = Array.from(e.results).map((r: any) => r[0].transcript).join(' ')
        setValue('description', (getValues('description') || '') + ' ' + text)
      }
      recognitionRef.current = rec
      try { rec.start(); setListening(true) } catch {}
    } else {
      try { recognitionRef.current?.stop() } catch {}
      setListening(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Report Incident</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <label className="text-sm">Templates:</label>
            {templates.map((t) => (
              <button type="button" key={t.key} onClick={() => applyTemplate(t)} className="h-8 px-3 rounded border text-sm">{t.key}</button>
            ))}
            <button type="button" onClick={toggleVoice} className={`h-8 px-3 rounded border text-sm ${listening ? 'bg-yellow-100' : ''}`}>{listening ? 'Stop Voice' : 'Voice-to-Text'}</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Category</label>
              <select {...register('category')} className="mt-1 w-full h-11 border rounded px-2">
                <option value="harassment">Harassment</option>
                <option value="assault">Assault</option>
                <option value="stalking">Stalking/Following</option>
                <option value="suspicious">Suspicious Activity</option>
                <option value="eve_teasing">Eve-teasing</option>
                <option value="unsafe_area">Unsafe Area</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Severity</label>
              <select {...register('severity')} className="mt-1 w-full h-11 border rounded px-2">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm">Title</label>
            <input {...register('title')} className="mt-1 w-full h-11 border rounded px-3" />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm">Details</label>
            <textarea {...register('description')} className="mt-1 w-full border rounded p-3" rows={4} />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Date</label>
              <input type="date" {...register('date')} className="mt-1 w-full h-11 border rounded px-3" />
            </div>
            <div>
              <label className="block text-sm">Time</label>
              <input type="time" {...register('time')} className="mt-1 w-full h-11 border rounded px-3" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">People involved</label>
              <input type="number" {...register('peopleInvolved')} className="mt-1 w-full h-11 border rounded px-3" />
            </div>
            <div>
              <label className="block text-sm">Perpetrator description</label>
              <input {...register('perpetrator')} className="mt-1 w-full h-11 border rounded px-3" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Witnesses present?</label>
              <select {...register('witnesses')} className="mt-1 w-full h-11 border rounded px-2">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Police reported?</label>
              <select {...register('policeReported')} className="mt-1 w-full h-11 border rounded px-2">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm">Attach photos/videos (max 10MB each)</label>
            <input type="file" multiple accept="image/*,video/*" onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 6))} className="mt-1 w-full" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('anonymous')} className="h-4 w-4" /> Submit anonymously
          </label>
          <button disabled={isSubmitting} className="h-11 w-full rounded bg-black text-white">{isSubmitting ? 'Submitting…' : 'Submit Report'}</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Address</label>
            <input {...register('address')} className="mt-1 w-full h-11 border rounded px-3" placeholder="Optional landmark or address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Latitude</label>
              <input type="number" step="any" {...register('lat')} className="mt-1 w-full h-11 border rounded px-3" />
            </div>
            <div>
              <label className="block text-sm">Longitude</label>
              <input type="number" step="any" {...register('lng')} className="mt-1 w-full h-11 border rounded px-3" />
            </div>
          </div>
          <div ref={mapEl} className="h-64 rounded border bg-gray-100" />
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-gray-500">
            Click on map or drag marker to set accurate location. Your current location is auto-filled if permitted.
          </motion.div>
        </div>
      </form>
    </div>
  )
}

