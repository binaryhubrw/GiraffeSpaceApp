"use client"

import React, { useState } from "react"
import { ArrowLeft, QrCode, ScanLine, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import InvitationScanner from "./InvitationScanner"
import ManualInvitationInput from "./ManualInvitationInput"
import InvitationDetails from "./InvitationDetails"
import ApiService from "@/api/apiConfig"
import { Header } from "@/components/header"
import Footer from "@/components/footer"

export default function InvitationChecker() {
  const [activeMode, setActiveMode] = useState<'qr' | 'barcode' | 'manual'>('qr')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  const scanModes = [
    {
      mode: 'qr',
      label: 'QR Code',
      icon: 'QrCode',
      description: 'Scan QR code from invitation'
    },
    {
      mode: 'barcode',
      label: 'Barcode',
      icon: 'ScanLine', 
      description: 'Scan barcode from invitation'
    },
    {
      mode: 'manual',
      label: '7-Digit Code',
      icon: 'Hash',
      description: 'Enter 7-digit code manually'
    }
  ]

  const handleScanResult = async (data: string) => {
    setIsProcessing(true)
    try {
      const invitationData = {
        ticketCode: data,
        codeType: "QR_CODE"
      }
      
      const response = await ApiService.checkAndScanQrcodeInvitation(invitationData)
      console.log("API Response:", response)
      
      // Handle the response - even if success is false, we might have valid data
      if (response.success) {
        // Valid ticket that can be checked in
        setResult({
          success: true,
          message: response.message || "QR code processed successfully",
          alertType: "success",
          invitation: response.data,
          checkInDetails: response.checkInDetails,
          allowCheckIn: !response.data?.isUsed
        })
        setShowDetails(true)
      } else {
        // Ticket exists but might be used or have other issues
        setResult({
          success: false,
          message: response.message || "QR code verification failed",
          alertType: response.data?.isUsed ? "warning" : "error",
          invitation: response.data,
          checkInDetails: response.checkInDetails,
          allowCheckIn: false
        })
        setShowDetails(true)
      }
    } catch (error: any) {
      console.error("Error scanning QR code:", error)
      
      // Check if this is a 400 error with a valid response message
      if (error.response?.status === 400 && error.response?.data?.message) {
        // This is likely a "already used" response, not a real error
        setResult({
          success: false,
          message: error.response.data.message,
          alertType: "warning",
          invitation: error.response.data.data || null,
          checkInDetails: error.response.data.checkInDetails || [],
          allowCheckIn: false
        })
        setShowDetails(true)
      } else {
        // This is a real error
        setResult({
          success: false,
          message: error.response?.data?.message || "Failed to scan QR code. Please try again.",
          alertType: "error"
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualSubmit = async (invitationId: string) => {
    setIsProcessing(true)
    try {
      const invitationData = {
        ticketCode: invitationId,
        codeType: "SEVEN_DIGIT_CODE"
      }
      
      const response = await ApiService.checkInvitationWithInvitationID(invitationData)
      console.log("API Response:", response)
      
      // Handle the response - even if success is false, we might have valid data
      if (response.success) {
        // Valid ticket that can be checked in
        setResult({
          success: true,
          message: response.message || "Code verified successfully",
          alertType: "success",
          invitation: response.data,
          checkInDetails: response.checkInDetails,
          allowCheckIn: !response.data?.isUsed
        })
        setShowDetails(true)
      } else {
        // Ticket exists but might be used or have other issues
        setResult({
          success: false,
          message: response.message || "Code verification failed",
          alertType: response.data?.isUsed ? "warning" : "error",
          invitation: response.data,
          checkInDetails: response.checkInDetails,
          allowCheckIn: false
        })
        setShowDetails(true)
      }
    } catch (error: any) {
      console.error("Error checking invitation:", error)
      
      // Check if this is a 400 error with a valid response message
      if (error.response?.status === 400 && error.response?.data?.message) {
        // This is likely a "already used" response, not a real error
        setResult({
          success: false,
          message: error.response.data.message,
          alertType: "warning",
          invitation: error.response.data.data || null,
          checkInDetails: error.response.data.checkInDetails || [],
          allowCheckIn: false
        })
        setShowDetails(true)
      } else {
        // This is a real error
        setResult({
          success: false,
          message: error.response?.data?.message || "Failed to check invitation. Please try again.",
          alertType: "error"
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScanError = (error: string) => {
    setResult({
      success: false,
      message: error,
      alertType: "error"
    })
  }

  const resetChecker = () => {
    setResult(null)
    setShowDetails(false)
    setIsProcessing(false)
  }

  const renderModeIcon = (iconName: string) => {
    switch (iconName) {
      case 'QrCode':
        return <QrCode className="h-5 w-5" />
      case 'ScanLine':
        return <ScanLine className="h-5 w-5" />
      case 'Hash':
        return <Hash className="h-5 w-5" />
      default:
        return <QrCode className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Check Invitation</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {!result && (
            <>
              {/* Mode Selection Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex">
                  {scanModes.map((mode) => (
                    <button
                      key={mode.mode}
                      onClick={() => setActiveMode(mode.mode)}
                      className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeMode === mode.mode
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      disabled={isProcessing}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {renderModeIcon(mode.icon)}
                        <span className="hidden sm:block">{mode.label}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Active Mode Content */}
              <div className="p-6">
                {isProcessing && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Checking invitation...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait while we verify your invitation</p>
                  </div>
                )}

                {!isProcessing && (
                  <>
                    {(activeMode === 'qr' || activeMode === 'barcode') && (
                      <InvitationScanner
                        scanMode={activeMode}
                        onResult={handleScanResult}
                        onError={handleScanError}
                        isProcessing={isProcessing}
                      />
                    )}

                    {activeMode === 'manual' && (
                      <ManualInvitationInput
                        onSubmit={handleManualSubmit}
                        isProcessing={isProcessing}
                      />
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Results */}
          {result && !showDetails && (
            <div className="p-6">
              <InvitationDetails
                result={result}
                onClose={() => window.history.back()}
                onScanAnother={resetChecker}
              />
            </div>
          )}
        </div>

        {/* Help Section */}
        {!result && !isProcessing && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make sure your invitation is clearly visible when scanning</li>
              <li>• For QR codes, position the code within the camera frame</li>
              <li>• If scanning fails, try the manual entry option</li>
              <li>• Contact the event organizer if you're having trouble</li>
            </ul>
          </div>
        )}


      </div>

      {/* Full Screen Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invitation Details</DialogTitle>
          </DialogHeader>
          {result && (
            <InvitationDetails
              result={result}
              onClose={() => setShowDetails(false)}
              onScanAnother={() => {
                setShowDetails(false)
                resetChecker()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}