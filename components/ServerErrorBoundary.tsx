"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useServerStatus } from '@/hooks/useServerStatus'
import ErrorPage from '@/app/error'

interface ServerErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export const ServerErrorBoundary = ({ children, fallback }: ServerErrorBoundaryProps) => {
  const { isOnline, isChecking, error } = useServerStatus()
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    // Show error page if server is offline for more than 5 seconds
    if (!isOnline && !isChecking && error) {
      const timer = setTimeout(() => {
        setShowError(true)
      }, 5000) // Wait 5 seconds before showing error

      return () => clearTimeout(timer)
    } else if (isOnline) {
      setShowError(false)
    }
  }, [isOnline, isChecking, error])

  // Don't show error immediately to avoid flashing
  if (showError && !isOnline) {
    return <ErrorPage isServerError={true} />
  }

  // Show fallback while checking
  if (isChecking && !isOnline) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking server status...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 