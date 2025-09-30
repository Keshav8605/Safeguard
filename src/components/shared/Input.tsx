import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <input {...props} className={`mt-1 w-full border rounded px-3 h-11 focus:outline-none focus:ring ${className}`} />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  )
}

