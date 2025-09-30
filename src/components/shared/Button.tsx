import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }

export default function Button({ loading, children, className = '', ...props }: Props) {
  return (
    <button {...props} className={`inline-flex items-center justify-center rounded px-4 py-2 font-medium ${className}`}>
      {loading ? '...' : children}
    </button>
  )
}

