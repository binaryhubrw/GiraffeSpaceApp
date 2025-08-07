"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ApiService from "@/api/apiConfig"

interface ErrorPageProps {
  error?: Error & { digest?: string }
  reset?: () => void
  isServerError?: boolean
}

export default function ErrorPage({ error, reset, isServerError = false }: ErrorPageProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is online
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Listen for online/offline events
    window.addEventListener('online', checkOnlineStatus)
    window.addEventListener('offline', checkOnlineStatus)
    
    // Initial check
    checkOnlineStatus()

    return () => {
      window.removeEventListener('online', checkOnlineStatus)
      window.removeEventListener('offline', checkOnlineStatus)
    }
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    
    try {
      // Test server connectivity with multiple endpoints
      const endpoints = [
        '/health',
        '/events',
        '/venues',
        '/'
      ]

      let serverResponded = false

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${ApiService.BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000) // 10 seconds timeout
          })

          // If we get any response (even 404), the server is online
          if (response.status >= 200 && response.status < 600) {
            serverResponded = true
            break
          }
        } catch (endpointError) {
          // Continue to next endpoint
        }
      }

      if (serverResponded) {
        // Server is back online, refresh the page
        window.location.reload()
      } else {
        throw new Error('Server is not responding')
      }
    } catch (error) {
      console.error('Server connectivity test failed:', error)
      // Show error message
      alert('Server is still not responding. Please try again later.')
    } finally {
      setIsRetrying(false)
    }
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  // Determine error type and message
  const getErrorInfo = () => {
    if (!isOnline) {
      return {
        title: "No Internet Connection",
        message: "Please check your internet connection and try again.",
        icon: WifiOff,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      }
    }

    if (isServerError || error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return {
        title: "Server Not Responding",
        message: "Our servers are currently experiencing issues. Please try again in a few minutes.",
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      }
    }

    return {
      title: "Something Went Wrong",
      message: "An unexpected error occurred. Please try again or contact support if the problem persists.",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  }

  const errorInfo = getErrorInfo()
  const IconComponent = errorInfo.icon

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-2 border-gray-200">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 ${errorInfo.bgColor} ${errorInfo.borderColor} border-2 rounded-full flex items-center justify-center`}>
                <IconComponent className={`w-10 h-10 ${errorInfo.color}`} />
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {errorInfo.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {errorInfo.message}
              </p>
              
              {!isOnline && (
                <Alert className="mb-4">
                  <WifiOff className="h-4 w-4" />
                  <AlertDescription>
                    You appear to be offline. Please check your internet connection.
                  </AlertDescription>
                </Alert>
              )}

              {isServerError && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Our servers are currently experiencing connectivity issues. Please try again in a few minutes.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleRetry} 
                disabled={isRetrying || !isOnline}
                className="w-full"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking Server...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleGoBack}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
              </div>
            </div>

            {error && process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                  {error.message}
                  {error.stack && `\n\nStack:\n${error.stack}`}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>

        {/* Status indicator */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
