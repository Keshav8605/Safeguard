import { useEffect, useRef, useState } from 'react'

export function useVoiceActivation(enabled: boolean, onTrigger: () => void) {
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) { setSupported(false); return }
    setSupported(true)
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(' ').toLowerCase()
      if (transcript.includes('help me') || transcript.includes('emergency')) {
        onTrigger()
      }
    }
    recognitionRef.current = rec
  }, [onTrigger])

  useEffect(() => {
    const rec = recognitionRef.current
    if (!rec) return
    if (enabled) {
      try { rec.start() } catch {}
    } else {
      try { rec.stop() } catch {}
    }
    return () => { try { rec.stop() } catch {} }
  }, [enabled])

  return { supported }
}

