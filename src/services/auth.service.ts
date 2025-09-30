import { auth, db, setAuthPersistence } from '@/config/firebase'
import { GoogleAuthProvider, RecaptchaVerifier, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, updateProfile, signInWithPopup, signInWithPhoneNumber, sendPasswordResetEmail, type User } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

async function upsertUserProfile(user: User, extra?: Partial<{ phoneNumber: string; fullName: string; emergencyContact: { name: string; phone: string; relationship?: string } }>) {
  const ref = doc(db, 'users', user.uid)
  await setDoc(ref, {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? extra?.fullName ?? null,
    phoneNumber: user.phoneNumber ?? extra?.phoneNumber ?? null,
    photoURL: user.photoURL ?? null,
    emergencyContact: extra?.emergencyContact ?? null,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true })
}

export const authService = {
  setAuthPersistence,
  async signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  },
  async signUpWithEmail(email: string, password: string, displayName?: string, extra?: Parameters<typeof upsertUserProfile>[1]) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(cred.user, { displayName })
    await upsertUserProfile(cred.user, { ...extra, fullName: displayName })
    await sendEmailVerification(cred.user)
  },
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    await upsertUserProfile(cred.user)
  },
  async initRecaptcha(containerId: string): Promise<RecaptchaVerifier> {
    const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
    await verifier.render()
    return verifier
  },
  async signInWithPhone(phoneNumber: string, verifier: RecaptchaVerifier) {
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier)
    return confirmation
  },
  async resetPassword(email: string) { await sendPasswordResetEmail(auth, email) },
  async logout() { await signOut(auth) },
}

