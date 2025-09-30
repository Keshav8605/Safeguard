import React from 'react'
import { motion } from 'framer-motion'
import Header from '../shared/Header'

export default function Landing(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white">
          <div className="container-responsive py-16 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <span className="inline-flex items-center rounded-full bg-[--color-primary]/10 px-3 py-1 text-sm font-medium text-[--color-primary]">
                  SafeGuard
                </span>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-gray-900">
                  Empowering safety, confidence, and rapid response
                </h1>
                <p className="text-lg text-gray-600">
                  SafeGuard helps women stay safe with immediate alerts, location sharing,
                  trusted contacts, and quick access to emergency resources.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="#get-started"
                    className="inline-flex items-center justify-center rounded-md bg-[--color-primary] px-5 py-3 text-white font-semibold shadow hover:bg-[--color-primary]/90 transition-colors"
                  >
                    Get Started
                  </a>
                  <a
                    href="#learn-more"
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Learn More
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[--color-primary] via-[--color-secondary] to-[--color-primary] opacity-90 shadow-lg"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="learn-more" className="bg-gray-50">
          <div className="container-responsive py-16">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.45 }}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className={`h-10 w-10 rounded-md ${f.bg} mb-3`}></div>
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Get Started / Download */}
        <section id="get-started" className="bg-white">
          <div className="container-responsive py-16 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45 }}
                className="space-y-3"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Get the app</h2>
                <p className="text-gray-600">Use the web app now or install it to your home screen.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="/signup" className="inline-flex items-center justify-center rounded-md bg-[--color-primary] px-4 py-2 text-white font-semibold shadow hover:bg-[--color-primary]/90">Open Web App</a>
                  <a href="/login" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-gray-900 font-semibold hover:bg-gray-50">Log in</a>
                </div>
              </motion.div>
              <div className="text-sm text-gray-600">
                <p className="mb-2 font-medium">Add to Home Screen (PWA):</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Open this site in your mobile browser.</li>
                  <li>Use the browser menu and tap "Add to Home screen".</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="container-responsive py-8 text-sm text-gray-500">
          © {new Date().getFullYear()} SafeGuard. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    title: 'Emergency SOS',
    desc: 'Trigger urgent alerts with your location to trusted contacts instantly.',
    bg: 'bg-[--color-emergency]/10',
  },
  {
    title: 'Live Location',
    desc: 'Share real-time location and route with selected contacts.',
    bg: 'bg-[--color-primary]/10',
  },
  {
    title: 'Safe Check-in',
    desc: 'Automated check-ins and reminders for added peace of mind.',
    bg: 'bg-[--color-success]/10',
  },
  {
    title: 'Resource Hub',
    desc: 'Access helplines, guides, and nearby assistance when needed.',
    bg: 'bg-[--color-secondary]/10',
  },
]


