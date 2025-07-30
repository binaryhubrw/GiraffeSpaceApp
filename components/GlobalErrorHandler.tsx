"use client"

import { useEffect } from 'react'
import { setupGlobalErrorHandler } from '@/utils/errorHandler'

export const GlobalErrorHandler = () => {
  useEffect(() => {
    // Setup global error handlers
    const cleanup = setupGlobalErrorHandler()

    // Listen for server error events
    const handleServerError = (event: CustomEvent) => {
      console.error('Server error detected:', event.detail)
      // You can trigger additional actions here, like showing a modal or redirecting
    }

    window.addEventListener('serverError', handleServerError as EventListener)

    return () => {
      cleanup?.()
      window.removeEventListener('serverError', handleServerError as EventListener)
    }
  }, [])

  // This component doesn't render anything
  return null
} 