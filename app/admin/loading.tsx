import React from "react"

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
      </div>
      <div className="space-y-2">
        <p className="text-lg font-medium text-gray-900">Loading organization details</p>
        <p className="text-sm text-gray-500">Please wait while we fetch the information...</p>
      </div>
    </div>
  </div>
)

export default LoadingSpinner
