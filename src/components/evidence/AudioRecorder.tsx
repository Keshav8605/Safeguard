import React, { useEffect, useRef, useState } from 'react'
import { evidenceService } from '@/services/evidence.service'
import toast from 'react-hot-toast'

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<BlobPart[]>([])

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      mediaRef.current = rec
      chunks.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data) }
      rec.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        await evidenceService.enqueueAndUpload({ type: 'audio', localBlob: blob, size: blob.size, metadata: { codec: 'webm' } })
        toast.success('Audio saved to vault')
      }
      rec.start()
      setRecording(true)
    } catch (e: any) {
      toast.error(e?.message || 'Microphone access denied')
    }
  }
  function stop() { mediaRef.current?.stop(); setRecording(false); setPaused(false) }
  function togglePause() { if (!mediaRef.current) return; if (!paused) { mediaRef.current.pause(); setPaused(true) } else { mediaRef.current.resume(); setPaused(false) } }

  return (
    <div className="rounded border p-4 bg-white shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${recording ? 'bg-red-600' : 'bg-gray-300'}`} />
        <span className="text-sm">{recording ? (paused ? 'Paused' : 'Recording…') : 'Idle'}</span>
      </div>
      <div className="flex gap-2">
        {!recording ? <button onClick={start} className="h-10 px-4 rounded bg-black text-white">Start</button> : (
          <>
            <button onClick={togglePause} className="h-10 px-4 rounded border">{paused ? 'Resume' : 'Pause'}</button>
            <button onClick={stop} className="h-10 px-4 rounded border">Stop & Save</button>
          </>
        )}
      </div>
    </div>
  )
}

