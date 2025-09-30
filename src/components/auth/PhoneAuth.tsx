import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

export default function PhoneAuth({ onVerified }: { onVerified?: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [seconds, setSeconds] = useState(60)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    inputs.current[0]?.focus()
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])

  function onChange(index: number, value: string) {
    const v = value.replace(/\D/g, '').slice(0, 1)
    const next = [...digits]; next[index] = v; setDigits(next)
    if (v && index < 5) inputs.current[index + 1]?.focus()
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
  }

  async function verify() {
    const code = digits.join('')
    try {
      const confirmation = (window as any)._phoneConfirmation
      if (!confirmation) throw new Error('No OTP session found')
      await confirmation.confirm(code)
      toast.success('Phone verified')
      onVerified?.()
    } catch (e: any) {
      toast.error(e?.message || 'Invalid code')
    }
  }

  function resend() {
    if (seconds > 0) return
    setSeconds(60)
    toast('Resent OTP (mock)')
  }

  return (
    <div className="space-y-4" aria-label="Phone verification">
      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            inputMode="numeric"
            className="w-12 h-12 text-center border rounded"
            value={d}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button onClick={verify} className="h-12 px-4 rounded bg-black text-white">Verify</button>
        <button onClick={resend} disabled={seconds > 0} className="h-12 px-4 rounded border">{seconds > 0 ? `Resend in ${seconds}s` : 'Resend OTP'}</button>
      </div>
    </div>
  )
}

