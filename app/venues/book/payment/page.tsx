"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function PaymentRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to venues page after 3 seconds
    const timer = setTimeout(() => {
      router.push("/venues")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-4">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Invalid Payment Link</h1>
          <p className="text-gray-600">
            This payment link is invalid or missing the booking ID. Please make sure you're using the correct payment link from your booking confirmation.
          </p>
          <div className="space-y-3">
            <Button onClick={() => router.push("/venues")} className="w-full">
              Browse Venues
            </Button>
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              Go Back
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Redirecting to venues page in 3 seconds...
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
} 