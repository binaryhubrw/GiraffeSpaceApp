import { useState, useEffect, useCallback } from 'react'
import ApiService from '@/api/apiConfig'

interface ServerStatus {
  isOnline: boolean
  isChecking: boolean
  lastCheck: Date | null
  error: string | null
}

const SERVER_URL = ApiService.BASE_URL

export const useServerStatus = () => {
  const [status, setStatus] = useState<ServerStatus>({
    isOnline: true,
    isChecking: false,
    lastCheck: null,
    error: null
  })

  const checkServerStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }))

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      // Try multiple endpoints to check server status
      const endpoints = [
        '/health/status', // Common health check endpoint
       
        '/' // Root endpoint
      ]

      let serverResponded = false
      let lastError = null

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${SERVER_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          })

          // If we get any response (even 404), the server is online
          if (response.status >= 200 && response.status < 600) {
            serverResponded = true
            break
          }
        } catch (endpointError: any) {
          lastError = endpointError
          // Continue to next endpoint
        }
      }

      clearTimeout(timeoutId)

      if (serverResponded) {
        setStatus({
          isOnline: true,
          isChecking: false,
          lastCheck: new Date(),
          error: null
        })
      } else {
        throw lastError || new Error('Server is not responding')
      }
    } catch (error: any) {
      console.error('Server status check failed:', error)
      
      let errorMessage = 'Server is not responding'
      if (error.name === 'AbortError') {
        errorMessage = 'Server request timed out'
      } else if (error.message && error.message.includes('fetch')) {
        errorMessage = 'Network connection failed'
      } else if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server'
      } else if (error.message && error.message.includes('NetworkError')) {
        errorMessage = 'Network error occurred'
      } else {
        errorMessage = 'Server is not responding'
      }

      setStatus({
        isOnline: false,
        isChecking: false,
        lastCheck: new Date(),
        error: errorMessage
      })
    }
  }, [])

  // Check server status on mount
  useEffect(() => {
    checkServerStatus()
  }, [checkServerStatus])

  // Set up periodic checks (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(checkServerStatus, 30000)
    return () => clearInterval(interval)
  }, [checkServerStatus])

  // Check when user comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine) {
        checkServerStatus()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [checkServerStatus])

  return {
    ...status,
    checkServerStatus
  }
} 