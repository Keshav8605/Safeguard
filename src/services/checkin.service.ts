import { auth, db, storage } from '@/config/firebase'
import { collection, addDoc, serverTimestamp, Timestamp, doc, getDocs, orderBy, query, where, limit, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { guardianService } from '@/services/guardian.service'

export type CheckInType = 'manual' | 'scheduled' | 'location' | 'emergency' | 'social'

export type CheckIn = {
  id?: string
  userId: string
  type: CheckInType
  note?: string
  photoUrl?: string
  voiceUrl?: string
  createdAt: Timestamp
  location?: { lat: number; lng: number; address?: string }
  status: 'ok' | 'missed' | 'skipped'
}

export class CheckInService {
  private getCol(userId: string) { return collection(db, 'users', userId, 'checkins') }

  async quickCheckIn(type: CheckInType = 'manual', note?: string, file?: File, location?: { lat: number; lng: number; address?: string }): Promise<string> {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    let photoUrl: string | undefined
    if (file) {
      const path = `checkins/${user.uid}/${Date.now()}_${file.name}`
      const sref = ref(storage, path)
      await uploadBytes(sref, file)
      photoUrl = await getDownloadURL(sref)
    }
    const data: Omit<CheckIn, 'id'> = {
      userId: user.uid,
      type,
      note,
      photoUrl,
      createdAt: serverTimestamp() as Timestamp,
      location,
      status: 'ok',
    }
    const refDoc = await addDoc(this.getCol(user.uid), data)
    // Notify primary guardian (lowest priority number)
    try { await guardianService.notifyGuardians('User checked in as safe') } catch {}
    return refDoc.id
  }

  async getHistory(days: number = 30): Promise<CheckIn[]> {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    const since = Date.now() - days * 24 * 60 * 60 * 1000
    const q = query(this.getCol(user.uid), where('createdAt', '>=', Timestamp.fromMillis(since)), orderBy('createdAt', 'desc'), limit(500))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CheckIn[]
  }

  async getStreak(): Promise<{ count: number; lastDate?: string }> {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    const q = query(this.getCol(user.uid), orderBy('createdAt', 'desc'), limit(365))
    const snap = await getDocs(q)
    const dates = new Set<string>()
    snap.forEach((d) => { const t = (d.data().createdAt as Timestamp)?.toDate?.() || new Date(); dates.add(t.toISOString().split('T')[0]) })
    let streak = 0; const today = new Date(); for (let i = 0; i < 365; i++) { const d = new Date(today); d.setDate(today.getDate() - i); const key = d.toISOString().split('T')[0]; if (dates.has(key)) streak++; else break }
    return { count: streak, lastDate: Array.from(dates).sort().pop() }
  }

  // Scheduled check-ins config per user
  async saveSchedule(config: any): Promise<void> {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    await setDoc(doc(db, 'users', user.uid, 'settings', 'checkin'), { config, updatedAt: serverTimestamp() }, { merge: true })
  }
  async getSchedule(): Promise<any | null> {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    const s = await getDoc(doc(db, 'users', user.uid, 'settings', 'checkin'))
    return s.exists() ? s.data()?.config : null
  }
}

export const checkInService = new CheckInService()

