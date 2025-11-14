import React from 'react'
import { Wrench, Clock, Bell, Twitter, Linkedin } from 'lucide-react'

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Maintenance Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            <Wrench className="w-32 h-32 text-blue-600 animate-pulse" />
            <div className="absolute -top-2 -right-2">
              <Clock className="w-12 h-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Maintenance Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">We'll Be Right Back!</h1>
        <p className="text-xl text-gray-600 mb-8">
          FineGuard is currently undergoing scheduled maintenance to improve your experience.
        </p>

        {/* Estimated Time */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Estimated Downtime</h2>
          </div>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            30 Minutes
          </p>
          <p className="text-sm text-gray-500">
            Expected to be back online by 3:00 PM GMT
          </p>
        </div>

        {/* What's Being Updated */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-4">What We're Working On</h2>
          <ul className="text-left space-y-3 max-w-md mx-auto">
            <li className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <span>Performance improvements for faster loading</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <span>Enhanced security features</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <span>New features and bug fixes</span>
            </li>
          </ul>
        </div>

        {/* Stay Updated */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Stay Updated</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Follow us on social media for real-time updates
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="https://twitter.com/fineguard"
              className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter className="w-6 h-6" />
            </a>
            <a
              href="https://linkedin.com/company/fineguard"
              className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="w-6 h-6" />
            </a>
          </div>
        </div>

        {/* Thank You Message */}
        <p className="mt-8 text-gray-500">
          Thank you for your patience! We're working hard to serve you better.
        </p>
      </div>
    </div>
  )
}

export default MaintenancePage

