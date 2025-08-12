"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import TicketCard from "../ticket-card"

import { Barcode, QrCode, TicketIcon, Camera, ChevronRight, Home, RefreshCw, AlertCircle, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import jsQR from 'jsqr'
import { BrowserMultiFormatReader } from "@zxing/library"
import ApiService from "@/api/apiConfig"
import { useRouter } from "next/navigation"

import { Header } from "@/components/header"
import Footer from "@/components/footer"

export default function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [detectedCode, setDetectedCode] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState("")
  const [manualError, setManualError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"qr" | "barcode" | "invite">("qr")
  const [scanningInterval, setScanningInterval] = useState<NodeJS.Timeout | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [isCheckingInvitation, setIsCheckingInvitation] = useState(false)
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true)
  const [barcodeReader, setBarcodeReader] = useState<BrowserMultiFormatReader | null>(null)
  const [barcodeMethod, setBarcodeMethod] = useState<"camera" | "scanner" | null>(null)

  // Helper function to detect if a string is a base64 encoded QR code
  const isBase64QRCode = (str: string): boolean => {
    // Check if it's a base64 string that's likely a QR code
    // QR codes typically contain alphanumeric characters and common base64 padding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    return base64Regex.test(str) && str.length > 50 // QR codes are typically longer
  }

  // Helper function to detect if a string is a barcode
  const isBarcode = (str: string): boolean => {
    // Barcodes are typically numeric or alphanumeric strings
    // Common barcode formats: EAN-13 (13 digits), UPC-A (12 digits), Code 128, Code 39, etc.
    const barcodeRegex = /^[0-9A-Za-z\-./+\s]{8,50}$/
    return barcodeRegex.test(str) && !isBase64QRCode(str)
  }

  useEffect(() => {
    setIsMounted(true)
    // Initialize barcode reader
    const reader = new BrowserMultiFormatReader()
    setBarcodeReader(reader)
    // Verify inspector access on page load
    verifyInspectorAccess()

    // Handle Next.js router events for navigation
    const handleRouteChange = () => {
      stopCamera()
    }

    // Listen for route changes
    window.addEventListener('beforeunload', handleRouteChange)
    
    return () => {
      window.removeEventListener('beforeunload', handleRouteChange)
    }
  }, [])

  // Cleanup barcode reader on unmount
  useEffect(() => {
    return () => {
      if (barcodeReader) {
        barcodeReader.reset()
      }
    }
  }, [barcodeReader])

  // Verify inspector access
  const verifyInspectorAccess = async () => {
    const inspectorCode = localStorage.getItem("inspectorCode")
    const inspectorAccess = localStorage.getItem("inspectorAccess")
    
    if (!inspectorCode || inspectorAccess !== "true") {
      toast.error("Inspector access required. Please verify your access first.")
      router.push("/events/check-attendance/insipector")
      return
    }

    try {
      setIsVerifyingAccess(true)
      const response = await ApiService.checkInspectorAccess(inspectorCode)
      
      if (!response.success) {
        toast.error("Inspector access expired. Please verify your access again.")
        // Clear stored data
        localStorage.removeItem("inspectorAccess")
        localStorage.removeItem("inspectorCode")
        router.push("/events/check-attendance/insipector")
        return
      }

      toast.success("Inspector access verified successfully!")
    } catch (error: any) {
      console.error("Inspector access verification failed:", error)
      toast.error("Inspector access verification failed. Please try again.")
      // Clear stored data
      localStorage.removeItem("inspectorAccess")
      localStorage.removeItem("inspectorCode")
      router.push("/events/check-attendance/insipector")
      return
    } finally {
      setIsVerifyingAccess(false)
    }
  }

  // Cleanup camera when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopCamera()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera()
      }
    }

    const handlePopState = () => {
      stopCamera()
    }

    // Handle page refresh, navigation, and browser back/forward
    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("popstate", handlePopState)
      // Always stop camera on cleanup
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      // Check existing permission first
      checkExistingPermission()
    }
  }, [isMounted])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  useEffect(() => {
    // Always stop camera when switching tabs to ensure proper cleanup
    stopCamera()
    
    // Reset barcode method when switching away from barcode tab
    if (activeTab !== "barcode") {
      setBarcodeMethod(null)
    }
  }, [activeTab])

  const checkExistingPermission = async () => {
    try {
      // Check if we can enumerate devices (this requires permission)
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")
      
      if (videoDevices.length > 0) {
        // We have permission, but don't start camera automatically
        // Let user choose when to start scanning
        setHasPermission(true)
      } else {
        // No permission yet, show permission dialog
        setShowPermissionDialog(true)
      }
    } catch (error) {
      console.error("Error checking existing permission:", error)
      // Show permission dialog if we can't check
      setShowPermissionDialog(true)
    }
  }

  const requestCameraPermission = async (): Promise<MediaStream | null> => {
    try {
      console.log("Requesting camera permission...")
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser")
      }

      const cameraConfigs = [
        // Try back camera with ideal resolution first
        {
        video: {
            facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        },
        // Fallback to back camera with lower resolution
        {
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        // Fallback to any back camera
        {
          video: { facingMode: "environment" },
        },
        // Fallback to front camera with ideal resolution
        {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        // Fallback to any front camera
        {
          video: { facingMode: "user" },
        },
        // Final fallback - any camera with basic constraints
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        // Last resort - any available camera
        { video: true },
      ]

      let stream: MediaStream | null = null
      let lastError: any = null

      // Try each configuration until one works
      for (let i = 0; i < cameraConfigs.length; i++) {
        try {
          console.log(`Trying camera config ${i + 1}/${cameraConfigs.length}:`, cameraConfigs[i])
          stream = await navigator.mediaDevices.getUserMedia(cameraConfigs[i])

          if (stream && stream.getVideoTracks().length > 0) {
            console.log(`Camera access successful with config ${i + 1}`)
            break
          }
    } catch (error: any) {
          console.log(`Camera config ${i + 1} failed:`, error.message)
          lastError = error

          // If this is the last config, throw the error
          if (i === cameraConfigs.length - 1) {
            throw error
          }

          // Continue to next configuration
          continue
        }
      }

      if (!stream) {
        throw lastError || new Error("No camera configuration worked")
      }

      console.log("Camera permission granted")
      setHasPermission(true)
      setCameraError(null)
      return stream
    } catch (error: any) {
      console.error("Camera permission error:", error)

      let errorMsg = ""
      switch (error.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          errorMsg = "Camera access denied. Please allow camera permission and try again."
          break
        case "NotFoundError":
        case "DevicesNotFoundError":
          errorMsg = "No camera found on this device. Please check if your device has a camera."
          break
        case "NotSupportedError":
        case "ConstraintNotSatisfiedError":
          errorMsg = "Camera not supported. Please try using a different browser or device."
          break
        case "NotReadableError":
        case "TrackStartError":
          errorMsg = "Camera is already in use by another application. Please close other camera apps and try again."
          break
        case "OverconstrainedError":
          errorMsg = "Camera constraints not supported. Trying with basic settings..."
          break
        default:
          errorMsg = `Camera error: ${error.message || "Unknown error occurred"}`
      }

      setHasPermission(false)
      setCameraError(errorMsg)
      toast.error(errorMsg)
      return null
    }
  }

  const startCamera = async (): Promise<boolean> => {
    try {
      console.log("Starting camera...")

      const stream = await requestCameraPermission()
      if (!stream) {
        return false
      }

      // Store stream reference
      streamRef.current = stream

      // Set scanning state first to ensure video element is rendered
      setIsScanning(true)

      // Wait for video element to be available
      await new Promise<void>((resolve) => {
        const checkVideo = () => {
          if (videoRef.current) {
            resolve()
          } else {
            requestAnimationFrame(checkVideo)
          }
        }
        checkVideo()
      })

      // Set stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.playsInline = true
        videoRef.current.muted = true
        videoRef.current.autoplay = true

        try {
          await videoRef.current.play()
          console.log("Video started successfully")
          
          // Start appropriate scanning based on active tab
          if (activeTab === "qr") {
            startQRScanning()
          } else if (activeTab === "barcode") {
            startBarcodeScanning()
          }
        } catch (playError) {
          console.log("Auto-play failed, user interaction may be required:", playError)
          // Video will play when user interacts with the page
        }
      }

      return true
    } catch (error: any) {
      console.error("Error starting camera:", error)
      setCameraError("Failed to start camera: " + (error.message || "Unknown error"))
      setIsScanning(false)
      return false
    }
  }

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Video or canvas element not available for QR scanning')
      return
    }

    console.log('Starting QR code scanning...')
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    const interval = setInterval(() => {
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
          console.log('QR Code detected:', code.data)
          stopCamera()
          handleResolve(code.data)
        }
      }
    }, 100) // Scan every 100ms

    setScanningInterval(interval)
  }

  const startBarcodeScanning = () => {
    if (!barcodeReader || !videoRef.current) {
      console.log('Barcode reader or video element not available')
      return
    }

    try {
      console.log('Starting barcode scanning...')
      barcodeReader.decodeFromVideoDevice(
        null, // Use default camera
        videoRef.current,
        (result: any, error: any) => {
          if (result) {
            console.log('Barcode detected:', result.getText())
            stopCamera()
            handleResolve(result.getText())
          }
          // Ignore errors as they are expected during scanning
          if (error && error.name !== 'NotFoundException') {
            console.log('Barcode scanning error (expected):', error.name)
          }
        }
      )
    } catch (error) {
      console.error('Barcode scanning error:', error)
      setCameraError('Failed to start barcode scanning')
    }
  }

  // Function to specifically disable flash/torch
  const disableFlash = async () => {
    try {
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0]
        if (videoTrack && videoTrack.getCapabilities) {
          const capabilities = videoTrack.getCapabilities()
          // Check if torch capability exists (using any to bypass TypeScript limitations)
          if ((capabilities as any).torch) {
            await videoTrack.applyConstraints({
              advanced: [{ torch: false } as any]
            })
            console.log('Flash/torch disabled')
          }
        }
      }
    } catch (error) {
      console.log('Error disabling flash/torch:', error)
    }
  }

  const stopCamera = () => {
    console.log('Stopping camera...')
    
    // Clear scanning intervals
    if (scanningInterval) {
      clearInterval(scanningInterval)
      setScanningInterval(null)
    }

    // Reset barcode reader
    if (barcodeReader) {
      try {
        barcodeReader.reset()
      } catch (error) {
        console.log('Error resetting barcode reader:', error)
      }
    }

    // Disable flash/torch first
    disableFlash()
    
    // Stop all media tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
          console.log('Stopped track:', track.kind)
        })
        streamRef.current = null
      } catch (error) {
        console.log('Error stopping media tracks:', error)
      }
    }

    // Clear video element
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
        videoRef.current.load() // Reset video element
      } catch (error) {
        console.log('Error clearing video element:', error)
      }
    }
    
    // Force stop any remaining camera access
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request a minimal stream to force release any held resources
        navigator.mediaDevices.getUserMedia({ video: false, audio: false })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop())
          })
          .catch(() => {
            // Ignore errors as this is just for cleanup
          })
      }
    } catch (error) {
      console.log('Error in final camera cleanup:', error)
    }
    
    // Reset states
    setIsScanning(false)
    setHasPermission(false)
    setCameraError(null)
    
    console.log('Camera stopped successfully')
  }

  const handleResolve = useCallback(
    async (text: string | null | undefined) => {
      if (!text) return
      if (invitationData) return // ignore further scans when we have a result
      const trimmed = String(text).trim()
      setDetectedCode(trimmed)
      
      // Check if it's a 6 or 7 digit invitation code
      if (trimmed.length === 6 || trimmed.length === 7) {
        // Get stored sixDigitCode from inspector access
        const storedSixDigitCode = localStorage.getItem("inspectorCode")
        if (!storedSixDigitCode) {
          toast.error("Inspector access required. Please verify your access first.")
          router.push("/events/check-attendance/insipector")
          return
        }

        // Set the detected code as manual code for the API call
        setManualCode(trimmed)
        await checkInvitationCode()
      } else if (isBase64QRCode(trimmed)) {
        // Handle QR code data (base64 encoded)
        await checkQRCodeInvitation(trimmed)
      } else if (isBarcode(trimmed)) {
        // Handle barcode data
        await checkBarcodeInvitation(trimmed)
        // Clear the manual input field after barcode scanning
        setManualCode("")
      } else {
        toast.error("Invalid code format. Please scan a valid invitation code, QR code, or barcode.")
      }
    },
    [invitationData],
  )

  // For scanner component's onUpdate signature variability
  const onUpdate = useCallback(
    (err: any, result: any) => {
      if (err) {
        // Throttle or surface a generic note only once
        return
      }
      const text = result?.text ?? result?.getText?.()
      if (text) handleResolve(text)
    },
    [handleResolve],
  )

  function resetScan() {
    setDetectedCode(null)
    setManualCode("")
    setInvitationData(null)
    setManualError(null)
    setBarcodeMethod(null)
    // Restart camera if we're on a camera tab
    if (activeTab === "qr" || activeTab === "barcode") {
      startCamera()
    }
  }

  async function tryManual() {
    setManualError(null)
    const trimmed = String(manualCode).trim()
    if (!trimmed) {
      setManualError("Please enter a code.")
      return
    }
    setDetectedCode(trimmed)
    
    // Check if it's a 6 or 7 digit invitation code
    if (trimmed.length === 6 || trimmed.length === 7) {
      // Get stored sixDigitCode from inspector access
      const storedSixDigitCode = localStorage.getItem("inspectorCode")
      if (!storedSixDigitCode) {
        setManualError("Inspector access required. Please verify your access first.")
        toast.error("Inspector access required. Please verify your access first.")
        router.push("/events/check-attendance/insipector")
        return
      }
      
      await checkInvitationCode()
    } else if (isBase64QRCode(trimmed)) {
      // Handle QR code data (base64 encoded)
      await checkQRCodeInvitation(trimmed)
    } else if (isBarcode(trimmed)) {
      // Handle barcode data
      await checkBarcodeInvitation(trimmed)
    } else {
      setManualError("Invalid code format. Please enter a valid invitation code, QR code, or barcode.")
      toast.error("Invalid code format. Please enter a valid invitation code, QR code, or barcode.")
    }
  }

  async function checkInvitationCode() {
    setManualError(null)
    setInvitationData(null)
    const trimmed = String(manualCode).trim()
    if (!trimmed) {
      setManualError("Please enter an invitation code.")
      return
    }

    // Get stored sixDigitCode from inspector access
    const storedSixDigitCode = localStorage.getItem("inspectorCode")
    if (!storedSixDigitCode) {
              setManualError("Inspector access required. Please verify your access first.")
        toast.error("Inspector access required. Please verify your access first.")
        router.push("/events/check-attendance/insipector")
      return
    }

    setIsCheckingInvitation(true)
    try {
      // Determine code type based on length
      let codeType = "SEVEN_DIGIT_CODE"
      
      if (trimmed.length === 7) {
        codeType = "SEVEN_DIGIT_CODE"
      } else if (trimmed.length === 6) {
        codeType = "SIX_DIGIT_CODE"
      } else {
        setManualError("Invalid code format. Please enter a 6 or 7 digit code.")
        return
      }

      const requestBody = {
        ticketCode: trimmed,
        codeType: codeType,
        sixDigitCode: storedSixDigitCode, // Use stored sixDigitCode from inspector access
      }

      console.log("Checking invitation with:", requestBody)
      const response = await ApiService.checkInvitationDetailWithInvitation(requestBody)
      
      if (response.success) {
        setInvitationData(response.data)
        toast.success(response.message || "Invitation details fetched successfully!")
      } else {
        setManualError(response.message || "Failed to fetch invitation details.")
        toast.error(response.message || "Failed to fetch invitation details.")
      }
    } catch (error: any) {
      console.error("Invitation check error:", error)
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to check invitation. Please try again."
      setManualError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsCheckingInvitation(false)
    }
  }

  async function checkQRCodeInvitation(qrCodeData: string) {
    setManualError(null)
    setInvitationData(null)

    // Get stored sixDigitCode from inspector access
    const storedSixDigitCode = localStorage.getItem("inspectorCode")
    if (!storedSixDigitCode) {
      toast.error("Inspector access required. Please verify your access first.")
      router.push("/events/check-attendance/insipector")
      return
    }

    setIsCheckingInvitation(true)
    try {
      const requestBody = {
        ticketCode: qrCodeData, // Use the QR code data as ticketCode
        codeType: "QR_CODE",
        sixDigitCode: storedSixDigitCode,
      }

      console.log("Checking QR code invitation with:", requestBody)
      const response = await ApiService.checkInvitationDetailWithInvitation(requestBody)
      
      if (response.success) {
        setInvitationData(response.data)
        toast.success(response.message || "QR code invitation details fetched successfully!")
      } else {
        setManualError(response.message || "Failed to fetch QR code invitation details.")
        toast.error(response.message || "Failed to fetch QR code invitation details.")
      }
    } catch (error: any) {
      console.error("QR code invitation check error:", error)
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to check QR code invitation. Please try again."
      setManualError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsCheckingInvitation(false)
    }
  }

  async function checkBarcodeInvitation(barcodeData: string) {
    setManualError(null)
    setInvitationData(null)

    // Get stored sixDigitCode from inspector access
    const storedSixDigitCode = localStorage.getItem("inspectorCode")
    if (!storedSixDigitCode) {
      toast.error("Inspector access required. Please verify your access first.")
      router.push("/events/check-attendance/insipector")
      return
    }

    setIsCheckingInvitation(true)
    try {
      const requestBody = {
        ticketCode: barcodeData, // Use the barcode data as ticketCode
        codeType: "BARCODE",
        sixDigitCode: storedSixDigitCode,
      }

      console.log("Checking barcode invitation with:", requestBody)
      const response = await ApiService.checkInvitationDetailWithInvitation(requestBody)

      if (response.success) {
        setInvitationData(response.data)
        toast.success(response.message || "Barcode invitation details fetched successfully!")
        // Clear the manual input field after successful barcode processing
        setManualCode("")
        } else {
        setManualError(response.message || "Failed to fetch barcode invitation details.")
        toast.error(response.message || "Failed to fetch barcode invitation details.")
      }
    } catch (error: any) {
      console.error("Barcode invitation check error:", error)
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to check barcode invitation. Please try again."
      setManualError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsCheckingInvitation(false)
    }
  }

  const handleStartScanning = async () => {
    // Check if camera is supported first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera access is not supported in this browser")
      return
    }

    try {
      const success = await startCamera()
      if (success) {
        toast.success("Camera started successfully!")
      }
    } catch (error) {
      console.error("Failed to start camera:", error)
      // Error is already handled in startCamera
    }
  }

  const handlePermissionDenied = () => {
    setShowPermissionDialog(false)
    setHasPermission(false)
  }

  const handlePermissionGranted = async () => {
    setShowPermissionDialog(false)
    const success = await startCamera()
    if (success) {
      toast.success("Camera access granted!")
    }
  }

  async function retryCameraAccess() {
    setCameraError(null)
    setHasPermission(null) // Reset permission state

    try {
      const success = await startCamera()
      if (success) {
      toast.success("Camera access granted!")
      }
    } catch (error: any) {
      console.error("Camera retry failed:", error)
      // Error handling is already done in startCamera
    }
  }

  // Show loading state while verifying inspector access
  if (isVerifyingAccess) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header activePage="scan" />
        <main className="flex items-center justify-center p-4 flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Verifying Inspector Access</h2>
            <p className="text-gray-600">Please wait while we verify your access...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header activePage="scan" />
      
      <main className="p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="flex items-center hover:text-blue-600 transition-colors">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/events" className="hover:text-blue-600 transition-colors">
              Events
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/user-dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Scan Tickets</span>
          </nav>

          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TicketIcon className="h-6 w-6 text-gray-700" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-semibold">Scan Tickets</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Scan QR codes, read a barcode, or enter invitation codes to check attendance
                </p>
              </div>
            </div>
            <Link
              href="/events/check-attendance/insipector"
              className="text-sm text-gray-700 underline underline-offset-4"
            >
              Back to inspector gate
            </Link>
          </header>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Choose a method</CardTitle>
            <CardDescription className="text-gray-600">
              Scan a QR code, read a barcode, or enter the invitation code manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="qr" className="data-[state=active]:bg-blue-50">
                  <QrCode className="h-4 w-4 mr-2" aria-hidden="true" />
                  QR code
                </TabsTrigger>
                <TabsTrigger value="barcode" className="data-[state=active]:bg-blue-50">
                  <Barcode className="h-4 w-4 mr-2" aria-hidden="true" />
                  Barcode
                </TabsTrigger>
                <TabsTrigger value="invite" className="data-[state=active]:bg-blue-50">
                  Invitation
                </TabsTrigger>
              </TabsList>

                                           <TabsContent value="qr" className="space-y-4 pt-4">
                {!invitationData && (
                   <>
                     {/* Permission Dialog */}
                     {showPermissionDialog && (
                       <div className="text-center py-8">
                         <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Camera className="h-8 w-8 text-blue-600" />
                         </div>
                          <h3 className="font-semibold text-foreground mb-2">Enable Camera Access</h3>
                         <p className="text-muted-foreground mb-4 text-sm">
                            This app needs camera access to scan QR codes. When prompted, please click "Allow" to enable
                            camera access.
                         </p>
                         
                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
                           <h4 className="font-medium text-blue-900 mb-2 text-sm">How to enable camera access:</h4>
                           <ul className="text-xs text-blue-800 space-y-1">
                             <li>• Click the camera icon in your browser's address bar</li>
                             <li>• Select "Allow" for camera access</li>
                             <li>• The camera will start automatically</li>
                           </ul>
                         </div>

                         <div className="flex gap-2">
                           <Button onClick={handlePermissionGranted} className="flex-1">
                              Request Permission
                           </Button>
                            <Button
                              onClick={handlePermissionDenied}
                              variant="outline"
                              className="flex-1 bg-transparent"
                            >
                             Cancel
                           </Button>
                         </div>
                       </div>
                     )}

                     {/* Camera Access Denied */}
                     {hasPermission === false && (
                       <div className="text-center py-8">
                         <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                           <AlertCircle className="h-8 w-8 text-destructive" />
                         </div>
                         <h3 className="font-semibold text-foreground mb-2">Camera Access Denied</h3>
                         <p className="text-muted-foreground mb-4 text-sm">
                            Camera access was denied. To scan QR codes, please allow camera access in your browser
                            settings.
                         </p>
                         
                         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
                           <h4 className="font-medium text-yellow-900 mb-2 text-sm">To enable camera access:</h4>
                           <ul className="text-xs text-yellow-800 space-y-1">
                             <li>• Click the camera icon in your browser's address bar</li>
                             <li>• Select "Allow" for camera access</li>
                             <li>• Refresh the page and try again</li>
                           </ul>
                         </div>

                         <div className="flex gap-2">
                           <Button onClick={() => setHasPermission(null)} className="flex-1">
                             Try Again
                           </Button>
                           <Button onClick={() => setShowPermissionDialog(true)} variant="outline" className="flex-1">
                             Request Permission
                           </Button>
                         </div>
                       </div>
                     )}

                     {/* Camera Scanner */}
                     {!showPermissionDialog && hasPermission !== false && (
                       <div className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-200 bg-black/90">
                         {isScanning ? (
                           <>
                              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                              <canvas ref={canvasRef} className="hidden" />
                              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>

                                {/* Scanning line animation */}
                                <div className="absolute inset-x-4 top-1/2 h-0.5 bg-blue-500 animate-pulse"></div>
                             </div>
                           </>
                         ) : (
                           <div className="flex items-center justify-center h-full">
                             <div className="text-center">
                               <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">Camera ready to start</p>
                               <Button 
                                  onClick={handleStartScanning}
                                 variant="outline" 
                                 size="sm"
                                  className="mt-2 bg-transparent"
                               >
                                  <Camera className="h-4 w-4 mr-2" />
                                  Start Camera
                               </Button>
                             </div>
                           </div>
                         )}
                         <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-xs p-2 flex items-center gap-2">
                           <Camera className="h-3.5 w-3.5" aria-hidden="true" /> Point the camera at a QR code
                         </div>

                          <div className="mt-4">
                            <Button onClick={stopCamera} variant="outline" className="w-full bg-transparent">
                              <X className="h-4 w-4 mr-2" />
                              Cancel Scanning
                            </Button>
                          </div>
                       </div>
                     )}

                     {cameraError && (
                       <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                         <AlertTitle>Camera error</AlertTitle>
                         <AlertDescription className="space-y-2">
                           <p>{cameraError}</p>
                           <Button 
                             onClick={retryCameraAccess} 
                             size="sm" 
                             variant="outline" 
                              className="mt-2 border-red-300 text-red-700 hover:bg-red-100 bg-transparent"
                           >
                             Retry Camera Access
                           </Button>
                         </AlertDescription>
                       </Alert>
                     )}

                     <p className="text-xs text-gray-500">Demo codes: QR-12345-ABCDE, QR-54321-EDCBA</p>
                   </>
                 )}

                {invitationData && (
                  <>
                    <TicketCard 
                      invitationData={invitationData} 
                      scannedTicketCode={detectedCode || manualCode.trim()} 
                      onClose={resetScan} 
                    />
                    <div className="pt-3">
                      <Button
                        onClick={resetScan}
                        variant="outline"
                        className="border-gray-300 text-gray-800 hover:bg-gray-100 bg-transparent"
                      >
                        Scan Another
                      </Button>
                    </div>
                  </>
                )}
                </TabsContent>

                                           <TabsContent value="barcode" className="space-y-4 pt-4">
                {!invitationData && (
                     <>
                       {/* Barcode Scanner Options */}
                       <div className="grid gap-4">
                         <div className="text-center">
                           <h3 className="font-semibold text-foreground mb-2">Choose Barcode Scanning Method</h3>
                           <p className="text-muted-foreground text-sm mb-4">
                             Select how you want to scan barcodes
                           </p>
                         </div>

                         {/* Option 1: Camera Scanner */}
                         <Card className="border-gray-200 hover:border-blue-300 transition-colors">
                           <CardContent className="p-4">
                             <div className="flex items-center gap-3">
                               <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                 <Camera className="h-6 w-6 text-blue-600" />
                               </div>
                               <div className="flex-1">
                                 <h4 className="font-medium text-foreground">Scan with Camera</h4>
                                 <p className="text-sm text-muted-foreground">
                                   Use your device's camera to scan barcodes
                                 </p>
                               </div>
                               <Button
                                 onClick={() => setBarcodeMethod("camera")}
                                 variant="outline"
                                 size="sm"
                                 className="bg-transparent"
                               >
                                 Use Camera
                               </Button>
                             </div>
                           </CardContent>
                         </Card>

                         {/* Option 2: Barcode Scanner Tool */}
                         <Card className="border-gray-200 hover:border-blue-300 transition-colors">
                           <CardContent className="p-4">
                             <div className="flex items-center gap-3">
                               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                 <Barcode className="h-6 w-6 text-green-600" />
                               </div>
                               <div className="flex-1">
                                 <h4 className="font-medium text-foreground">Use Barcode Scanner Tool</h4>
                                 <p className="text-sm text-muted-foreground">
                                   Connect an external barcode scanner device
                                 </p>
                               </div>
                               <Button
                                 onClick={() => setBarcodeMethod("scanner")}
                                 variant="outline"
                                 size="sm"
                                 className="bg-transparent"
                               >
                                 Use Scanner
                               </Button>
                             </div>
                           </CardContent>
                         </Card>
                       </div>

                       {/* Camera Scanner Section */}
                       {barcodeMethod === "camera" && (
                   <>
                     {/* Permission Dialog */}
                     {showPermissionDialog && (
                       <div className="text-center py-8">
                         <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Camera className="h-8 w-8 text-blue-600" />
                         </div>
                               <h3 className="font-semibold text-foreground mb-2">Enable Camera Access</h3>
                         <p className="text-muted-foreground mb-4 text-sm">
                                 This app needs camera access to scan barcodes. When prompted, please click "Allow" to enable
                                 camera access.
                         </p>
                         
                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
                           <h4 className="font-medium text-blue-900 mb-2 text-sm">How to enable camera access:</h4>
                           <ul className="text-xs text-blue-800 space-y-1">
                             <li>• Click the camera icon in your browser's address bar</li>
                             <li>• Select "Allow" for camera access</li>
                             <li>• The camera will start automatically</li>
                           </ul>
                         </div>

                         <div className="flex gap-2">
                           <Button onClick={handlePermissionGranted} className="flex-1">
                                   Request Permission
                           </Button>
                                 <Button
                                   onClick={handlePermissionDenied}
                                   variant="outline"
                                   className="flex-1 bg-transparent"
                                 >
                             Cancel
                           </Button>
                         </div>
                       </div>
                     )}

                     {/* Camera Access Denied */}
                     {hasPermission === false && (
                       <div className="text-center py-8">
                         <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                           <AlertCircle className="h-8 w-8 text-destructive" />
                         </div>
                         <h3 className="font-semibold text-foreground mb-2">Camera Access Denied</h3>
                         <p className="text-muted-foreground mb-4 text-sm">
                                 Camera access was denied. To scan barcodes, please allow camera access in your browser
                                 settings.
                         </p>
                         
                         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
                           <h4 className="font-medium text-yellow-900 mb-2 text-sm">To enable camera access:</h4>
                           <ul className="text-xs text-yellow-800 space-y-1">
                             <li>• Click the camera icon in your browser's address bar</li>
                             <li>• Select "Allow" for camera access</li>
                             <li>• Refresh the page and try again</li>
                           </ul>
                         </div>

                         <div className="flex gap-2">
                           <Button onClick={() => setHasPermission(null)} className="flex-1">
                             Try Again
                           </Button>
                           <Button onClick={() => setShowPermissionDialog(true)} variant="outline" className="flex-1">
                             Request Permission
                           </Button>
                         </div>
                       </div>
                     )}

                     {/* Camera Scanner */}
                     {!showPermissionDialog && hasPermission !== false && (
                       <div className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-200 bg-black/90">
                         {isScanning ? (
                           <>
                                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                   <canvas ref={canvasRef} className="hidden" />
                                   <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                                     <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                                     <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                                     <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                                     <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>

                                     {/* Scanning line animation */}
                                     <div className="absolute inset-x-4 top-1/2 h-0.5 bg-blue-500 animate-pulse"></div>
                             </div>
                           </>
                         ) : (
                           <div className="flex items-center justify-center h-full">
                             <div className="text-center">
                               <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                     <p className="text-muted-foreground">Camera ready to start</p>
                               <Button 
                                       onClick={handleStartScanning}
                                 variant="outline" 
                                 size="sm"
                                       className="mt-2 bg-transparent"
                               >
                                       <Camera className="h-4 w-4 mr-2" />
                                       Start Camera
                               </Button>
                             </div>
                           </div>
                         )}
                         <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-xs p-2 flex items-center gap-2">
                           <Camera className="h-3.5 w-3.5" aria-hidden="true" /> Align the barcode within the frame
                         </div>

                               <div className="mt-4">
                                 <Button onClick={stopCamera} variant="outline" className="w-full bg-transparent">
                                   <X className="h-4 w-4 mr-2" />
                                   Cancel Scanning
                                 </Button>
                               </div>
                       </div>
                     )}
                         </>
                       )}

                       {/* Barcode Scanner Tool Section */}
                       {barcodeMethod === "scanner" && (
                         <div className="space-y-4">
                           <div className="text-center py-8">
                             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                               <Barcode className="h-8 w-8 text-green-600" />
                             </div>
                             <h3 className="font-semibold text-foreground mb-2">Barcode Scanner Tool</h3>
                             <p className="text-muted-foreground mb-4 text-sm">
                               Connect your barcode scanner device and scan barcodes directly
                             </p>

                             <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-left">
                               <h4 className="font-medium text-green-900 mb-2 text-sm">How to use barcode scanner:</h4>
                               <ul className="text-xs text-green-800 space-y-1">
                                 <li>• Connect your barcode scanner to your device</li>
                                 <li>• Make sure the scanner is in keyboard emulation mode</li>
                                 <li>• Click the input field below and scan a barcode</li>
                                 <li>• The scanned code will be automatically processed</li>
                               </ul>
                             </div>

                             <div className="grid gap-2">
                               <Label htmlFor="barcode-input" className="text-gray-800">
                                 Barcode Scanner Input
                               </Label>
                               <Input
                                 id="barcode-input"
                                 placeholder="Scan barcode here or type manually"
                                 value={manualCode}
                                 onChange={(e) => setManualCode(e.target.value)}
                                 onKeyDown={(e) => {
                                   if (e.key === "Enter") {
                                     e.preventDefault()
                                     tryManual()
                                   }
                                 }}
                                 autoFocus
                                 className="text-center text-lg font-mono"
                               />
                               <Button 
                                 onClick={tryManual} 
                                 className="bg-blue-600 hover:bg-blue-700 text-white"
                                 disabled={isCheckingInvitation}
                               >
                                 {isCheckingInvitation ? (
                                   <>
                                     <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                     Checking...
                                   </>
                                 ) : (
                                   "Check Barcode"
                                 )}
                               </Button>
                             </div>
                           </div>
                         </div>
                       )}

                     <p className="text-xs text-gray-500">Demo barcode: BAR-9876543210123 or BAR-1234567890001</p>
                   </>
                 )}

                {invitationData && (
                  <>
                    <TicketCard 
                      invitationData={invitationData} 
                      scannedTicketCode={detectedCode || manualCode.trim()} 
                      onClose={resetScan} 
                    />
                    <div className="pt-3">
                      <Button
                        onClick={resetScan}
                        variant="outline"
                        className="border-gray-300 text-gray-800 hover:bg-gray-100 bg-transparent"
                      >
                        Scan Another
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="invite" className="space-y-4 pt-4">
                {!invitationData && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="invite-code" className="text-gray-800">
                        Invitation Code
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="invite-code"
                          placeholder="Enter 6 or 7 digit invitation code"
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              checkInvitationCode()
                            }
                          }}
                        />
                        <Button 
                          onClick={checkInvitationCode} 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={isCheckingInvitation}
                        >
                          {isCheckingInvitation ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            "Check"
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">Enter a 6 or 7 digit invitation code to check details</p>
                      {manualError && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{manualError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    {detectedCode && (
                      <div role="status" aria-live="polite" className="text-xs text-gray-600">
                        Last entered: <span className="font-mono text-black">{detectedCode}</span>
                      </div>
                    )}
                  </>
                )}

                {invitationData && (
                  <>
                    <TicketCard 
                      invitationData={invitationData} 
                      scannedTicketCode={detectedCode || manualCode.trim()} 
                      onClose={resetScan} 
                    />
                    <div className="pt-3">
                      <Button
                        onClick={resetScan}
                        variant="outline"
                        className="border-gray-300 text-gray-800 hover:bg-gray-100 bg-transparent"
                      >
                        Check Another
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            {!invitationData && (
              <>
                <Separator className="my-6" />
                <div className="text-xs text-gray-600">
                  Tips: ensure lighting is adequate, hold steady, and avoid glare. Sensitive keywords like "VIP" are
                  highlighted for visibility.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      </main>
      
      <Footer />
    </div>
  )
}
