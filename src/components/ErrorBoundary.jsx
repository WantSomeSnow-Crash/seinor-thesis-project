import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-center gap-6 bg-black text-center px-6">
          <span className="text-6xl">🎸</span>
          <div className="flex flex-col gap-2">
            <h1 className="text-white font-bold text-2xl">Something went wrong</h1>
            <p className="text-slate-400 text-sm">Reload the page to keep playing.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="glass-btn text-base"
            style={{ padding: '0.75rem 2rem' }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
