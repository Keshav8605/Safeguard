import React, { useEffect, useState } from 'react'
import { communityService, type CommunityAlert, type SafetyTip } from '@/services/community.service'
import { motion } from 'framer-motion'

type Tab = 'alerts' | 'tips'

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>('alerts')
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Community</h1>
      <div className="flex gap-2">
        <button onClick={() => setTab('alerts')} className={`h-10 px-4 rounded ${tab==='alerts'?'bg-black text-white':'border'}`}>Alerts</button>
        <button onClick={() => setTab('tips')} className={`h-10 px-4 rounded ${tab==='tips'?'bg-black text-white':'border'}`}>Safety Tips</button>
      </div>
      {tab === 'alerts' ? <AlertsFeed /> : <TipsFeed />}
    </div>
  )
}

function AlertsFeed() {
  const [items, setItems] = useState<CommunityAlert[]>([])
  const [cursor, setCursor] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => { void load(true) }, [])
  async function load(reset = false) {
    setLoading(true)
    const { items: next, cursor: cur } = await communityService.listAlerts({ after: reset?null:cursor, limitCount: 10 })
    setItems((prev) => reset ? next : [...prev, ...next])
    setCursor(cur)
    setLoading(false)
  }
  return (
    <div className="space-y-3">
      {items.map((a) => (
        <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{a.title}</div>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{a.type}</span>
          </div>
          <p className="text-sm text-gray-700 mt-1">{a.body}</p>
          <div className="text-xs text-gray-500 mt-2">{a.severity || '—'} • {(a.createdAt as any)?.toDate?.()?.toLocaleString?.() || ''}</div>
        </motion.div>
      ))}
      <button disabled={!cursor || loading} onClick={() => load(false)} className="h-10 w-full rounded border">{loading ? 'Loading…' : cursor ? 'Load more' : 'No more'}</button>
    </div>
  )
}

function TipsFeed() {
  const [items, setItems] = useState<SafetyTip[]>([])
  const [cursor, setCursor] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('general')
  const [file, setFile] = useState<File | undefined>()

  useEffect(() => { void reload() }, [])
  async function reload() {
    setLoading(true)
    const { items: next, cursor: cur } = await communityService.listTips({ limitCount: 10 })
    setItems(next); setCursor(cur); setLoading(false)
  }
  async function loadMore() {
    if (!cursor) return
    setLoading(true)
    const { items: next, cursor: cur } = await communityService.listTips({ limitCount: 10, after: cursor })
    setItems((prev) => [...prev, ...next]); setCursor(cur); setLoading(false)
  }
  async function submitTip() {
    if (!title || !body) return
    await communityService.createTip({ title, body, category }, file)
    setTitle(''); setBody(''); setFile(undefined)
    await reload()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        {items.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{t.title}</div>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{t.category}</span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{t.body}</p>
            {t.mediaUrl && <img src={t.mediaUrl} alt="tip" className="mt-2 rounded" />}
            <div className="text-xs text-gray-500 mt-2">{(t.createdAt as any)?.toDate?.()?.toLocaleString?.() || ''}</div>
          </motion.div>
        ))}
        <button disabled={!cursor || loading} onClick={loadMore} className="h-10 w-full rounded border">{loading ? 'Loading…' : cursor ? 'Load more' : 'No more'}</button>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Share a Safety Tip</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full h-11 border rounded px-3" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Your advice" className="w-full border rounded p-3" rows={4} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-11 border rounded px-2">
          <option value="general">General</option>
          <option value="travel">Travel</option>
          <option value="home">Home</option>
          <option value="work">Workplace</option>
          <option value="transport">Public Transport</option>
        </select>
        <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0])} />
        <button onClick={submitTip} className="h-10 w-full rounded bg-black text-white">Post Tip</button>
      </div>
    </div>
  )
}

