"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, CheckCircle, XCircle, AlertTriangle, MapPin, Calendar, User, CreditCard, Clock, ArrowLeft, X } from "lucide-react"
import ApiService from "@/api/apiConfig"
import { toast } from "sonner"
import jsQR from "jsqr"

interface TicketScannerProps {
  eventId?: string
}

interface TicketData {
  registrationId: string
  userId: string
  eventId: string
  timestamp: string
  uniqueHash: string
}

interface CheckInResponse {
  success: boolean
  message: string
  alertType: "success" | "warning" | "error"
  data?: {
    checkDate?: string
    registrationId?: string
    attendeeName?: string
    ticketTypeName?: string
    eventName?: string
    ticketAttendedDate?: string
    allEventBookingDates?: Array<{ date: string }>
    venueName?: string
    venueGoogleMapsLink?: string
    paymentStatus?: string
    currentAttendanceStatus?: boolean
    checkInTimestamp?: string
  }
}

export default function TicketScanner({ eventId }: TicketScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanResult, setScanResult] = useState<CheckInResponse | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Monitor video element availability
  useEffect(() => {
    if (isScanning && videoRef.current) {
      console.log("Video element is now available for scanning")
    }
  }, [isScanning, videoRef.current])

  useEffect(() => {
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Camera access not supported in this browser")
      setHasPermission(false)
      return
    }

    // Check if we already have permission
    checkExistingPermission()

    // Ensure video element is properly initialized when component mounts
    const initializeVideoElement = () => {
      if (videoRef.current) {
        console.log("Video element initialized")
        videoRef.current.playsInline = true
        videoRef.current.muted = true
      }
    }

    // Initialize video element after component mounts
    const timer = setTimeout(initializeVideoElement, 100)

    return () => {
      clearTimeout(timer)
      stopScanning()
    }
  }, [])

  const checkExistingPermission = async () => {
    try {
      // Check if we can enumerate devices (this requires permission)
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length > 0) {
        // We have permission, set it to true
        setHasPermission(true)
        console.log("Camera permission already granted")
      } else {
        // No video devices found, permission not granted
        setHasPermission(null)
        console.log("No camera permission found")
      }
    } catch (error) {
      console.log("Could not enumerate devices, permission status unknown")
      setHasPermission(null)
    }
  }

  const requestCameraPermission = async () => {
    try {
      console.log("Requesting camera permission...")
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      
      console.log("Camera permission granted")
      setHasPermission(true)
      return stream
    } catch (error: any) {
      console.error("Camera permission error:", error)
      
      // Handle specific permission errors
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setHasPermission(false)
        toast.error("Camera access denied. Please allow camera permission and try again.")
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setHasPermission(false)
        toast.error("No camera found on this device.")
      } else if (error.name === "NotSupportedError" || error.name === "ConstraintNotSatisfiedError") {
        setHasPermission(false)
        toast.error("Camera not supported or constraints not satisfied.")
      } else {
        setHasPermission(false)
        toast.error("Failed to access camera: " + (error.message || "Unknown error"))
      }
      
      return null
    }
  }

  const startScanning = async () => {
    try {
      console.log("Starting camera scanning...")
      
      const stream = await requestCameraPermission()
      if (!stream) {
        console.log("No camera stream available")
        return
      }

      // Set scanning state first to ensure video element is rendered
      setIsScanning(true)

      // Wait for the next render cycle to ensure video element is in DOM
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!videoRef.current) {
        console.error("Video element not found - waiting for render")
        // Wait a bit more and try again
        await new Promise(resolve => setTimeout(resolve, 200))
        
        if (!videoRef.current) {
          console.error("Video element still not found after waiting")
          stream.getTracks().forEach(track => track.stop())
          setIsScanning(false)
          toast.error("Failed to initialize camera. Please try again.")
          return
        }
      }

      // Ensure video element has proper attributes
      const video = videoRef.current
      video.playsInline = true
      video.muted = true
      video.autoplay = true

      streamRef.current = stream
      video.srcObject = stream
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        if (!video) {
          reject(new Error("Video element not available"))
          return
        }
        
        const handleLoadedMetadata = () => {
          console.log("Video metadata loaded, starting playback")
          video.play().catch(error => {
            console.error("Failed to play video:", error)
            toast.error("Failed to start camera feed")
            stopScanning()
            reject(error)
          })
          startQRDetection()
          resolve(true)
        }

        const handleError = (error: any) => {
          console.error("Video error:", error)
          toast.error("Camera feed error occurred")
          stopScanning()
          reject(error)
        }

        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
        video.addEventListener('error', handleError, { once: true })

        // Set a timeout in case the video never loads
        setTimeout(() => {
          reject(new Error("Video failed to load within timeout"))
        }, 5000)
      })

    } catch (error: any) {
      console.error("Error starting scanning:", error)
      toast.error("Failed to start camera scanning: " + (error.message || "Unknown error"))
      setHasPermission(false)
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setIsScanning(false)
  }

  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Real QR code detection using jsQR
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (code) {
          console.log("QR Code detected:", code.data)
          processQRCode(code.data)
        }
      }
    }, 100)
  }

  const processQRCode = async (qrData: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    stopScanning()

    try {
      console.log("Processing QR code data:", qrData)

      // The QR code data is already the token we need to send
      // It's a base64 encoded JSON string that contains the ticket information
      let qrCodeData = qrData

      // Validate that we have QR data
      if (!qrCodeData || qrCodeData.trim() === '') {
        throw new Error("Empty QR code data")
      }

      // Try to decode the base64 to see if it's valid JSON (for validation purposes)
      try {
        const decodedString = atob(qrCodeData)
        const decodedData = JSON.parse(decodedString)
        console.log("Decoded QR data:", decodedData)
        
        // Validate the decoded data structure
        if (!decodedData.uniqueHash) {
          throw new Error("Invalid ticket data: missing uniqueHash in decoded data")
        }
      } catch (decodeError) {
        console.warn("Could not decode QR data as base64 JSON, but continuing with raw data:", decodeError)
        // If we can't decode it, we'll still try to use the raw data
        // This handles cases where the QR code might contain the token directly
      }

      // Call check-in API with the QR code data as the token
      await checkInTicket(qrCodeData)
    } catch (error: any) {
      console.error("Error processing QR code:", error)
      
      const errorMessage = error.message === "Empty QR code data" 
        ? "Empty QR code detected" 
        : error.message === "Invalid ticket data: missing uniqueHash in decoded data"
        ? "Invalid ticket format"
        : "Failed to process QR code"
      
      setScanResult({
        success: false,
        message: errorMessage,
        alertType: "error",
      })
      
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const checkInTicket = async (qrCodeData: string) => {
    try {
      // Prepare the request body for the API
      const requestBody = {
        qrCodeData: qrCodeData, // The base64 encoded token from QR code
        eventId: eventId || "" // Optional: eventId if available
      }

      console.log("Sending ticket scan request:", requestBody)

      // Call the actual API
      const response = await ApiService.checkAndScanTicket(requestBody)
      
      console.log("API Response:", response)
      
      // Set the scan result
      setScanResult(response)

      if (response.success) {
        toast.success("Ticket scanned successfully!")
        setShowDetails(true)
      } else {
        toast.error(response.message || "Failed to scan ticket")
      }
    } catch (error: any) {
      console.error("Check-in API error:", error)
      
      // Handle API errors
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to check in ticket. Please try again."
      
      setScanResult({
        success: false,
        message: errorMessage,
        alertType: "error",
      })
      
      toast.error(errorMessage)
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setShowDetails(false)
    setIsProcessing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Development helper function to test QR code processing
  const testQRCodeProcessing = (testQRData: string) => {
    console.log("Testing QR code processing with:", testQRData)
    processQRCode(testQRData)
  }

  // Example test QR code (for development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Uncomment the line below to test with sample QR data
      // testQRCodeProcessing("eyJyZWdpc3RyYXRpb25JZCI6IjM2Mzc2NGI1LTA5MTYtNDdkZi04ZWI1LTRjMmNhMWMxMDY4YiIsInVzZXJJZCI6IjIyOGEzM2EwLTg5ZmItNDJjYi05NTA5LTBlOTZjN2YwNWExMiIsImV2ZW50SWQiOiJjY2VjNTNkNy1lYjc3LTRjMDYtOTM3Yi0zYjIwYjgwMTcxNGMiLCJ0aW1lc3RhbXAiOiIyMDI1LTA3LTMwVDAxOjQwOjEyLjcxMVoiLCJ1bmlxdWVIYXNoIjoiZjhjZGUyNTEtMTkyYi00ZDlkLTljNTAtYWU0NzZjMjllMTBiIn0=")
    }
  }, [])

  const handleStartScanning = () => {
    // Check if camera is supported first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera access is not supported in this browser")
      return
    }
    
    // Show permission dialog first
    setShowPermissionDialog(true)
  }

  const handlePermissionGranted = async () => {
    setShowPermissionDialog(false)
    
    // Show a notification to guide the user
    toast.info("Browser will now ask for camera permission. Please click 'Allow' when prompted.", {
      duration: 5000,
    })
    
    // Small delay to let the user read the toast
    setTimeout(async () => {
      await startScanning()
    }, 1000)
  }

  const handlePermissionDenied = () => {
    setShowPermissionDialog(false)
    setHasPermission(false)
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.history.back()}
              className="bg-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Ticket Scanner</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Permission Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Camera Access Required</h3>
                <p className="text-gray-600">
                  Camera access is required to scan QR codes on tickets. Please allow camera permission in your browser settings.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to enable camera access:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click the camera icon in your browser's address bar</li>
                  <li>• Select "Allow" for camera access</li>
                  <li>• Refresh the page and try again</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setHasPermission(null)} className="flex-1">
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()} 
                  className="flex-1 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.history.back()}
            className="bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Ticket Scanner</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan Ticket QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning && !scanResult && (
              <div className="space-y-4">
                <p className="text-gray-600 text-center">Position the QR code on the ticket within the camera frame to scan</p>
                <Button onClick={handleStartScanning} className="w-full" size="lg">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div className="relative">
                  <video 
                    ref={videoRef} 
                    className="w-full rounded-lg" 
                    playsInline 
                    muted 
                    autoPlay
                    style={{ minHeight: '300px' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning overlay */}
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>

                    {/* Scanning line animation */}
                    <div className="absolute inset-x-4 top-1/2 h-0.5 bg-blue-500 animate-pulse"></div>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-600">Position the QR code within the frame</p>

                <Button onClick={stopScanning} variant="outline" className="w-full bg-transparent">
                  <X className="h-4 w-4 mr-2" />
                  Cancel Scanning
                </Button>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Processing ticket...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we verify the ticket</p>
              </div>
            )}

            {scanResult && (
              <div className="space-y-4">
                <Alert
                  className={`${
                    scanResult.alertType === "success"
                      ? "border-green-500 bg-green-50"
                      : scanResult.alertType === "warning"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-red-500 bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {scanResult.alertType === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {scanResult.alertType === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    {scanResult.alertType === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                    <AlertDescription
                      className={`${
                        scanResult.alertType === "success"
                          ? "text-green-800"
                          : scanResult.alertType === "warning"
                            ? "text-yellow-800"
                            : "text-red-800"
                      }`}
                    >
                      {scanResult.message}
                    </AlertDescription>
                  </div>
                </Alert>

                {!scanResult.success && scanResult.data?.checkDate && (
                  <div className="text-sm text-gray-600 text-center">
                    Previously used on: {formatDate(scanResult.data.checkDate)}
                  </div>
                )}

                {scanResult.success && (
                  <Button onClick={() => setShowDetails(true)} className="w-full">
                    View Details
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button onClick={resetScanner} variant="outline" className="flex-1 bg-transparent">
                    Scan Another Ticket
                  </Button>
                  <Button onClick={() => window.history.back()} variant="outline" className="flex-1 bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Check-in Successful
              </DialogTitle>
            </DialogHeader>

            {scanResult?.success && scanResult.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Attendee</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{scanResult.data.attendeeName}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Ticket Type</label>
                    <div className="mt-1">
                      <Badge variant="secondary">{scanResult.data.ticketTypeName}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Event</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{scanResult.data.eventName}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Venue</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{scanResult.data.venueName}</span>
                    {scanResult.data.venueGoogleMapsLink && (
                      <a
                        href={scanResult.data.venueGoogleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        (View Map)
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <Badge variant={scanResult.data.paymentStatus === "PAID" ? "default" : "destructive"}>
                        {scanResult.data.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-in Time</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {scanResult.data.checkInTimestamp && formatDate(scanResult.data.checkInTimestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                {scanResult.data.allEventBookingDates && scanResult.data.allEventBookingDates.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Event Dates</label>
                    <div className="mt-1 space-y-1">
                      {scanResult.data.allEventBookingDates.map((booking, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {new Date(booking.date).toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={() => setShowDetails(false)} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Permission Request Dialog */}
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Camera Permission Required
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Enable Camera Access</h3>
                <p className="text-gray-600">
                  This app needs camera access to scan QR codes on tickets. When prompted, please click "Allow" to enable camera access.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">What happens next:</h4>
                <ol className="text-sm text-yellow-800 space-y-1">
                  <li>1. Click "Request Permission" below</li>
                  <li>2. Your browser will show a permission popup</li>
                  <li>3. Click "Allow" in the popup</li>
                  <li>4. The camera will start automatically</li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Browser-specific instructions:</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <div>
                    <strong>Chrome/Edge:</strong> Look for camera icon in address bar
                  </div>
                  <div>
                    <strong>Firefox:</strong> Camera icon appears in address bar
                  </div>
                  <div>
                    <strong>Safari:</strong> Camera icon in address bar or system dialog
                  </div>
                  <div>
                    <strong>Mobile:</strong> System permission dialog will appear
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handlePermissionGranted} className="flex-1">
                  Request Permission
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePermissionDenied} 
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
