import React, { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Legend } from 'recharts'
import { checkInService } from '@/services/checkin.service'
import { SafetyDataService } from '@/services/safety-scoring'
import { locationService } from '@/services/location.service'

const COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444']

export default function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [scoreData, setScoreData] = useState<{ date: string; score: number }[]>([])
  const [checkins, setCheckins] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)

  useEffect(() => { void load() }, [range])
  async function load() {
    const now = new Date()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const data: { date: string; score: number }[] = []
    // Fetch score per day (cached hourly; we take midday)
    const loc = await locationService.getCurrentPosition().catch(() => null)
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(12, 0, 0, 0)
      const s = loc ? await SafetyDataService.getOrCalculateScore({ lat: loc.latitude, lng: loc.longitude }, d) : { overall: 50 }
      data.push({ date: d.toISOString().slice(0, 10), score: (s as any).overall })
    }
    setScoreData(data)
    const hist = await checkInService.getHistory(365)
    setCheckins(hist.length)
    const st = await checkInService.getStreak(); setStreak(st.count)
  }

  const scoreZones = useMemo(() => ([
    { from: 0, to: 19, color: '#ef4444' },
    { from: 20, to: 39, color: '#f97316' },
    { from: 40, to: 59, color: '#eab308' },
    { from: 60, to: 79, color: '#84cc16' },
    { from: 80, to: 100, color: '#22c55e' },
  ]), [])

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <select value={range} onChange={(e) => setRange(e.target.value as any)} className="h-10 border rounded px-2">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border bg-white p-4 shadow-sm">
          <h2 className="font-semibold mb-2">Personal Safety Score Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#22c55e" fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-2 mt-2">
            {scoreZones.map((z) => (
              <div key={z.from} className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded" style={{ background: z.color }} /> {z.from}-{z.to}</div>
            ))}
          </div>
        </div>
        <div className="rounded border bg-white p-4 shadow-sm">
          <h2 className="font-semibold mb-2">Check-in Streak</h2>
          <div className="text-4xl font-extrabold">{streak} days</div>
          <div className="text-sm text-gray-600">Total check-ins: {checkins}</div>
          <div className="h-40 mt-4 grid place-items-center text-gray-500 text-sm">Calendar heatmap (todo)</div>
        </div>
      </div>

      <div className="rounded border bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Feature Usage</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ name: 'SOS', v: 2 }, { name: 'Check-ins', v: checkins }, { name: 'Incidents', v: 1 }, { name: 'Evidence', v: 3 }] }>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="v" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

