import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { checkInService } from '@/services/checkin.service'
import toast from 'react-hot-toast'

export default function CheckInButton() {
  const [loading, setLoading] = useState(false)
  async function onclick() {
    setLoading(true)
    try {
      await checkInService.quickCheckIn('manual')
      toast.success("Checked in. You're marked safe.")
    } catch (e: any) {
      toast.error(e?.message || 'Check-in failed')
    } finally {
      setLoading(false)
    }
  }
  return (
    <motion.button onClick={onclick} disabled={loading} className="w-full h-12 rounded bg-green-600 text-white font-semibold shadow" whileTap={{ scale: 0.98 }}>
      {loading ? 'Checking in…' : "I'm Safe"}
    </motion.button>
  )
}

