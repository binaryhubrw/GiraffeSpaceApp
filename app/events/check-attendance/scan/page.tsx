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

import { Barcode, QrCode, TicketIcon, Camera, ChevronRight, Home, RefreshCw, AlertCircle, MapPin } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import jsQR from 'jsqr'
import ApiService from "@/api/apiConfig"
import { useRouter } from "next/navigation"

import { Header } from "@/components/header"
import Footer from "@/components/footer"

export default function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"qr" | "barcode" | "invite">("qr");
  const [scanningInterval, setScanningInterval] = useState<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isCheckingInvitation, setIsCheckingInvitation] = useState(false);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);

  // Helper function to detect if a string is a base64 encoded QR code
  const isBase64QRCode = (str: string): boolean => {
    // Check if it's a base64 string that's likely a QR code
    // QR codes typically contain alphanumeric characters and common base64 padding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    return base64Regex.test(str) && str.length > 50 // QR codes are typically longer
  }

  useEffect(() => {
    setIsMounted(true);
    // Verify inspector access on page load
    verifyInspectorAccess();
  }, []);

  // Verify inspector access
  const verifyInspectorAccess = async () => {
    const inspectorCode = localStorage.getItem("inspectorCode");
    const inspectorAccess = localStorage.getItem("inspectorAccess");
    
    if (!inspectorCode || inspectorAccess !== "true") {
      toast.error("Inspector access required. Please verify your access first.");
      router.push("/events/check-attendance/insipector");
      return;
    }

    try {
      setIsVerifyingAccess(true);
      const response = await ApiService.checkInspectorAccess(inspectorCode);
      
      if (!response.success) {
        toast.error("Inspector access expired. Please verify your access again.");
        // Clear stored data
        localStorage.removeItem("inspectorAccess");
        localStorage.removeItem("inspectorCode");
        router.push("/events/check-attendance/insipector");
        return;
      }
      
      toast.success("Inspector access verified successfully!");
    } catch (error: any) {
      console.error("Inspector access verification failed:", error);
      toast.error("Inspector access verification failed. Please try again.");
      // Clear stored data
      localStorage.removeItem("inspectorAccess");
      localStorage.removeItem("inspectorCode");
      router.push("/events/check-attendance/insipector");
      return;
    } finally {
      setIsVerifyingAccess(false);
    }
  };

  // Cleanup camera when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopCamera();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };

    // Handle page refresh and navigation
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Only stop camera, keep inspector access persistent
    };
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Check existing permission first
      checkExistingPermission();
    }
  }, [isMounted]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Stop camera when switching tabs
  useEffect(() => {
    if (activeTab !== "qr" && activeTab !== "barcode") {
      stopCamera();
    }
  }, [activeTab]);

  const checkExistingPermission = async () => {
    try {
      // Check if we can enumerate devices (this requires permission)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length > 0) {
        // We have permission, start camera
        startCamera();
      } else {
        // No permission yet, show permission dialog
        setShowPermissionDialog(true);
      }
    } catch (error) {
      console.error("Error checking existing permission:", error);
      // Show permission dialog if we can't check
      setShowPermissionDialog(true);
    }
  };

  const requestCameraPermission = async () => {
    try {
      console.log("Requesting camera permission...");
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      
      console.log("Camera permission granted");
      setHasPermission(true);
      setShowPermissionDialog(false);
      return stream;
    } catch (error: any) {
      console.error("Camera permission error:", error);
      
      // Handle specific permission errors
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        const errorMsg = "Camera access denied. Please allow camera permission and try again.";
        setHasPermission(false);
        setCameraError(errorMsg);
        toast.error(errorMsg);
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        const errorMsg = "No camera found on this device.";
        setHasPermission(false);
        setCameraError(errorMsg);
        toast.error(errorMsg);
      } else if (error.name === "NotSupportedError" || error.name === "ConstraintNotSatisfiedError") {
        const errorMsg = "Camera not supported or constraints not satisfied.";
        setHasPermission(false);
        setCameraError(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = "Failed to access camera: " + (error.message || "Unknown error");
        setHasPermission(false);
        setCameraError(errorMsg);
        toast.error(errorMsg);
      }
      
      return null;
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      console.log('Starting camera...');
      
      const stream = await requestCameraPermission();
      if (!stream) {
        console.log('No camera stream available');
        throw new Error('No camera stream available');
      }
      
      // Set scanning state first to ensure video element is rendered
      setIsScanning(true);
      
      // Wait for the next render cycle to ensure video element is in DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        console.error('Video element not found - waiting for render');
        // Wait a bit more and try again
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (!videoRef.current) {
          console.error('Video element still not found after waiting');
          stream.getTracks().forEach(track => track.stop());
          setIsScanning(false);
          setCameraError('Failed to initialize camera. Please try again.');
          return;
        }
      }
      
      // Ensure video element has proper attributes
      const video = videoRef.current;
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      
      video.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        if (!video) {
          reject(new Error('Video element not available'));
          return;
        }
        
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded, starting playback');
          video.play().catch(error => {
            console.error('Failed to play video:', error);
            setCameraError('Failed to start camera feed');
            stopCamera();
            reject(error);
          });
          startQRScanning();
          resolve(true);
        };
        
        const handleError = (error: any) => {
          console.error('Video error:', error);
          setCameraError('Camera feed error occurred');
          stopCamera();
          reject(error);
        };
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('error', handleError, { once: true });
        
        // Set a timeout in case the video never loads
        setTimeout(() => {
          reject(new Error('Video failed to load within timeout'));
        }, 5000);
      });
      
    } catch (err) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      setIsScanning(false);
      const errorMsg = `Camera access error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setCameraError(errorMsg);
      throw err; // Re-throw the error so retryCameraAccess can catch it
    }
  };

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            console.log('QR Code detected:', code.data);
            stopCamera();
            handleResolve(code.data);
          }
        }
      }
    }, 100); // Scan every 100ms

    setScanningInterval(interval);
  };

  const stopCamera = () => {
    if (scanningInterval) {
      clearInterval(scanningInterval);
      setScanningInterval(null);
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

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
      } else {
        toast.error("Invalid code format. Please scan a valid invitation code or QR code.")
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
    // Restart camera if we're on a camera tab
    if (activeTab === "qr" || activeTab === "barcode") {
      startCamera();
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
    } else {
      setManualError("Invalid code format. Please enter a valid invitation code or QR code.")
      toast.error("Invalid code format. Please enter a valid invitation code or QR code.")
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
        sixDigitCode: storedSixDigitCode // Use stored sixDigitCode from inspector access
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
      const errorMessage = error.response?.data?.message || error.message || "Failed to check invitation. Please try again."
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
        sixDigitCode: storedSixDigitCode
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
      const errorMessage = error.response?.data?.message || error.message || "Failed to check QR code invitation. Please try again."
      setManualError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsCheckingInvitation(false)
    }

  
  }

  const handlePermissionGranted = async () => {
    setShowPermissionDialog(false);
    
    // Small delay to let the user prepare - this is crucial for browser permission flow
    setTimeout(async () => {
      try {
        await startCamera();
        toast.success("Camera access granted!");
      } catch (error: any) {
        console.error("Camera start failed after permission:", error);
        if (error.name === 'NotAllowedError') {
          const errorMsg = "Camera permission denied. Please allow camera access in your browser settings and try again.";
          setCameraError(errorMsg);
          toast.error(errorMsg);
        } else if (error.name === 'NotFoundError') {
          const errorMsg = "No camera found on this device.";
          setCameraError(errorMsg);
          toast.error(errorMsg);
        } else {
          const errorMsg = "Camera access failed. You can still enter codes manually.";
          setCameraError(errorMsg);
          toast.error(errorMsg);
        }
        setHasPermission(false);
      }
    }, 500);
  };

  const handlePermissionDenied = () => {
    setShowPermissionDialog(false);
    setHasPermission(false);
  };

  async function retryCameraAccess() {
    setCameraError(null)
    try {
      await startCamera()
      toast.success("Camera access granted!")
    } catch (error: any) {
      console.error("Camera retry failed:", error)
      if (error.name === 'NotAllowedError') {
        const errorMsg = "Camera permission denied. Please allow camera access in your browser settings and try again."
        setCameraError(errorMsg)
        toast.error(errorMsg)
      } else if (error.name === 'NotFoundError') {
        const errorMsg = "No camera found on this device."
        setCameraError(errorMsg)
        toast.error(errorMsg)
      } else {
        const errorMsg = "Camera access failed. You can still enter codes manually."
        setCameraError(errorMsg)
        toast.error(errorMsg)
      }
      setHasPermission(false)
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
                <p className="text-sm text-gray-600 mt-1">Scan QR codes, barcodes, or enter invitation codes to check attendance</p>
              </div>
            </div>
            <Link href="/events/check-attendance/insipector" className="text-sm text-gray-700 underline underline-offset-4">
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
                         <h3 className="font-semibold text-foreground mb-2">Camera Permission Required</h3>
                         <p className="text-muted-foreground mb-4 text-sm">
                           To scan QR codes, we need camera access. Your browser will ask for permission.
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
                             Allow Camera Access
                           </Button>
                           <Button onClick={handlePermissionDenied} variant="outline" className="flex-1">
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
                           Camera access was denied. To scan QR codes, please allow camera access in your browser settings.
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
                             <video
                               ref={videoRef}
                               autoPlay
                               playsInline
                               muted
                               className="w-full h-full object-cover"
                             />
                             <canvas
                               ref={canvasRef}
                               className="hidden"
                             />
                             <div className="absolute inset-0 border-4 border-primary/30 rounded-xl">
                               <div className="absolute inset-4 border-2 border-primary border-dashed rounded-lg animate-pulse">
                                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                   <div className="w-24 h-24 border-4 border-primary rounded-lg bg-primary/10"></div>
                                 </div>
                               </div>
                             </div>
                           </>
                         ) : (
                           <div className="flex items-center justify-center h-full">
                             <div className="text-center">
                               <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                               <p className="text-muted-foreground">Starting camera...</p>
                               <Button 
                                 onClick={startCamera} 
                                 variant="outline" 
                                 size="sm"
                                 className="mt-2"
                               >
                                 <RefreshCw className="h-4 w-4 mr-2" />
                                 Retry Camera
                               </Button>
                             </div>
                           </div>
                         )}
                         <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-xs p-2 flex items-center gap-2">
                           <Camera className="h-3.5 w-3.5" aria-hidden="true" /> Point the camera at a QR code
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
                             className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
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
/events/${eventId}/create-ticketals              </TabsContent>

                                           <TabsContent value="barcode" className="space-y-4 pt-4">
                {!invitationData && (
                   <>
                     {/* Permission Dialog */}
                     {showPermissionDialog && (
                       <div className="text-center py-8">
                         <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Camera className="h-8 w-8 text-blue-600" />
                         </div>
                         <h3 className="font-semibold text-foreground mb-2">Camera Permission Required</h3>
                         <p className="text-muted-foreground mb-4 text-sm">
                           To scan barcodes, we need camera access. Your browser will ask for permission.
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
                             Allow Camera Access
                           </Button>
                           <Button onClick={handlePermissionDenied} variant="outline" className="flex-1">
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
                           Camera access was denied. To scan barcodes, please allow camera access in your browser settings.
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
                             <video
                               ref={videoRef}
                               autoPlay
                               playsInline
                               muted
                               className="w-full h-full object-cover"
                             />
                             <canvas
                               ref={canvasRef}
                               className="hidden"
                             />
                             <div className="absolute inset-0 border-4 border-primary/30 rounded-xl">
                               <div className="absolute inset-4 border-2 border-primary border-dashed rounded-lg animate-pulse">
                                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                   <div className="w-24 h-24 border-4 border-primary rounded-lg bg-primary/10"></div>
                                 </div>
                               </div>
                             </div>
                           </>
                         ) : (
                           <div className="flex items-center justify-center h-full">
                             <div className="text-center">
                               <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                               <p className="text-muted-foreground">Starting camera...</p>
                               <Button 
                                 onClick={startCamera} 
                                 variant="outline" 
                                 size="sm"
                                 className="mt-2"
                               >
                                 <RefreshCw className="h-4 w-4 mr-2" />
                                 Retry Camera
                               </Button>
                             </div>
                           </div>
                         )}
                         <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-xs p-2 flex items-center gap-2">
                           <Camera className="h-3.5 w-3.5" aria-hidden="true" /> Align the barcode within the frame
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

