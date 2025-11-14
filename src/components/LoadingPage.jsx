import React from 'react'
import { Shield } from 'lucide-react'

const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Logo with Animation */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 animate-ping">
            <Shield className="w-24 h-24 mx-auto text-white opacity-20" />
          </div>
          <Shield className="w-24 h-24 mx-auto text-white relative z-10" />
        </div>

        {/* Brand Name */}
        <h1 className="text-5xl font-bold text-white mb-4">FineGuard</h1>
        
        {/* Loading Spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-white border-opacity-20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-xl text-white text-opacity-90 mb-2">Loading your dashboard...</p>
        <p className="text-sm text-white text-opacity-70">Please wait a moment</p>

        {/* Loading Dots Animation */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingPage

