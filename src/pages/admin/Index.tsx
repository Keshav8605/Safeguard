import React from 'react'
import { Link, Outlet } from 'react-router-dom'

export default function AdminIndex() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <nav className="flex gap-2">
        <Link className="h-10 px-4 rounded border" to="users">Users</Link>
        <Link className="h-10 px-4 rounded border" to="incidents">Incidents</Link>
        <Link className="h-10 px-4 rounded border" to="community">Community</Link>
      </nav>
      <Outlet />
    </div>
  )
}

