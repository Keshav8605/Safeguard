import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useGuardians } from '@/hooks/useGuardians'
import { useIncidents } from '@/hooks/useIncidents'
import { locationService } from '@/services/location.service'
import { useSafetyScore } from '@/hooks/useSafetyScore'
import { emergencyService } from '@/services/emergency.service'
import { guardianService } from '@/services/guardian.service'
import { notificationService } from '@/services/notification.service'
import { useEmergencyStore } from '@/store/emergency.store'
import EmergencyOverlay from '@/components/emergency/EmergencyOverlay'
import CheckInButton from '@/components/checkin/CheckInButton'

type Activity = { id: string; type: 'checkin' | 'guardian' | 'incident' | 'alert'; title: string; time: string }

export default function Dashboard() {
  const { currentUser, logout } = useAuth()
  const { guardians } = useGuardians()
  const { incidents } = useIncidents()
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [city, setCity] = useState<string>('')
  const [now, setNow] = useState<Date>(new Date())
  const safety = useSafetyScore(coords?.latitude ?? null, coords?.longitude ?? null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    locationService.getCurrentPosition().then(setCoords).catch(() => {})
  }, [])

  useEffect(() => {
    async function revGeo() {
      if (!coords) return
      try {
        // Placeholder reverse geocode using Open-Meteo geocoding (no key) can be wired later
        setCity(`Lat ${coords.latitude.toFixed(2)}, Lon ${coords.longitude.toFixed(2)}`)
      } catch {}
    }
    void revGeo()
  }, [coords])

  const activities: Activity[] = useMemo(() => {
    const list: Activity[] = []
    if (incidents.length) {
      list.push({ id: 'a1', type: 'incident', title: `Reported ${incidents[0].type}`, time: 'Just now' })
    }
    if (guardians.length) {
      list.push({ id: 'a2', type: 'guardian', title: `Added ${guardians[0].name} as guardian`, time: 'Today' })
    }
    return list
  }, [incidents, guardians])

  const safetyScore = useMemo(() => safety.score?.overall ?? 0, [safety.score])

  const scoreColor = safetyScore >= 75 ? 'bg-green-600' : safetyScore >= 50 ? 'bg-yellow-500' : 'bg-red-600'

  const emergency = useEmergencyStore()

  async function handleSOS() {
    // double-press prevention
    if (emergency.disabledUntil && Date.now() < emergency.disabledUntil) return
    emergency.setDisabled(5000)

    // brief flash
    document.body.animate([{ background: 'white' }, { background: '#fee2e2' }, { background: 'white' }], { duration: 600 })
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])

    try {
      const loc = await emergencyService.getLocation()
      const sessionId = await emergencyService.createSession('sos', loc || undefined)
      emergency.start(sessionId, 60 * 60 * 1000)
      void emergencyService.logActivity(sessionId, 'sos_pressed', { loc })

      // Start audio recording (best effort)
      void emergencyService.startRecording()

      // Notify guardians via backend function (best effort)
      const maps = loc ? `https://maps.google.com/?q=${loc.latitude},${loc.longitude}` : undefined
      void emergencyService.notifyGuardians(sessionId, maps)

      // Immediate client-side guardian notification/log as fallback
      const message = `SOS activated${loc ? ` at ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}` : ''}. Session ${sessionId}.`;
      try { await guardianService.notifyGuardians(message) } catch {}
      try { await notificationService.log('sos', 'push', { title: 'SOS Activated', body: message, url: maps, priority: 'high' }) } catch {}

      toast.success('Emergency activated. Notifying guardians...')
    } catch (err: any) {
      // Common cause: user not authenticated
      console.error('SOS failed', err)
      toast.error(err?.message || 'Unable to start emergency. Please login and try again.')
    }
  }

  function onSOSKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); handleSOS()
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <EmergencyOverlay onCancel={async (pin) => {
        // Simple PIN check placeholder; replace with real verification
        if (pin !== '1234') return alert('Invalid PIN')
        if (!emergency.sessionId) return
        await emergencyService.resolveSession(emergency.sessionId, 'user_cancelled')
        await emergencyService.logActivity(emergency.sessionId, 'resolved', { reason: 'user_cancelled' })
        emergency.resolve()
      }} />
      {/* Header/Profile */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Hello, {currentUser?.displayName || currentUser?.email}</h1>
          <p className="text-sm text-gray-500">{city || 'Fetching location…'}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600" aria-live="polite">{now.toLocaleTimeString()}</span>
          <button className="border rounded px-3 h-10" onClick={() => logout()}>Logout</button>
        </div>
      </div>

      {/* SOS Button */}
      <div className="flex justify-center">
        <motion.button
          onClick={handleSOS}
          onKeyDown={onSOSKey}
          role="button"
          tabIndex={0}
          aria-label="Emergency SOS"
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#DC2626] text-white text-2xl font-extrabold shadow-xl focus:outline-none focus:ring-4 focus:ring-red-300"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={{ boxShadow: [
            '0 0 0 0 rgba(220,38,38,0.7)',
            '0 0 0 20px rgba(220,38,38,0)',
          ] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          SOS
        </motion.button>
      </div>

      {/* Grid widgets */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Safety Score */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Safety Score</h2>
            <span className="text-sm text-gray-500">0-100</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${scoreColor} text-white grid place-items-center text-lg font-bold`}>{safetyScore}</div>
            <div className="flex-1">
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className={`h-2 rounded ${scoreColor}`} style={{ width: `${safetyScore}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">Tip: share your route with a guardian when traveling.</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <StatCard title="Guardians" value={guardians.length} />
        <StatCard title="Safe check-ins" value={12} />
        <StatCard title="Days streak" value={5} />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Add Guardian', href: '/guardians' },
          { label: 'Share Location', href: '/location' },
          { label: 'Report Incident', href: '/incidents' },
          { label: 'Safe Places', href: '/community' },
          { label: 'Check-in Timer', href: '/settings' },
          { label: 'Evidence Vault', href: '/evidence' },
          { label: 'Fake Call', href: '/fake-call' },
        ].map((a) => (
          <motion.div key={a.label} whileHover={{ y: -2 }} className="h-12 rounded border bg-white grid place-items-center shadow-sm font-medium">
            <Link to={a.href} className="block w-full h-full text-center leading-[3rem]">
              {a.label}
            </Link>
          </motion.div>
        ))}
        <div className="sm:col-span-3 lg:col-span-5"><CheckInButton /></div>
      </div>

      {/* Activity + Profile/Weather */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity.</p>
          ) : (
            <ul className="divide-y">
              {activities.map((it) => (
                <li key={it.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <p className="text-sm">{it.title}</p>
                  </div>
                  <span className="text-xs text-gray-500">{it.time}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold">Your Profile</h3>
            <p className="text-sm text-gray-600">{currentUser?.displayName || currentUser?.email}</p>
            <Link to="/profile" className="text-sm text-blue-600">Account settings</Link>
          </div>
          <div>
            <h4 className="font-medium mb-2">Weather & Time</h4>
            <p className="text-sm text-gray-600">{now.toLocaleDateString()} • {now.toLocaleTimeString()}</p>
            <p className="text-sm text-gray-500">Weather: — • Sunrise/Sunset: —</p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Navigation (mobile) */}
      <nav className="fixed bottom-0 inset-x-0 z-10 bg-white border-t shadow-sm sm:hidden">
        <ul className="grid grid-cols-5 text-sm">
          {[
            { label: 'Home', href: '/dashboard' },
            { label: 'Guardians', href: '/guardians' },
            { label: 'Location', href: '/location' },
            { label: 'Community', href: '/community' },
            { label: 'Settings', href: '/settings' },
          ].map((i) => (
            <li key={i.label} className="text-center">
              <Link to={i.href} className="block py-3">{i.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </motion.div>
  )
}

