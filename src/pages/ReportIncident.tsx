import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { incidentService } from '@/services/incident.service'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  category: z.enum(['harassment', 'assault', 'stalking', 'suspicious', 'eve_teasing', 'unsafe_area', 'other']),
  title: z.string().min(3),
  description: z.string().min(10),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  address: z.string().optional(),
})

type Values = z.infer<typeof schema>

export default function ReportIncidentPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { severity: 'medium', category: 'harassment' } })
  const [files, setFiles] = useState<File[]>([])
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // load current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setValue('lat', pos.coords.latitude)
        setValue('lng', pos.coords.longitude)
      }, () => {
        // Fallback to default location if geolocation fails
        setValue('lat', 28.6139)
        setValue('lng', 77.2090)
      })
    } else {
      // Default to Delhi if geolocation not available
      setValue('lat', 28.6139)
      setValue('lng', 77.2090)
    }
  }, [setValue])

  // load maps with proper error handling
  useEffect(() => {
    if (window.google) {
      setMapLoaded(true)
      return
    }
    
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}&libraries=geometry`
    script.async = true
    script.onload = () => {
      console.log('Google Maps script loaded')
      setMapLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps')
      setMapLoaded(false)
      toast.error('Failed to load maps. Please refresh the page.')
    }
    document.body.appendChild(script)
    
    return () => {
      try { document.body.removeChild(script) } catch {}
    }
  }, [])


  // init map when coords available
  const lat = watch('lat')
  const lng = watch('lng')
  
  useEffect(() => {
    if (!mapLoaded || !window.google || !mapEl.current || lat == null || lng == null) return
    
    const center = { lat, lng }
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapEl.current, { 
        center, 
        zoom: 16,
        mapTypeId: 'roadmap'
      })
      markerRef.current = new window.google.maps.Marker({ 
        position: center, 
        map: mapRef.current, 
        draggable: true,
        title: 'Incident Location'
      })
      
      markerRef.current.addListener('dragend', (e: any) => {
        const newPos = e.latLng
        setValue('lat', newPos.lat())
        setValue('lng', newPos.lng())
      })
      
      mapRef.current.addListener('click', (e: any) => {
        const newPos = e.latLng
        markerRef.current.setPosition(newPos)
        setValue('lat', newPos.lat())
        setValue('lng', newPos.lng())
      })
    } else {
      mapRef.current.panTo(center)
      markerRef.current.setPosition(center)
    }
  }, [mapLoaded, lat, lng, setValue])

  async function onSubmit(values: Values) {
    try {
      const confirmText = `Review:\n${values.title}\n${values.description.slice(0,100)}...\nSeverity: ${values.severity}\nCategory: ${values.category}\nProceed to submit?`
      if (!window.confirm(confirmText)) return
      
      // Show immediate feedback
      toast.loading('Submitting incident...', { id: 'incident-submit' })
      
      const data: any = {
        type: values.category,
        description: values.description,
        severity: values.severity,
        title: values.title,
        location: { 
          coordinates: { 
            latitude: values.lat || 0, 
            longitude: values.lng || 0 
          }, 
          address: values.address || '' 
        },
        timestamp: new Date(),
        anonymous: true,
      }
      
      const id = await incidentService.reportIncident(data, files)
      
      // Update toast with success
      toast.success(`Report submitted successfully! ID: ${id}`, { id: 'incident-submit' })
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/incidents')
      }, 1000)
      
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit incident', { id: 'incident-submit' })
    }
  }

  // Quick templates
  const templates = [
    { key: 'stalking', title: 'Stalking near home', description: 'Observed an individual following me for several blocks near my residence.' },
    { key: 'eve', title: 'Eve-teasing at market', description: 'Group of individuals making inappropriate comments and gestures at the market.' },
  ]
  
  function applyTemplate(t: { title: string; description: string }) {
    setValue('title', t.title)
    setValue('description', t.description)
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Report Incident</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Quick Templates */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Quick Templates</h3>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button 
                type="button" 
                key={t.key} 
                onClick={() => applyTemplate(t)} 
                className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
              >
                {t.key}
              </button>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Form Fields */}
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select {...register('category')} className="w-full h-10 border rounded px-3">
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
                <label className="block text-sm font-medium mb-1">Severity *</label>
                <select {...register('severity')} className="w-full h-10 border rounded px-3">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input 
                {...register('title')} 
                placeholder="Brief description of the incident"
                className="w-full h-10 border rounded px-3" 
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea 
                {...register('description')} 
                placeholder="Detailed description of what happened..."
                className="w-full border rounded p-3" 
                rows={4} 
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address/Landmark</label>
              <input 
                {...register('address')} 
                placeholder="Optional landmark or address"
                className="w-full h-10 border rounded px-3" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Attach Evidence (Optional)</label>
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 6))} 
                className="w-full text-sm" 
              />
              <p className="text-xs text-gray-500 mt-1">Max 10MB each, up to 6 files</p>
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-xs text-gray-500">Latitude</label>
                  <input 
                    type="number" 
                    step="any" 
                    {...register('lat')} 
                    className="w-full h-8 text-xs border rounded px-2" 
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Longitude</label>
                  <input 
                    type="number" 
                    step="any" 
                    {...register('lng')} 
                    className="w-full h-8 text-xs border rounded px-2" 
                    readOnly
                  />
                </div>
              </div>
              
              <div ref={mapEl} className="h-64 rounded border bg-gray-100" />
              {!mapLoaded && (
                <div className="h-64 flex items-center justify-center bg-gray-100 rounded border">
                  <p className="text-gray-500">Loading map...</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Click on map or drag marker to set location. Your current location is auto-filled.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button 
            disabled={isSubmitting} 
            className="w-full h-12 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  )
}

