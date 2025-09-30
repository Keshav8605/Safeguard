import { create } from 'zustand'

export type FakeCaller = { name: string; phone: string; photoUrl?: string }

type State = {
  active: boolean
  incoming: boolean
  startedAt: number | null
  caller: FakeCaller
  ringtone: string | null
  setCaller(caller: FakeCaller): void
  triggerIncoming(): void
  answer(): void
  end(): void
}

export const useFakeCallStore = create<State>((set, get) => ({
  active: false,
  incoming: false,
  startedAt: null,
  caller: { name: 'Unknown', phone: '+1 (555) 123-4567' },
  ringtone: null,
  setCaller(caller) { set({ caller }) },
  triggerIncoming() { set({ incoming: true }) },
  answer() { set({ active: true, incoming: false, startedAt: Date.now() }) },
  end() { set({ active: false, incoming: false, startedAt: null }) },
}))

