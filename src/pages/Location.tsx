import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { rtdb } from '@/config/firebase'
import { ref as rref, set as rset } from 'firebase/database'
import { locationService } from '@/services/location.service'
import { motion } from 'framer-motion'

declare global { interface Window { initMap?: () => void; google?: any } }

export default function LocationPage() {
  const { currentUser } = useAuth()
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [sharing, setSharing] = useState<boolean>(false)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap')
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [loadedMaps, setLoadedMaps] = useState(false)

  // load Google Maps JS API (user must add key via index.html or env proxy)
  useEffect(() => {
    if (window.google) { setLoadedMaps(true); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}`
    s.async = true
    s.onload = () => setLoadedMaps(true)
    document.body.appendChild(s)
    return () => { s.remove() }
  }, [])

  // init map
  useEffect(() => {
    if (!loadedMaps || !mapEl.current || !coords) return
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapEl.current, { center: coords, zoom: 15, mapTypeId: mapType })
      markerRef.current = new window.google.maps.Marker({ position: coords, map: mapRef.current, title: 'You' })
    } else {
      mapRef.current.setMapTypeId(mapType)
      mapRef.current.panTo(coords)
      markerRef.current.setPosition(coords)
    }
  }, [loadedMaps, coords, mapType])

  // track location
  useEffect(() => {
    let watchId: number | null = null
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
          setLastUpdated(Date.now())
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 15000 }
      )
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId) }
  }, [])

  // push to RTDB every 30s when sharing
  useEffect(() => {
    if (!sharing || !currentUser || !coords) return
    const uid = currentUser.uid
    const push = () => rset(rref(rtdb, `liveLocations/${uid}`), { lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy || null, at: Date.now() })
    push()
    const t = setInterval(push, 30000)
    return () => clearInterval(t)
  }, [sharing, coords, currentUser])

  const accuracyText = useMemo(() => {
    if (!coords?.accuracy) return '—'
    if (coords.accuracy < 25) return 'High'
    if (coords.accuracy < 75) return 'Medium'
    return 'Low'
  }, [coords])

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3 p-3 border-b bg-white">
        <button onClick={() => setSharing((s) => !s)} className={`h-10 px-4 rounded ${sharing ? 'bg-green-600 text-white' : 'border'}`}>{sharing ? 'Sharing ON' : 'Start Sharing'}</button>
        <div className="text-sm text-gray-600">Accuracy: {accuracyText}</div>
        <div className="text-sm text-gray-600">Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}</div>
        <select className="h-10 border rounded px-2 ml-auto" value={mapType} onChange={(e) => setMapType(e.target.value as any)}>
          <option value="roadmap">Standard</option>
          <option value="satellite">Satellite</option>
          <option value="terrain">Terrain</option>
        </select>
      </div>
      <div ref={mapEl} className="flex-1 bg-gray-200" />
      <div className="p-3 border-t bg-white">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-2 sm:grid-cols-3">
          <button className="h-10 rounded border">Find Safe Places (todo)</button>
          <button className="h-10 rounded border">Share Link (todo)</button>
          <button className="h-10 rounded border">Geofences (todo)</button>
        </motion.div>
      </div>
    </div>
  )
}

