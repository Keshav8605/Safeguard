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
  const [places, setPlaces] = useState<Array<{ name: string; vicinity?: string; place_id: string }>>([])
  const [showPlaces, setShowPlaces] = useState(false)
  const circleRef = useRef<any>(null)
  const [geofenceRadius, setGeofenceRadius] = useState<number>(500)
  const [geofenceOn, setGeofenceOn] = useState<boolean>(false)
  const [shareUrl, setShareUrl] = useState<string>('')

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

  // draw/update geofence circle
  useEffect(() => {
    if (!loadedMaps || !mapRef.current) return
    if (!geofenceOn || !coords) {
      if (circleRef.current) { circleRef.current.setMap(null); circleRef.current = null }
      return
    }
    if (!circleRef.current) {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: '#3b82f6', fillOpacity: 0.1, map: mapRef.current,
        center: coords, radius: geofenceRadius,
      })
    } else {
      circleRef.current.setCenter(coords)
      circleRef.current.setRadius(geofenceRadius)
      circleRef.current.setMap(mapRef.current)
    }
  }, [loadedMaps, coords, geofenceOn, geofenceRadius])

  // simple geofence notify
  useEffect(() => {
    if (!geofenceOn || !coords || !circleRef.current) return
    const within = window.google.maps.geometry
      ? window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(coords.lat, coords.lng), circleRef.current.getCenter()) <= geofenceRadius
      : true
    if (!within) {
      try { new Notification('SafeGuard', { body: 'You left the geofenced area.' }) } catch {}
      alert('You left the geofenced area.')
      setGeofenceOn(false)
    }
  }, [coords, geofenceOn, geofenceRadius])

  async function onFindSafePlaces() {
    if (!coords) return
    // If Google Places is available, use Nearby Search; else open Google Maps search
    if (window.google?.maps?.places) {
      const service = new window.google.maps.places.PlacesService(mapRef.current)
      const req = { location: new window.google.maps.LatLng(coords.lat, coords.lng), radius: 2000, type: ['police', 'hospital', 'pharmacy'] }
      service.nearbySearch(req, (results: any[], status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setPlaces(results.map((r: any) => ({ name: r.name, vicinity: r.vicinity, place_id: r.place_id })))
          setShowPlaces(true)
          // drop markers
          results.slice(0, 8).forEach((r: any) => new window.google.maps.Marker({ map: mapRef.current, position: r.geometry.location, title: r.name }))
        } else {
          window.open(`https://www.google.com/maps/search/police+hospital+near+me/@${coords.lat},${coords.lng},15z`, '_blank')
        }
      })
    } else {
      window.open(`https://www.google.com/maps/search/police+hospital+near+me/@${coords.lat},${coords.lng},15z`, '_blank')
    }
  }

  async function onShareLink() {
    if (!currentUser || !coords) return
    const token = Math.random().toString(36).slice(2)
    const payload = { uid: currentUser.uid, lat: coords.lat, lng: coords.lng, at: Date.now(), ttl: Date.now() + 60 * 60 * 1000 }
    await rset(rref(rtdb, `liveLinks/${token}`), payload)
    const url = `${location.origin}/?share=${token}`
    setShareUrl(url)
    try { await navigator.clipboard.writeText(url) } catch {}
    try { if ((navigator as any).share) await (navigator as any).share({ title: 'My live location', url }) } catch {}
    alert('Share link copied to clipboard.')
  }

  function toggleGeofence() {
    setGeofenceOn((v) => !v)
  }

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
          <button onClick={onFindSafePlaces} className="h-10 rounded border">Find Safe Places</button>
          <button onClick={onShareLink} className="h-10 rounded border">Share Link</button>
          <div className="h-10 rounded border flex items-center justify-between px-2">
            <span>Geofence</span>
            <div className="flex items-center gap-2">
              <input type="number" className="h-8 w-20 border rounded px-2" value={geofenceRadius} onChange={(e) => setGeofenceRadius(Math.max(0, Number(e.target.value) || 0))} />
              <span className="text-xs text-gray-500">m</span>
              <button onClick={toggleGeofence} className={`h-8 px-3 rounded ${geofenceOn ? 'bg-blue-600 text-white' : 'border'}`}>{geofenceOn ? 'On' : 'Off'}</button>
            </div>
          </div>
        </motion.div>
        {showPlaces && (
          <div className="mt-3 border rounded p-3 bg-white max-h-64 overflow-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Nearby safe places</h3>
              <button className="text-sm" onClick={() => setShowPlaces(false)}>Close</button>
            </div>
            <ul className="divide-y">
              {places.map((p) => (
                <li key={p.place_id} className="py-2">
                  <a className="text-blue-600" href={`https://www.google.com/maps/place/?q=place_id:${p.place_id}`} target="_blank" rel="noreferrer">{p.name}</a>
                  <div className="text-xs text-gray-500">{p.vicinity || ''}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {shareUrl && (
          <div className="mt-3 text-sm text-gray-700 break-all">Share URL: {shareUrl}</div>
        )}
      </div>
    </div>
  )
}

