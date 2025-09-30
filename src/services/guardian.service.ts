// src/services/guardian.service.ts
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    setDoc
  } from 'firebase/firestore';
  import { db, auth, storage } from '../config/firebase';
  import { EmergencyContact } from '../types/firebase.types';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  
  export class GuardianService {
    private getGuardiansCollection(userId: string) {
      return collection(db, 'users', userId, 'guardians');
    }
  
  // Add Emergency Contact/Guardian
  async addGuardian(
    guardianData: Omit<EmergencyContact, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'verified' | 'verificationCode' | 'verificationSentAt' | 'verifiedAt' | 'responseStats' | 'photoUrl'>,
    photoFile?: File
  ): Promise<string> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        // Ensure parent user document exists (helps with Firestore security rules that reference it)
        try {
          const userDocRef = doc(db, 'users', user.uid);
          // Merge so we do not overwrite anything if it already exists
          await updateDoc(userDocRef, { lastActivityAt: serverTimestamp() });
        } catch {
          // If update fails because doc doesn't exist, create a minimal doc
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { createdAt: serverTimestamp(), lastActivityAt: serverTimestamp() }, { merge: true } as any);
        }
        // optional photo upload
        let photoUrl: string | undefined
        if (photoFile) {
          const key = `guardians/${user.uid}/${Date.now()}_${photoFile.name}`
          const sref = ref(storage, key)
          await uploadBytes(sref, photoFile)
          photoUrl = await getDownloadURL(sref)
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString()

        const guardian: Omit<EmergencyContact, 'id'> = {
          name: guardianData.name,
          phoneNumber: guardianData.phoneNumber,
          priority: guardianData.priority,
          relationship: guardianData.relationship,
          userId: user.uid,
          verified: false,
          verificationCode: code,
          verificationSentAt: serverTimestamp() as Timestamp,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          ...(guardianData.email ? { email: guardianData.email } : {}),
          ...(photoUrl ? { photoUrl } : {}),
        } as unknown as Omit<EmergencyContact, 'id'>;
  
        const docRef = await addDoc(this.getGuardiansCollection(user.uid), guardian);
        
        // Send verification
        await this.sendVerificationRequest(docRef.id, guardianData.phoneNumber, guardianData.name, code);
  
        return docRef.id;
      } catch (error: any) {
        console.error('Error adding guardian:', error);
        throw new Error(error?.message || 'Failed to add emergency contact');
      }
    }
  
    // Get All Guardians
    async getGuardians(): Promise<EmergencyContact[]> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        const q = query(
          this.getGuardiansCollection(user.uid),
          orderBy('priority', 'asc')
        );
  
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EmergencyContact));
      } catch (error) {
        console.error('Error fetching guardians:', error);
        throw new Error('Failed to fetch emergency contacts');
      }
    }
  
    // Update Guardian
    async updateGuardian(guardianId: string, updates: Partial<EmergencyContact>): Promise<void> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        const guardianRef = doc(db, 'users', user.uid, 'guardians', guardianId);
        await updateDoc(guardianRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating guardian:', error);
        throw new Error('Failed to update emergency contact');
      }
    }
  
    // Delete Guardian
    async deleteGuardian(guardianId: string): Promise<void> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        const guardianRef = doc(db, 'users', user.uid, 'guardians', guardianId);
        await deleteDoc(guardianRef);
      } catch (error) {
        console.error('Error deleting guardian:', error);
        throw new Error('Failed to delete emergency contact');
      }
    }
  
    // Update Guardian Priority
    async updatePriorities(guardianPriorities: { id: string; priority: number }[]): Promise<void> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        const updatePromises = guardianPriorities.map(({ id, priority }) => {
          const guardianRef = doc(db, 'users', user.uid, 'guardians', id);
          return updateDoc(guardianRef, {
            priority,
            updatedAt: serverTimestamp()
          });
        });
  
        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Error updating priorities:', error);
        throw new Error('Failed to update priorities');
      }
    }
  
  // Verify Guardian with code (placeholder: trust client)
  async verifyGuardian(guardianId: string, _code: string): Promise<void> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
    const guardianRef = doc(db, 'users', user.uid, 'guardians', guardianId);
    await updateDoc(guardianRef, {
      verified: true,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
      } catch (error) {
        console.error('Error verifying guardian:', error);
        throw new Error('Failed to verify guardian');
      }
    }
  
  // Send verification request (to be implemented with backend/cloud function)
  private async sendVerificationRequest(
    _guardianId: string,
    phoneNumber: string,
    name: string,
    code: string
  ): Promise<void> {
      // This should trigger a Cloud Function that sends SMS/Email
      // For now, it's a placeholder
    console.log(`Sending verification to ${name} at ${phoneNumber} with code ${code}`);
      
      // TODO: Implement Cloud Function call
      // Example: Call HTTP Cloud Function
      // await fetch('your-cloud-function-url', {
      //   method: 'POST',
      //   body: JSON.stringify({ guardianId, phoneNumber, name })
      // });
    }
  
    // Notify Guardians (for emergency situations)
    async notifyGuardians(
      message: string
    ): Promise<void> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        const guardians = await this.getGuardians();
        const verifiedGuardians = guardians.filter(g => g.verified);
  
        // TODO: Implement Cloud Function to send notifications
        const notificationPromises = verifiedGuardians.map(guardian => 
          this.sendEmergencyNotification(guardian, message)
        );
  
        await Promise.all(notificationPromises);
      } catch (error) {
        console.error('Error notifying guardians:', error);
        throw new Error('Failed to notify emergency contacts');
      }
    }
  
  // Resend verification code
  async resendVerification(guardianId: string, phoneNumber: string, name: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const guardianRef = doc(db, 'users', user.uid, 'guardians', guardianId);
    await updateDoc(guardianRef, { verificationCode: code, verificationSentAt: serverTimestamp() });
    await this.sendVerificationRequest(guardianId, phoneNumber, name, code);
  }
 
    // Send emergency notification (placeholder for Cloud Function)
    private async sendEmergencyNotification(
      guardian: EmergencyContact,
      message: string
    ): Promise<void> {
      console.log(`Notifying ${guardian.name}:`, message);
      // TODO: Implement Cloud Function call for SMS/Call/Email
      // Based on guardian.notificationPreference
    }
  }
  export const guardianService = new GuardianService();