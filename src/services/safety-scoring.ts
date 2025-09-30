import { db } from '@/config/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  GeoPoint,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import * as geohash from 'ngeohash'

export interface Location {
  lat: number
  lng: number
}

export type IncidentType = 'harassment' | 'assault' | 'theft' | 'other'
export type ReportType = 'safe' | 'unsafe' | 'alert'

export interface Incident {
  id: string
  type: IncidentType
  timestamp: number
  location: Location
  severity: number
  description?: string
  verified: boolean
  reportedBy: string
}

export interface CommunityReport {
  id: string
  rating: number
  timestamp: number
  reportType: ReportType
  comment?: string
  reportedBy: string
  location: Location
}

export interface AreaData {
  geohash: string
  location: Location
  incidents: Incident[]
  populationDensity: number
  streetLights: number
  policeStationDistance: number
  policePatrolFrequency: number
  avgResponseTime: number
  communityReports: CommunityReport[]
  lastUpdated: number
}

export interface SafetyScore {
  overall: number
  breakdown: {
    timeOfDay: number
    historicalIncidents: number
    populationDensity: number
    lighting: number
    policePresence: number
    communityReports: number
  }
  confidence: number
  level: 'Very Safe' | 'Safe' | 'Moderate' | 'Unsafe' | 'Very Unsafe'
  color: string
  areaId: string
  calculatedAt: number
}

export class SafetyDataService {
  static async getAreaData(location: Location): Promise<AreaData> {
    const hash = geohash.encode(location.lat, location.lng, 6)
    try {
      const areaDoc = await getDoc(doc(db, 'safety_areas', hash))
      const base = areaDoc.exists() ? areaDoc.data() : {}

      const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000
      const incQ = query(
        collection(db, 'incidents'),
        where('geohash', '==', hash),
        where('timestamp', '>=', Timestamp.fromMillis(sixMonthsAgo)),
        orderBy('timestamp', 'desc'),
        limit(100),
      )
      const incSnap = await getDocs(incQ)
      const incidents: Incident[] = incSnap.docs.map((d) => ({
        id: d.id,
        type: d.data().type,
        timestamp: d.data().timestamp.toMillis(),
        location: { lat: d.data().location.latitude, lng: d.data().location.longitude },
        severity: d.data().severity,
        description: d.data().description,
        verified: d.data().verified,
        reportedBy: d.data().reportedBy,
      }))

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      const repQ = query(
        collection(db, 'community_reports'),
        where('geohash', '==', hash),
        where('timestamp', '>=', Timestamp.fromMillis(thirtyDaysAgo)),
        orderBy('timestamp', 'desc'),
        limit(50),
      )
      const repSnap = await getDocs(repQ)
      const communityReports: CommunityReport[] = repSnap.docs.map((d) => ({
        id: d.id,
        rating: d.data().rating,
        timestamp: d.data().timestamp.toMillis(),
        reportType: d.data().reportType,
        comment: d.data().comment,
        reportedBy: d.data().reportedBy,
        location: { lat: d.data().location.latitude, lng: d.data().location.longitude },
      }))

      return {
        geohash: hash,
        location,
        incidents,
        communityReports,
        populationDensity: base.populationDensity || 1000,
        streetLights: base.streetLights || 60,
        policeStationDistance: base.policeStationDistance || 2,
        policePatrolFrequency: base.policePatrolFrequency || 5,
        avgResponseTime: base.avgResponseTime || 10,
        lastUpdated: base.lastUpdated?.toMillis?.() || Date.now(),
      }
    } catch {
      return {
        geohash: hash,
        location,
        incidents: [],
        communityReports: [],
        populationDensity: 1000,
        streetLights: 60,
        policeStationDistance: 2,
        policePatrolFrequency: 5,
        avgResponseTime: 10,
        lastUpdated: Date.now(),
      }
    }
  }

  static async reportIncident(incident: Omit<Incident, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'incidents'))
    const hash = geohash.encode(incident.location.lat, incident.location.lng, 6)
    await setDoc(ref, {
      ...incident,
      geohash: hash,
      location: new GeoPoint(incident.location.lat, incident.location.lng),
      timestamp: Timestamp.fromMillis(incident.timestamp),
      createdAt: Timestamp.now(),
    })
    await this.invalidateScoreCache(hash)
    return ref.id
  }

  static async submitCommunityReport(report: Omit<CommunityReport, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'community_reports'))
    const hash = geohash.encode(report.location.lat, report.location.lng, 6)
    await setDoc(ref, {
      ...report,
      geohash: hash,
      location: new GeoPoint(report.location.lat, report.location.lng),
      timestamp: Timestamp.fromMillis(report.timestamp),
      upvotes: 0,
      downvotes: 0,
      createdAt: Timestamp.now(),
    })
    await this.invalidateScoreCache(hash)
    return ref.id
  }

  static async invalidateScoreCache(geoh: string): Promise<void> {
    const batch = writeBatch(db)
    for (let h = 0; h < 24; h++) batch.delete(doc(db, 'safety_scores', `${geoh}_${h}`))
    await batch.commit()
  }

  static async getOrCalculateScore(location: Location, currentTime: Date): Promise<SafetyScore> {
    const hash = geohash.encode(location.lat, location.lng, 6)
    const hour = currentTime.getHours()
    const cacheId = `${hash}_${hour}`
    const cached = await getDoc(doc(db, 'safety_scores', cacheId))
    if (cached.exists()) {
      const ex = cached.data().expiresAt?.toMillis?.() || 0
      if (Date.now() < ex) {
        return {
          overall: cached.data().score,
          breakdown: cached.data().breakdown,
          confidence: cached.data().confidence,
          level: cached.data().level,
          color: cached.data().color,
          areaId: hash,
          calculatedAt: cached.data().calculatedAt.toMillis(),
        }
      }
    }
    const area = await this.getAreaData(location)
    const score = SafetyScorer.calculateSafetyScore(location, currentTime, area)
    const expiresAt = new Date(currentTime)
    expiresAt.setHours(expiresAt.getHours() + 1)
    await setDoc(doc(db, 'safety_scores', cacheId), {
      geohash: hash,
      hour,
      score: score.overall,
      breakdown: score.breakdown,
      confidence: score.confidence,
      level: score.level,
      color: score.color,
      calculatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
    })
    await this.updateScoreHistory(hash, currentTime, score.overall)
    return score
  }

  private static async updateScoreHistory(geoh: string, date: Date, score: number) {
    const day = date.toISOString().split('T')[0]
    const h = date.getHours()
    const ref = doc(db, 'score_history', `${geoh}_${day}`)
    const docSnap = await getDoc(ref)
    if (docSnap.exists()) {
      const hourly = docSnap.data().hourlyScores || {}
      hourly[h] = score
      const values = Object.values(hourly) as number[]
      await updateDoc(ref, {
        hourlyScores: hourly,
        avgScore: values.reduce((a, b) => a + b, 0) / values.length,
        minScore: Math.min(...values),
        maxScore: Math.max(...values),
      })
    } else {
      await setDoc(ref, {
        geohash: geoh,
        date: day,
        hourlyScores: { [h]: score },
        avgScore: score,
        minScore: score,
        maxScore: score,
      })
    }
  }
}

export class SafetyScorer {
  private static WEIGHTS = {
    timeOfDay: 0.2,
    historicalIncidents: 0.3,
    populationDensity: 0.15,
    lighting: 0.15,
    policePresence: 0.1,
    communityReports: 0.1,
  }
  private static SEVERITY: Record<IncidentType, number> = {
    harassment: 1,
    theft: 2,
    assault: 3,
    other: 1.5,
  }
  private static DECAY_FACTOR = 30 * 24 * 60 * 60 * 1000

  static calculateSafetyScore(location: Location, currentTime: Date, area: AreaData): SafetyScore {
    const hour = currentTime.getHours()
    const timeScore = this.timeScore(hour)
    const incScore = this.incidentScore(area.incidents, currentTime.getTime())
    const densityScore = this.densityScore(area.populationDensity, hour)
    const lightScore = this.lightingScore(area.streetLights, hour)
    const policeScore = this.policeScore(area.policeStationDistance, area.policePatrolFrequency, area.avgResponseTime)
    const communityScore = this.communityScore(area.communityReports, currentTime.getTime())
    const overall =
      timeScore * this.WEIGHTS.timeOfDay +
      incScore * this.WEIGHTS.historicalIncidents +
      densityScore * this.WEIGHTS.populationDensity +
      lightScore * this.WEIGHTS.lighting +
      policeScore * this.WEIGHTS.policePresence +
      communityScore * this.WEIGHTS.communityReports
    const confidence = this.confidence(area)
    const { level, color } = this.level(overall)
    return {
      overall: Math.round(overall),
      breakdown: {
        timeOfDay: Math.round(timeScore),
        historicalIncidents: Math.round(incScore),
        populationDensity: Math.round(densityScore),
        lighting: Math.round(lightScore),
        policePresence: Math.round(policeScore),
        communityReports: Math.round(communityScore),
      },
      confidence,
      level,
      color,
      areaId: area.geohash,
      calculatedAt: currentTime.getTime(),
    }
  }

  private static timeScore(h: number) { if (h >= 8 && h < 18) return 85; if (h >= 5 && h < 8) return 60; if (h >= 18 && h < 21) return 55; return 30 }

  private static incidentScore(inc: Incident[], now: number) {
    if (!inc.length) return 100
    let w = 0
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000
    inc.forEach((i) => {
      if (i.timestamp < sixMonthsAgo) return
      const age = now - i.timestamp
      const decay = Math.exp(-age / this.DECAY_FACTOR)
      const ver = i.verified ? 1.5 : 1
      w += (this.SEVERITY[i.type] || 1) * decay * ver
    })
    return Math.max(0, 100 - w * 10)
  }

  private static densityScore(d: number, h: number) {
    const day = h >= 8 && h < 18
    if (d >= 1000 && d <= 5000) return day ? 90 : 70
    if (d >= 500 && d < 1000) return day ? 80 : 60
    if (d >= 5000 && d < 10000) return day ? 85 : 65
    if (d < 500) return day ? 60 : 30
    return day ? 75 : 55
  }

  private static lightingScore(coverage: number, h: number) { return h >= 6 && h < 19 ? 95 : coverage }

  private static policeScore(distance: number, patrols: number, response: number) {
    let ds = 100; if (distance > 5) ds = 50; else if (distance > 2) ds = 70; else if (distance > 1) ds = 85
    const ps = Math.min(100, patrols * 10)
    let rs = 100; if (response > 20) rs = 40; else if (response > 10) rs = 70; else if (response > 5) rs = 85
    return ds * 0.4 + ps * 0.3 + rs * 0.3
  }

  private static communityScore(reports: CommunityReport[], now: number) {
    if (!reports.length) return 70
    const thirty = now - 30 * 24 * 60 * 60 * 1000
    const recent = reports.filter((r) => r.timestamp > thirty)
    if (!recent.length) return 70
    let total = 0, sum = 0
    recent.forEach((r) => {
      const age = now - r.timestamp
      const weight = Math.exp(-age / (7 * 24 * 60 * 60 * 1000))
      let norm = 0
      if (r.reportType === 'safe') norm = r.rating * 20
      else if (r.reportType === 'unsafe') norm = 100 - r.rating * 20
      else norm = 20
      sum += norm * weight
      total += weight
    })
    return total > 0 ? sum / total : 70
  }

  private static confidence(area: AreaData) {
    let c = 0
    if (area.incidents.length >= 10) c += 30; else if (area.incidents.length >= 5) c += 20; else if (area.incidents.length >= 1) c += 10
    if (area.communityReports.length >= 20) c += 30; else if (area.communityReports.length >= 10) c += 20; else if (area.communityReports.length >= 5) c += 10
    if (area.avgResponseTime > 0) c += 20
    if (area.streetLights > 0) c += 10
    if (area.populationDensity > 0) c += 10
    return c
  }

  private static level(score: number): { level: SafetyScore['level']; color: string } {
    if (score >= 80) return { level: 'Very Safe', color: '#22c55e' }
    if (score >= 60) return { level: 'Safe', color: '#84cc16' }
    if (score >= 40) return { level: 'Moderate', color: '#eab308' }
    if (score >= 20) return { level: 'Unsafe', color: '#f97316' }
    return { level: 'Very Unsafe', color: '#ef4444' }
  }
}

export function getNearbyGeohashes(location: Location, precision = 6): string[] {
  const center = geohash.encode(location.lat, location.lng, precision)
  const neighbors = geohash.neighbors(center)
  return [center, ...Object.values(neighbors)]
}

