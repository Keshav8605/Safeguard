import React from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Header(): JSX.Element {
  const [open, setOpen] = React.useState(false)
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="container-responsive h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[--color-primary] text-white font-bold">S</span>
            <span className="font-bold text-gray-900">SafeGuard</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-[--color-primary]' : 'text-gray-700 hover:text-gray-900'}>
            Home
          </NavLink>
          <a href="#learn-more" className="text-gray-700 hover:text-gray-900">Features</a>
          <a href="#get-started" className="text-gray-700 hover:text-gray-900">Get Started</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#get-started"
            className="hidden sm:inline-flex items-center rounded-md bg-[--color-secondary] px-3 py-2 text-white text-sm font-semibold shadow hover:bg-[--color-secondary]/90"
          >
            Download App
          </a>
          <button
            aria-label="Toggle menu"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50"
            onClick={() => setOpen((v) => !v)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container-responsive py-3 flex flex-col gap-2 text-sm">
            <NavLink to="/" onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'text-[--color-primary]' : 'text-gray-700'}>
              Home
            </NavLink>
            <a href="#learn-more" onClick={() => setOpen(false)} className="text-gray-700">Features</a>
            <a href="#get-started" onClick={() => setOpen(false)} className="text-gray-700">Get Started</a>
          </div>
        </div>
      )}
    </header>
  )
}


