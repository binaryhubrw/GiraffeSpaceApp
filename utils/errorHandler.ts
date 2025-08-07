import { toast } from 'sonner'

export interface ErrorInfo {
  message: string
  type: 'network' | 'server' | 'client' | 'unknown'
  status?: number
}

export const isServerError = (error: any): boolean => {
  // Check if it's a network error
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true
  }

  // Check if it's a network error from axios
  if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
    return true
  }

  // Check if it's a timeout error
  if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
    return true
  }

  // Check if it's a server error (5xx status codes)
  if (error.response?.status >= 500) {
    return true
  }

  // Check if the error message contains server-related keywords
  const serverKeywords = [
    'network',
    'connection',
    'timeout',
    'server',
    'unreachable',
    'failed to fetch',
    'cors',
    'refused'
  ]

  const errorMessage = error.message?.toLowerCase() || ''
  return serverKeywords.some(keyword => errorMessage.includes(keyword))
}

export const handleApiError = (error: any, context?: string): ErrorInfo => {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error)

  let errorInfo: ErrorInfo = {
    message: 'An unexpected error occurred',
    type: 'unknown'
  }

  // Network/Server errors
  if (isServerError(error)) {
    errorInfo = {
      message: 'Server is not responding. Please try again later.',
      type: 'server'
    }

    // Show toast notification
    toast.error('Server connection failed. Please check your internet connection.')
    
    // Trigger global error state (you can implement this with a context or state management)
    if (typeof window !== 'undefined') {
      // Dispatch custom event to notify error boundary
      window.dispatchEvent(new CustomEvent('serverError', { 
        detail: { error: errorInfo } 
      }))
    }
  }
  // Client errors (4xx)
  else if (error.response?.status >= 400 && error.response?.status < 500) {
    errorInfo = {
      message: error.response?.data?.message || 'Invalid request',
      type: 'client',
      status: error.response.status
    }

    toast.error(errorInfo.message)
  }
  // Other errors
  else {
    errorInfo = {
      message: error.message || 'An unexpected error occurred',
      type: 'unknown'
    }

    toast.error(errorInfo.message)
  }

  return errorInfo
}

export const createErrorBoundary = () => {
  let hasError = false
  let errorInfo: ErrorInfo | null = null

  const setError = (error: ErrorInfo) => {
    hasError = true
    errorInfo = error
  }

  const clearError = () => {
    hasError = false
    errorInfo = null
  }

  const getError = () => ({ hasError, errorInfo })

  return { setError, clearError, getError }
}

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandler = () => {
  if (typeof window === 'undefined') return

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    if (isServerError(event.reason)) {
      const errorInfo = handleApiError(event.reason, 'unhandled rejection')
      
      // Prevent default browser error handling
      event.preventDefault()
    }
  }

  const handleError = (event: ErrorEvent) => {
    console.error('Global error:', event.error)
    
    if (isServerError(event.error)) {
      const errorInfo = handleApiError(event.error, 'global error')
      
      // Prevent default browser error handling
      event.preventDefault()
    }
  }

  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  window.addEventListener('error', handleError)

  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    window.removeEventListener('error', handleError)
  }
} 