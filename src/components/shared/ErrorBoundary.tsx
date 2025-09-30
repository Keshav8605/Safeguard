import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error?: any }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center p-6">
          <div className="max-w-xl w-full bg-white border rounded p-6 text-center">
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-4">Please refresh the page. If the issue persists, check the console for details.</p>
            <pre className="text-left whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">{String(this.state.error)}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}


