"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck, ShieldAlert, ChevronRight, Home } from "lucide-react"
import ApiService from "@/api/apiConfig"
import { toast } from "sonner"
import { Header } from "@/components/header"
import Footer from "@/components/footer"

export default function InspectorGatePage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)



  useEffect(() => {
    setError(null)
  }, [code])

  function validateSixDigit(value: string) {
    return /^\d{6}$/.test(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validateSixDigit(code)) {
      setError("Please enter a valid 6-digit inspector code.")
      return
    }
    setLoading(true)
    
    try {
      // Call the real API with the six-digit code
      const response = await ApiService.checkInspectorAccess(code)
      
      if (response.success) {
        // Display response message and status in toast
        const successMessage = response.message || "Access granted! Redirecting to scanner..."
        toast.success(`Status: ${response.success ? 'Success' : 'Failed'} - ${successMessage}`)
        // Store inspector access token or session if needed
        localStorage.setItem("inspectorAccess", "true")
        localStorage.setItem("inspectorCode", code)
        router.push("/events/check-attendance/scan")
      } else {
        // Display response message and status in toast for failure
        const errorMessage = response.message || "Invalid inspector code. Please try again."
        toast.error(`Status: ${response.success ? 'Success' : 'Failed'} - ${errorMessage}`)
        setError(errorMessage)
      }
    } catch (error: any) {
      console.error("Inspector access error:", error)
      const errorMessage = error.response?.data?.message || "Failed to verify inspector access. Please try again."
      const errorStatus = error.response?.status || "Unknown"
      toast.error(`Status: ${errorStatus} - ${errorMessage}`)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header activePage="inspector" />
      
      <main className="flex items-center justify-center p-4 flex-1">
        <div className="w-full max-w-md space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" className="flex items-center hover:text-blue-600 transition-colors">
              <Home className="h-4 w-4 mr-1" />
              Home
            </a>
            <ChevronRight className="h-4 w-4" />
            <a href="/events" className="hover:text-blue-600 transition-colors">
              Events
            </a>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Inspector Access</span>
          </nav>

          <Card className="w-full border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gray-700" aria-hidden="true" />
            <CardTitle>Inspector Access</CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Enter your 6-digit scanner/inspector code to start scanning tickets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inspector-code" className="text-gray-800">
                Inspector code
              </Label>
              <Input
                id="inspector-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                className="tracking-[0.5em] [letter-spacing:0.5em] text-center text-lg"
                aria-invalid={!!error}
                aria-describedby={error ? "inspector-error" : undefined}
              />
              <p className="text-xs text-gray-500">Enter your 6-digit inspector code provided by the event organizer</p>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="bg-red-50 border-red-200 text-red-900"
                id="inspector-error"
                role="alert"
              >
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Authentication failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Verifying..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
