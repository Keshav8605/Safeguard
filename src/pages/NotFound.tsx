import React from 'react'
import Header from '../shared/Header'

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container-responsive py-24 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
          <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
          <a href="/" className="inline-block mt-6 text-[--color-primary] font-semibold">Go home</a>
        </div>
      </main>
    </div>
  )
}


