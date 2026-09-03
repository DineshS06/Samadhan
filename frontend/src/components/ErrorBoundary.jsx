import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
          <div className="max-w-md bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <h1 className="text-lg font-bold text-[#032B5B]">Something went wrong</h1>
            <p className="text-sm text-slate-600 mt-2">
              {this.state.error?.message || 'Unexpected error.'}
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="mt-4 px-4 py-2 bg-[#032B5B] text-white text-sm font-semibold rounded-lg hover:bg-[#0a4080]"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
