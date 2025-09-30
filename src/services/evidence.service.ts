import { auth, storage, db } from '@/config/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

export type EvidenceType = 'audio' | 'photo' | 'video' | 'note'

export type EvidenceItem = {
  id?: string
  userId: string
  type: EvidenceType
  url?: string
  localBlob?: Blob
  size?: number
  createdAt: Timestamp
  metadata?: Record<string, any>
  tags?: string[]
  important?: boolean
}

export class EvidenceService {
  private col(userId: string) { return collection(db, 'users', userId, 'evidence') }

  async enqueueAndUpload(item: Omit<EvidenceItem, 'id' | 'createdAt' | 'userId'>): Promise<string> {
    const user = auth.currentUser; if (!user) throw new Error('Not authenticated')
    const createdAt = serverTimestamp() as Timestamp
    let url: string | undefined
    if (item.localBlob) {
      const path = `evidence/${user.uid}/${Date.now()}_${item.type}`
      const sref = ref(storage, path)
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(sref, item.localBlob!)
        task.on('state_changed', () => {}, reject, async () => { url = await getDownloadURL(sref); resolve() })
      })
    }
    const docRef = await addDoc(this.col(user.uid), { ...item, localBlob: undefined, userId: user.uid, createdAt, url })
    return docRef.id
  }
}

export const evidenceService = new EvidenceService()

