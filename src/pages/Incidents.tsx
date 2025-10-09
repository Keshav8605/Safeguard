import React, { useEffect, useState, useRef } from 'react'
import { incidentService } from '@/services/incident.service'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Incidents() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    setLoading(true); setError(null)
    try {
      const unsub = incidentService.subscribeUserIncidents(100, (list) => {
        setItems(list); setLoading(false)
      }, (e) => { setError(e?.message || 'Failed to fetch incidents'); setLoading(false) })
      return () => { try { unsub() } catch {} }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch incidents'); setLoading(false)
    }
  }, [])

  // Load Google Maps
  useEffect(() => {
    if (window.google) {
      setMapLoaded(true)
      return
    }
    
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}&libraries=geometry`
    script.async = true
    script.onload = () => setMapLoaded(true)
    script.onerror = () => {
      console.error('Failed to load Google Maps')
      setMapLoaded(false)
    }
    document.body.appendChild(script)
    
    return () => {
      try { document.body.removeChild(script) } catch {}
    }
  }, [])

  // Initialize map for selected incident
  useEffect(() => {
    if (!selectedIncident || !mapLoaded || !window.google || !mapEl.current) return
    
    const lat = selectedIncident.location?.coordinates?.latitude
    const lng = selectedIncident.location?.coordinates?.longitude
    
    if (!lat || !lng) return
    
    const center = { lat, lng }
    
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapEl.current, { 
        center, 
        zoom: 15,
        mapTypeId: 'roadmap'
      })
    } else {
      mapRef.current.panTo(center)
    }
    
    // Clear existing markers
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }
    
    // Add new marker
    markerRef.current = new window.google.maps.Marker({ 
      position: center, 
      map: mapRef.current,
      title: selectedIncident.title || 'Incident Location'
    })
  }, [selectedIncident, mapLoaded])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown'
    const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Incidents</h1>
        <Link to="/report-incident" className="h-10 px-4 rounded bg-blue-600 text-white hover:bg-blue-700">New Report</Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !items.length && <p className="text-sm text-gray-500">No incidents yet.</p>}
      
      {!!items.length && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((incident) => (
            <motion.div
              key={incident.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedIncident(incident)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 truncate">{incident.title || incident.type}</h3>
                <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(incident.severity)}`}>
                  {incident.severity || '—'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{incident.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(incident.timestamp)}</span>
                <span className="capitalize">{incident.type}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedIncident(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedIncident.title || selectedIncident.type}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-sm px-2 py-1 rounded-full border ${getSeverityColor(selectedIncident.severity)}`}>
                        {selectedIncident.severity || '—'}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">{selectedIncident.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left Column - Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700">{selectedIncident.description}</p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Date & Time</h3>
                      <p className="text-gray-700">{formatDate(selectedIncident.timestamp)}</p>
                    </div>

                    {selectedIncident.location?.address && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Address</h3>
                        <p className="text-gray-700">{selectedIncident.location.address}</p>
                      </div>
                    )}

                    {selectedIncident.evidence && selectedIncident.evidence.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Evidence</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedIncident.evidence.map((evidence: any, index: number) => (
                            <div key={index} className="border rounded p-2">
                              {evidence.type === 'photo' ? (
                                <img src={evidence.url} alt={`Evidence ${index + 1}`} className="w-full h-20 object-cover rounded" />
                              ) : (
                                <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center">
                                  <span className="text-xs text-gray-500">{evidence.type}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Map */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                    {selectedIncident.location?.coordinates ? (
                      <div>
                        <div ref={mapEl} className="h-64 rounded border bg-gray-100" />
                        {!mapLoaded && (
                          <div className="h-64 flex items-center justify-center bg-gray-100 rounded border">
                            <p className="text-gray-500">Loading map...</p>
                          </div>
                        )}
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Lat: {selectedIncident.location.coordinates.latitude?.toFixed(6)}</p>
                          <p>Lng: {selectedIncident.location.coordinates.longitude?.toFixed(6)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center bg-gray-100 rounded border">
                        <p className="text-gray-500">No location data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

