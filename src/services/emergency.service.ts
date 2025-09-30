import { db, auth } from '@/config/firebase'
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc, setDoc } from 'firebase/firestore'

export type EmergencySession = {
  id?: string
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
  status: 'active' | 'resolved'
  type: 'sos' | 'voice' | 'shake'
  location?: { latitude: number; longitude: number; address?: string }
  notes?: string
}

export type EmergencyActionResult = {
  locationCaptured: boolean
  sessionCreated: boolean
  smsSent: boolean
  pushSent: boolean
  recordingStarted: boolean
}

export class EmergencyService {
  private emergenciesCol = collection(db, 'emergencies')

  async createSession(type: EmergencySession['type'], location?: EmergencySession['location']): Promise<string> {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    const session: Omit<EmergencySession, 'id'> = {
      userId: user.uid,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      status: 'active',
      type,
      location,
    }
    const ref = await addDoc(this.emergenciesCol, session)
    return ref.id
  }

  async resolveSession(sessionId: string, reason?: string): Promise<void> {
    const ref = doc(db, 'emergencies', sessionId)
    await updateDoc(ref, { status: 'resolved', updatedAt: serverTimestamp(), notes: reason || null })
  }

  // Placeholder: invoke your backend/Cloud Function that integrates Twilio SMS and FCM
  async notifyGuardians(sessionId: string, locationUrl?: string): Promise<void> {
    try {
      await fetch('/api/notify-guardians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, locationUrl }),
      })
    } catch (_) {
      // Queue locally for retry
      const queue = JSON.parse(localStorage.getItem('sg_notify_queue') || '[]') as any[]
      queue.push({ sessionId, locationUrl, at: Date.now() })
      localStorage.setItem('sg_notify_queue', JSON.stringify(queue))
    }
  }

  async logActivity(sessionId: string, event: string, data?: any): Promise<void> {
    const user = auth.currentUser
    if (!user) return
    const ref = doc(db, 'emergencies', sessionId, 'activity', `${Date.now()}`)
    await setDoc(ref, { event, data: data || null, at: serverTimestamp(), userId: user.uid })
  }

  startRecording(): Promise<MediaRecorder | null> {
    return new Promise(async (resolve) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        const chunks: BlobPart[] = []
        recorder.ondataavailable = (e) => chunks.push(e.data)
        recorder.start()
        // Optionally upload chunks periodically or on stop
        resolve(recorder)
      } catch (_) {
        resolve(null)
      }
    })
  }

  getLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      )
    })
  }
}

export const emergencyService = new EmergencyService()

