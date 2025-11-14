import React from 'react'
import { Home, Search, ArrowLeft, FileQuestion } from 'lucide-react'

const NotFoundPage = () => {
  const popularPages = [
    { name: 'Dashboard', path: '#dashboard', icon: Home },
    { name: 'Fine Tracker', path: '#deadline-tracker', icon: FileQuestion },
    { name: 'Calendar', path: '#fineguard-calendar', icon: Search },
    { name: 'Reports', path: '#reports-dashboard', icon: FileQuestion }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            404
          </div>
          <div className="mt-4">
            <FileQuestion className="w-24 h-24 mx-auto text-gray-400" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a
            href="#home"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </a>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Popular Pages */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularPages.map((page, index) => (
              <a
                key={index}
                href={page.path}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <page.icon className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                <span className="font-medium text-gray-700 group-hover:text-blue-600">
                  {page.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-500">
          If you believe this is an error, please{' '}
          <a href="#support" className="text-blue-600 hover:text-blue-700 font-medium">
            contact support
          </a>
        </p>
      </div>
    </div>
  )
}

export default NotFoundPage

