import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';

interface InvitationScannerProps {
  scanMode: 'qr' | 'barcode';
  onResult: (data: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

export default function InvitationScanner({ 
  scanMode, 
  onResult, 
  onError, 
  isProcessing 
}: InvitationScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanningInterval, setScanningInterval] = useState<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Check existing permission first
      checkExistingPermission();
    }
  }, [isMounted]);

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
        setHasPermission(false);
        setError("Camera access denied. Please allow camera permission and try again.");
        onError("Camera access denied. Please allow camera permission and try again.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setHasPermission(false);
        setError("No camera found on this device.");
        onError("No camera found on this device.");
      } else if (error.name === "NotSupportedError" || error.name === "ConstraintNotSatisfiedError") {
        setHasPermission(false);
        setError("Camera not supported or constraints not satisfied.");
        onError("Camera not supported or constraints not satisfied.");
      } else {
        setHasPermission(false);
        setError("Failed to access camera: " + (error.message || "Unknown error"));
        onError("Failed to access camera: " + (error.message || "Unknown error"));
      }
      
      return null;
    }
  };

    const startCamera = async () => {
    try {
      setError(null);
      console.log('Starting camera...');
      
      const stream = await requestCameraPermission();
      if (!stream) {
        console.log('No camera stream available');
        return;
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
          setError('Failed to initialize camera. Please try again.');
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
            setError('Failed to start camera feed');
            stopCamera();
            reject(error);
          });
          startQRScanning();
          resolve(true);
        };
        
        const handleError = (error: any) => {
          console.error('Video error:', error);
          setError('Camera feed error occurred');
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
      setError(`Camera access error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      onError(`Camera access error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
            onResult(code.data);
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



  const handlePermissionGranted = async () => {
    setShowPermissionDialog(false);
    
    // Small delay to let the user prepare
    setTimeout(async () => {
      await startCamera();
    }, 500);
  };

  const handlePermissionDenied = () => {
    setShowPermissionDialog(false);
    setHasPermission(false);
  };

  // Permission Dialog
  if (showPermissionDialog) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Camera Permission Required</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          To scan {scanMode === 'qr' ? 'QR codes' : 'barcodes'}, we need camera access. 
          Your browser will ask for permission.
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
    );
  }

  if (hasPermission === false) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Camera Access Denied</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Camera access was denied. To scan {scanMode === 'qr' ? 'QR codes' : 'barcodes'}, please allow camera access in your browser settings.
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
    );
  }

  return (
    <div className="text-center">
      <div className="relative mb-6">
        <div className="aspect-video bg-muted rounded-xl overflow-hidden relative">
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
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-2">
            {scanMode === 'qr' ? 'Scan QR Code' : 'Scan Barcode'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Position the {scanMode === 'qr' ? 'QR code' : 'barcode'} within the frame to scan
          </p>
        </div>



        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}