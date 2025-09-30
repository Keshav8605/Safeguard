// src/services/incident.service.ts
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    GeoPoint
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
  import { db, storage, auth } from '../config/firebase';
  import { Incident, Evidence, LocationData } from '../types/firebase.types';
  import { SafetyDataService } from './safety-scoring';
  
  export class IncidentService {
    private incidentsCollection = collection(db, 'incidents');
  private draftKey = 'sg_incident_draft';

  // Draft helpers (localStorage)
  saveDraft(partial: any): void {
    try {
      localStorage.setItem(this.draftKey, JSON.stringify({ ...partial, _savedAt: Date.now() }));
    } catch {}
  }

  loadDraft(): any | null {
    try {
      const raw = localStorage.getItem(this.draftKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  clearDraft(): void {
    try { localStorage.removeItem(this.draftKey) } catch {}
  }
  
  // Report New Incident
    async reportIncident(
      incidentData: Omit<Incident, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
      evidenceFiles?: File[]
    ): Promise<string> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        // Upload evidence files first
        let evidence: Evidence[] = [];
        if (evidenceFiles && evidenceFiles.length > 0) {
          evidence = await this.uploadEvidence(user.uid, evidenceFiles);
        }
  
      // Ensure timestamp is valid; fallback to now
      const eventTime = (incidentData as any).timestamp instanceof Date
        ? (incidentData as any).timestamp
        : (typeof (incidentData as any).timestamp === 'object' ? (incidentData as any).timestamp : new Date());

      const incident: Omit<Incident, 'id'> = {
          ...incidentData,
          userId: user.uid,
          evidence,
          status: 'reported',
          guardianNotified: false,
          authoritiesContacted: false,
        timestamp: eventTime as any,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
        };
  
        const docRef = await addDoc(this.incidentsCollection, incident);
  
        // Notify guardians and invalidate safety score cache if high severity
        if (incidentData.severity === 'high' || incidentData.severity === 'critical') {
          await this.notifyGuardiansOfIncident(docRef.id);
          try { await SafetyDataService.invalidateScoreCache((incidentData as any).geohash || ''); } catch {}
        }
  
        return docRef.id;
      } catch (error) {
        console.error('Error reporting incident:', error);
        throw new Error('Failed to report incident');
      }
    }
  
  // Upload Evidence Files
    private async uploadEvidence(userId: string, files: File[]): Promise<Evidence[]> {
      const timestamp = Date.now();
      const evidence: Evidence[] = [];
  
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
      // Skip files over 10MB
      if (file.size > 10 * 1024 * 1024) {
        console.warn('Skipping large file (>10MB):', file.name);
        continue;
      }
        const fileName = `${timestamp}_${i}_${file.name}`;
        const storageRef = ref(storage, `incidents/${userId}/${fileName}`);
  
        try {
          // Upload file
          await uploadBytes(storageRef, file);
          
          // Get download URL
          const url = await getDownloadURL(storageRef);
  
          // Determine evidence type
          let type: Evidence['type'] = 'document';
          if (file.type.startsWith('image/')) type = 'photo';
          else if (file.type.startsWith('video/')) type = 'video';
          else if (file.type.startsWith('audio/')) type = 'audio';
  
          evidence.push({
            type,
            url,
            uploadedAt: serverTimestamp() as Timestamp,
            metadata: {
              size: file.size,
              mimeType: file.type
            }
          });
        } catch (error) {
          console.error('Error uploading evidence:', error);
        }
      }
  
      return evidence;
    }
  
    // Get User's Incidents
    async getUserIncidents(limitCount: number = 50): Promise<Incident[]> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        try {
          const q = query(
            this.incidentsCollection,
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Incident));
        } catch (err: any) {
          // Fallback if composite index not yet created
          if (err?.code === 'failed-precondition') {
            const qNoOrder = query(
              this.incidentsCollection,
              where('userId', '==', user.uid),
              limit(limitCount)
            );
            const snapshot = await getDocs(qNoOrder);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
          }
          throw err;
        }
      } catch (error) {
        console.error('Error fetching incidents:', error);
        throw new Error('Failed to fetch incidents');
      }
    }
  
    // Get Incident by ID
    async getIncidentById(incidentId: string): Promise<Incident | null> {
      try {
        const docRef = doc(db, 'incidents', incidentId);
        const docSnap = await getDoc(docRef);
  
        if (!docSnap.exists()) return null;
  
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Incident;
      } catch (error) {
        console.error('Error fetching incident:', error);
        return null;
      }
    }
  
    // Get Incidents by Location (for safety scoring)
    async getIncidentsByLocation(
      latitude: number,
      longitude: number,
      radiusKm: number = 1
    ): Promise<Incident[]> {
      try {
        // Calculate approximate bounds
        const latDiff = radiusKm / 111; // 1 degree latitude ≈ 111km
        const lonDiff = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
  
        const minLat = latitude - latDiff;
        const maxLat = latitude + latDiff;
        const minLon = longitude - lonDiff;
        const maxLon = longitude + lonDiff;
  
        // Query incidents in the area
        const q = query(
          this.incidentsCollection,
          where('location.coordinates.latitude', '>=', minLat),
          where('location.coordinates.latitude', '<=', maxLat),
          orderBy('location.coordinates.latitude'),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
  
        const snapshot = await getDocs(q);
        
        // Filter by longitude and calculate actual distance
        const incidents = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Incident))
          .filter(incident => {
            const incLon = incident.location.coordinates.longitude;
            return incLon >= minLon && incLon <= maxLon;
          });
  
        return incidents;
      } catch (error) {
        console.error('Error fetching incidents by location:', error);
        throw new Error('Failed to fetch nearby incidents');
      }
    }
  
    // Update Incident
    async updateIncident(incidentId: string, updates: Partial<Incident>): Promise<void> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        const incidentRef = doc(db, 'incidents', incidentId);
        
        // Verify ownership
        const incidentSnap = await getDoc(incidentRef);
        if (!incidentSnap.exists() || incidentSnap.data().userId !== user.uid) {
          throw new Error('Unauthorized');
        }
  
        await updateDoc(incidentRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating incident:', error);
        throw new Error('Failed to update incident');
      }
    }
  
    // Delete Incident
    async deleteIncident(incidentId: string): Promise<void> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        const incidentRef = doc(db, 'incidents', incidentId);
        
        // Verify ownership
        const incidentSnap = await getDoc(incidentRef);
        if (!incidentSnap.exists() || incidentSnap.data().userId !== user.uid) {
          throw new Error('Unauthorized');
        }
  
        const incident = incidentSnap.data() as Incident;
  
        // Delete associated evidence from storage
        if (incident.evidence && incident.evidence.length > 0) {
          await this.deleteEvidence(incident.evidence);
        }
  
        // Delete incident document
        await deleteDoc(incidentRef);
      } catch (error) {
        console.error('Error deleting incident:', error);
        throw new Error('Failed to delete incident');
      }
    }
  
    // Delete Evidence Files
    private async deleteEvidence(evidence: Evidence[]): Promise<void> {
      const deletePromises = evidence.map(async (item) => {
        try {
          const fileRef = ref(storage, item.url);
          await deleteObject(fileRef);
        } catch (error) {
          console.error('Error deleting evidence file:', error);
        }
      });
  
      await Promise.all(deletePromises);
    }
  
    // Add Evidence to Existing Incident
    async addEvidence(incidentId: string, files: File[]): Promise<void> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        const incidentRef = doc(db, 'incidents', incidentId);
        const incidentSnap = await getDoc(incidentRef);
  
        if (!incidentSnap.exists() || incidentSnap.data().userId !== user.uid) {
          throw new Error('Unauthorized');
        }
  
        const incident = incidentSnap.data() as Incident;
        const newEvidence = await this.uploadEvidence(user.uid, files);
  
        await updateDoc(incidentRef, {
          evidence: [...(incident.evidence || []), ...newEvidence],
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error adding evidence:', error);
        throw new Error('Failed to add evidence');
      }
    }
  
    // Mark Guardians as Notified
    async markGuardiansNotified(incidentId: string): Promise<void> {
      try {
        const incidentRef = doc(db, 'incidents', incidentId);
        await updateDoc(incidentRef, {
          guardianNotified: true,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error marking guardians notified:', error);
      }
    }
  
    // Mark Authorities Contacted
    async markAuthoritiesContacted(incidentId: string): Promise<void> {
      try {
        const incidentRef = doc(db, 'incidents', incidentId);
        await updateDoc(incidentRef, {
          authoritiesContacted: true,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error marking authorities contacted:', error);
      }
    }
  
    // Notify Guardians of Incident (placeholder for Cloud Function)
    private async notifyGuardiansOfIncident(incidentId: string): Promise<void> {
      console.log(`Notifying guardians about incident: ${incidentId}`);
      
      // TODO: Implement Cloud Function call
      // This should trigger notifications to all verified guardians
    }
  
    // Get Incident Statistics
    async getIncidentStats(): Promise<{
      total: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
      byStatus: Record<string, number>;
    }> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
  
        const incidents = await this.getUserIncidents(1000);
  
        const stats = {
          total: incidents.length,
          byType: {} as Record<string, number>,
          bySeverity: {} as Record<string, number>,
          byStatus: {} as Record<string, number>
        };
  
        incidents.forEach(incident => {
          // Count by type
          stats.byType[incident.type] = (stats.byType[incident.type] || 0) + 1;
          
          // Count by severity
          stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
          
          // Count by status
          stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
        });
  
        return stats;
      } catch (error) {
        console.error('Error getting incident stats:', error);
        throw new Error('Failed to get statistics');
      }
  }

  // Subscribe to user's incidents in real-time
  subscribeUserIncidents(limitCount: number, onChange: (list: Incident[]) => void, onError?: (e: any) => void) {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    const buildOrdered = () => query(
      this.incidentsCollection,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount || 50)
    );
    const buildUnordered = () => query(
      this.incidentsCollection,
      where('userId', '==', user.uid),
      limit(limitCount || 50)
    );

    let unsubscribe: () => void = () => {};
    const startUnordered = () => {
      try {
        unsubscribe();
      } catch {}
      unsubscribe = onSnapshot(buildUnordered(), (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Incident));
        onChange(items);
      }, (err) => onError?.(err));
    };

    unsubscribe = onSnapshot(buildOrdered(), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Incident));
      onChange(items);
    }, (err: any) => {
      if (err?.code === 'failed-precondition') {
        startUnordered();
      } else {
        onError?.(err);
      }
    });

    return () => { try { unsubscribe(); } catch {} };
  }
}

export const incidentService = new IncidentService();