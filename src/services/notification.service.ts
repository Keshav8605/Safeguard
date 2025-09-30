import { db, auth } from '@/config/firebase'
import { addDoc, collection, serverTimestamp, Timestamp, doc, setDoc } from 'firebase/firestore'

export type NotificationChannel = 'push' | 'sms' | 'email'
export type NotificationType = 'sos' | 'location' | 'checkin' | 'incident' | 'reminder' | 'community'

export type NotificationPayload = {
  title: string
  body: string
  url?: string
  data?: Record<string, any>
  priority?: 'normal' | 'high'
  actions?: { title: string; action: string }[]
}

export class NotificationService {
  private logsCol(userId: string) { return collection(db, 'users', userId, 'notifications') }

  async log(type: NotificationType, channel: NotificationChannel, payload: NotificationPayload, status: 'sent' | 'delivered' | 'read' | 'failed' = 'sent') {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    await addDoc(this.logsCol(user.uid), { type, channel, payload, status, createdAt: serverTimestamp() as Timestamp })
  }

  async updatePrefs(prefs: any) {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), { prefs, updatedAt: serverTimestamp() }, { merge: true })
  }
}

export const notificationService = new NotificationService()

