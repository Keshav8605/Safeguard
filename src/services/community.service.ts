import { auth, db, storage } from '@/config/firebase'
import { collection, addDoc, serverTimestamp, Timestamp, query, orderBy, limit, startAfter, getDocs, where, doc, updateDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export type AlertType = 'incident' | 'tip' | 'update' | 'warning'

export type CommunityAlert = {
  id?: string
  type: AlertType
  title: string
  body: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  location?: { lat: number; lng: number }
  address?: string
  createdAt: Timestamp
  createdBy: string
  commentsCount?: number
  helpfulCount?: number
}

export type SafetyTip = {
  id?: string
  title: string
  body: string
  category: string
  tags?: string[]
  mediaUrl?: string
  createdAt: Timestamp
  createdBy: string
  upvotes?: number
  downvotes?: number
  savedBy?: string[]
}

export class CommunityService {
  private alertsCol = collection(db, 'community_alerts')
  private tipsCol = collection(db, 'safety_tips')

  async createAlert(alert: Omit<CommunityAlert, 'id' | 'createdAt' | 'createdBy'>): Promise<string> {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    const refDoc = await addDoc(this.alertsCol, { ...alert, createdAt: serverTimestamp(), createdBy: user.uid })
    return refDoc.id
  }

  async listAlerts(opts: { limitCount?: number; after?: any; type?: AlertType; sinceMs?: number; lat?: number; lng?: number }): Promise<{ items: CommunityAlert[]; cursor: any | null }> {
    const parts = [orderBy('createdAt', 'desc')]
    if (opts.type) parts.unshift(where('type', '==', opts.type))
    if (opts.sinceMs) parts.unshift(where('createdAt', '>=', Timestamp.fromMillis(opts.sinceMs)))
    let q = query(this.alertsCol, ...parts, limit(opts.limitCount || 20))
    if (opts.after) q = query(this.alertsCol, ...parts, startAfter(opts.after), limit(opts.limitCount || 20))
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CommunityAlert[]
    const cursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null
    return { items, cursor }
  }

  async createTip(tip: Omit<SafetyTip, 'id' | 'createdAt' | 'createdBy' | 'upvotes' | 'downvotes' | 'savedBy'>, file?: File): Promise<string> {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    let mediaUrl: string | undefined
    if (file) { const sref = ref(storage, `tips/${user.uid}/${Date.now()}_${file.name}`); await uploadBytes(sref, file); mediaUrl = await getDownloadURL(sref) }
    const refDoc = await addDoc(this.tipsCol, { ...tip, mediaUrl, createdAt: serverTimestamp(), createdBy: user.uid, upvotes: 0, downvotes: 0, savedBy: [] })
    return refDoc.id
  }

  async listTips(opts: { limitCount?: number; after?: any; category?: string; order?: 'latest' | 'top' }): Promise<{ items: SafetyTip[]; cursor: any | null }> {
    const base: any[] = []
    if (opts.category) base.push(where('category', '==', opts.category))
    if (opts.order === 'top') base.push(orderBy('upvotes', 'desc'))
    else base.push(orderBy('createdAt', 'desc'))
    let q = query(this.tipsCol, ...base, limit(opts.limitCount || 20))
    if (opts.after) q = query(this.tipsCol, ...base, startAfter(opts.after), limit(opts.limitCount || 20))
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SafetyTip[]
    const cursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null
    return { items, cursor }
  }

  async voteTip(tipId: string, delta: 1 | -1): Promise<void> {
    await updateDoc(doc(db, 'safety_tips', tipId), { [delta === 1 ? 'upvotes' : 'downvotes']: (delta === 1 ? (await this._get(tipId)).upvotes + 1 : (await this._get(tipId)).downvotes + 1) })
  }

  private async _get(id: string) { return (await getDocs(query(this.tipsCol, where('__name__', '==', id)))).docs[0]?.data() as any }
}

export const communityService = new CommunityService()

