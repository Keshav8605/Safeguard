import type { Timestamp } from 'firebase/firestore'

export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'reported' | 'in_review' | 'resolved' | 'dismissed'

export type Evidence = {
  type: 'photo' | 'video' | 'audio' | 'document'
  url: string
  uploadedAt: Timestamp
  metadata?: Record<string, any>
}

export type LocationData = {
  coordinates: { latitude: number; longitude: number }
  address?: string
}

export type Incident = {
  id: string
  userId: string
  type: string
  description?: string
  severity: Severity
  status: IncidentStatus
  timestamp?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  guardianNotified: boolean
  authoritiesContacted: boolean
  evidence: Evidence[]
  location: LocationData
}

export type EmergencyContact = {
  id: string
  userId: string
  name: string
  phoneNumber: string
  email?: string
  priority: number
  verified: boolean
  verificationCode?: string
  verificationSentAt?: Timestamp
  verifiedAt?: Timestamp
  photoUrl?: string
  relationship?: 'Family' | 'Friend' | 'Colleague' | 'Other'
  archived?: boolean
  availability?: {
    online?: boolean
    dnd?: boolean
    available?: boolean
    quietHours?: { start: string; end: string }
  }
  notificationPreference?: 'sms' | 'email' | 'call'
  notificationPrefs?: {
    sms?: boolean
    push?: boolean
    email?: boolean
    emergencyOnly?: boolean
  }
  responseStats?: {
    delivered?: number
    read?: number
    responded?: number
    notResponded?: number
    avgResponseMs?: number
    lastResponseAt?: Timestamp
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

