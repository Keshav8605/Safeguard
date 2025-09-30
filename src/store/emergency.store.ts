import { create } from 'zustand'

type EmergencyState = {
  active: boolean
  sessionId: string | null
  endsAt: number | null
  disabledUntil: number | null
  setDisabled(ms: number): void
  start(sessionId: string, durationMs: number): void
  resolve(): void
  extend(ms: number): void
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  active: false,
  sessionId: null,
  endsAt: null,
  disabledUntil: null,
  setDisabled(ms) {
    set({ disabledUntil: Date.now() + ms })
  },
  start(sessionId, durationMs) {
    set({ active: true, sessionId, endsAt: Date.now() + durationMs })
  },
  resolve() { set({ active: false, sessionId: null, endsAt: null }) },
  extend(ms) {
    const { endsAt } = get()
    if (!endsAt) return
    set({ endsAt: endsAt + ms })
  },
}))

