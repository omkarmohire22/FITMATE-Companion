import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('🔥 Error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    const { hasError, error } = this.state

    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white px-6">
          <div className="max-w-md w-full bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 text-center">
            
            <div className="text-red-500 text-5xl mb-4">⚠️</div>

            <h1 className="text-2xl font-bold mb-3">
              Something went wrong
            </h1>

            <p className="text-gray-400 mb-6 text-sm">
              {error?.message || 'An unexpected error occurred in the application.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold"
              >
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                className="px-5 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition font-semibold"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <div className="mt-6 text-left bg-black/40 p-4 rounded-lg border border-gray-700 overflow-auto max-h-60">
                <p className="text-red-400 text-xs font-semibold mb-2">
                  Developer Error Details:
                </p>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </div>
            )}

          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
