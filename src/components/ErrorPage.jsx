import React from 'react'
import { Home, RefreshCw, AlertTriangle, Mail } from 'lucide-react'

const ErrorPage = ({ error, resetError }) => {
  const handleRefresh = () => {
    if (resetError) {
      resetError()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
            500
          </div>
          <div className="mt-4">
            <AlertTriangle className="w-24 h-24 mx-auto text-red-500" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
        <p className="text-xl text-gray-600 mb-8">
          We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
        </p>

        {/* Error Details (if available) */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.toString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          <a
            href="#home"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </a>
        </div>

        {/* Support Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-6">
            If this problem persists, please contact our support team with the error details above.
          </p>
          <a
            href="#support"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </a>
        </div>

        {/* Error ID */}
        <p className="mt-8 text-sm text-gray-500">
          Error ID: {Date.now().toString(36).toUpperCase()}
        </p>
      </div>
    </div>
  )
}

export default ErrorPage

