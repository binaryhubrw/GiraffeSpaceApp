"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  MapPin,
  Loader2,
  Check,
  AlertCircle,
  CreditCard,
  Shield,
  Building,
  Users,
  Star,
  Clock,
  DollarSign,
  FileText,
  Calculator,
} from "lucide-react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useParams } from "next/navigation"
import ApiService from "@/api/apiConfig"

interface VenueBookingData {
  bookingId: string
  eventId: string
  venueId: string
  eventTitle: string
  bookingDates: Array<{ date: string }>
  bookingReason: string
  venue: {
    venueName: string
    description: string
    capacity: number
    venueLocation: string
    mainPhotoUrl: string
    photoGallery: string[]
    basePrice: number
    bookingType: string
    amenities: string[]
  }
  organizer: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    organization?: string
  }
  pricing: {
    baseAmount: number
    discountPercent: number
    discountAmount: number
    taxPercent: number
    taxAmount: number
    totalAmount: number
  }
  bookingStatus: string
  createdAt: string
}

interface PaymentMethod {
  id: string
  type: "card" | "mobile" | "bank" | "installment"
  name: string
  icon: string
  description?: string
}

interface PayVenueBookingProps {
  bookingId: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "card",
    type: "card",
    name: "Credit/Debit Card",
    icon: "💳",
    description: "Pay instantly with your card",
  },
  {
    id: "mobile",
    type: "mobile",
    name: "Mobile Money",
    icon: "📱",
    description: "MTN Mobile Money, Airtel Money",
  },
  {
    id: "bank",
    type: "bank",
    name: "Bank Transfer",
    icon: "🏦",
    description: "Direct bank transfer",
  },
  {
    id: "installment",
    type: "installment",
    name: "Installment Plan",
    icon: "📅",
    description: "Pay in multiple installments",
  },
]

// Mock logged-in user
const mockLoggedInUser = {
  userId: "5f726607-0112-4474-8e43-fa9af91bd2b7",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phoneNumber: "+1234567890",
  organization: "Tech Corp",
}

// Mock venue booking data
const mockVenueBookingData: VenueBookingData = {
  bookingId: "fcdc9e82-b0f6-481b-b9e8-3cb77667a6e5",
  eventId: "980ed166-1202-4807-839c-386212d75dbf",
  venueId: "eda25e91-ff83-4cbb-8ef6-d90503eb77a2",
  eventTitle: "Tech Innovation Summit 2025",
  bookingDates: [{ date: "2025-08-30" }, { date: "2025-08-31" }],
  bookingReason: "CONFERENCE",
  venue: {
    venueName: "Virunga Tents",
    description: "Premium venue perfect for conferences, meetings, and corporate events with modern facilities",
    capacity: 1002,
    venueLocation: "Nyarugenge, Kigali",
    mainPhotoUrl:
      "https://res.cloudinary.com/di5ntdtyl/image/upload/v1753082307/venues/main_photos/y6tbsfzxqouvd3v8lmcq.jpg",
    photoGallery: [
      "https://res.cloudinary.com/di5ntdtyl/image/upload/v1753082309/venues/gallery/l3t9thji8ahdbh8kxmxu.jpg",
      "https://res.cloudinary.com/di5ntdtyl/image/upload/v1753082310/venues/gallery/uo5frltdutjxbrwijgem.jpg",
    ],
    basePrice: 2500,
    bookingType: "DAILY",
    amenities: ["WiFi", "Projector", "Sound System", "Catering", "Parking", "AC"],
  },
  organizer: {
    firstName: mockLoggedInUser.firstName,
    lastName: mockLoggedInUser.lastName,
    email: mockLoggedInUser.email,
    phoneNumber: mockLoggedInUser.phoneNumber,
    organization: mockLoggedInUser.organization,
  },
  pricing: {
    baseAmount: 5000, // 2 days × $2500
    discountPercent: 10,
    discountAmount: 500,
    taxPercent: 18,
    taxAmount: 810, // (5000 - 500) × 0.18
    totalAmount: 5310,
  },
  bookingStatus: "PENDING_PAYMENT",
  createdAt: "2025-07-22T23:41:22.379Z",
}

export default function PayVenueBooking() {
  const params = useParams()
  const bookingId = params.bookingId as string
  
  const [bookingData, setBookingData] = useState<VenueBookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Review, 2: Payment, 3: Confirmation

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })
  const [installmentPlan, setInstallmentPlan] = useState({
    numberOfInstallments: 3,
    firstPaymentAmount: 0,
    monthlyAmount: 0,
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true)
        // Use mock data for now to ensure page displays correctly
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate loading
        setBookingData(mockVenueBookingData)
      } catch (err) {
        setError("Failed to load booking data")
        console.error("Error fetching booking:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchBookingData()
  }, [bookingId])

  useEffect(() => {
    if (bookingData && installmentPlan.numberOfInstallments > 0) {
      const firstPayment = Math.ceil(bookingData.pricing.totalAmount * 0.4) // 40% upfront
      const remaining = bookingData.pricing.totalAmount - firstPayment
      const monthlyAmount = Math.ceil(remaining / (installmentPlan.numberOfInstallments - 1))

      setInstallmentPlan((prev) => ({
        ...prev,
        firstPaymentAmount: firstPayment,
        monthlyAmount: monthlyAmount,
      }))
    }
  }, [bookingData, installmentPlan.numberOfInstallments])

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!agreeToTerms) {
          newErrors.terms = "Please agree to the terms and conditions"
        }
        break
      case 2:
        if (!paymentMethod) {
          newErrors.paymentMethod = "Please select a payment method"
        }
        if (paymentMethod === "card") {
          if (!cardDetails.cardNumber.trim()) newErrors.cardNumber = "Card number is required"
          if (!cardDetails.expiryDate.trim()) newErrors.expiryDate = "Expiry date is required"
          if (!cardDetails.cvv.trim()) newErrors.cvv = "CVV is required"
          if (!cardDetails.cardholderName.trim()) newErrors.cardholderName = "Cardholder name is required"
        }
        if (paymentMethod === "installment") {
          if (installmentPlan.numberOfInstallments < 2 || installmentPlan.numberOfInstallments > 12) {
            newErrors.installments = "Number of installments must be between 2 and 12"
          }
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handlePayment = async () => {
    if (!validateStep(2)) return

    setProcessing(true)

    try {
      const paymentData = {
        bookingId,
        eventId: bookingData?.eventId,
        venueId: bookingData?.venueId,
        payerId: mockLoggedInUser.userId,
        paymentMethod,
        paymentDetails: paymentMethod === "card" ? cardDetails : {},
        installmentPlan: paymentMethod === "installment" ? installmentPlan : null,
        specialInstructions,
        totalAmount: bookingData?.pricing.totalAmount,
        paymentType: "VENUE_BOOKING",
      }

      console.log("Processing venue booking payment:", paymentData)

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setSuccess(true)
      setCurrentStep(3)
    } catch (err) {
      setError("Payment failed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error && !bookingData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Booking Not Found</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
              <p className="text-gray-600">
                Your venue booking payment has been processed successfully. The venue is now confirmed for your event.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  $
                  {paymentMethod === "installment"
                    ? installmentPlan.firstPaymentAmount
                    : bookingData?.pricing.totalAmount}
                </p>
                {paymentMethod === "installment" && (
                  <p className="text-xs text-gray-500 mt-1">
                    First installment of {installmentPlan.numberOfInstallments} payments
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => window.history.back()}>
                  Back to Event
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  Download Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Review Booking Details</h2>
              <p className="text-gray-600">Please review your venue booking before payment</p>
            </div>

            {/* Event & Venue Summary */}
            <Card className="border-2">
              <CardContent className="p-0">
                <div className="relative h-48">
                  <Image
                    src={
                      bookingData?.venue.mainPhotoUrl || "/placeholder.svg?height=200&width=800&query=venue main photo"
                    }
                    alt={bookingData?.venue.venueName || "Venue"}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-t-lg" />
                  <div className="absolute inset-0 flex items-end p-4">
                    <div className="text-white">
                      <h3 className="text-xl font-bold">{bookingData?.venue.venueName}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{bookingData?.venue.venueLocation}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Up to {bookingData?.venue.capacity} people</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Event Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Event Title:</span>
                        <p className="font-medium">{bookingData?.eventTitle}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Booking Reason:</span>
                        <p className="font-medium">{bookingData?.bookingReason}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Booking Dates:</span>
                        <div className="space-y-1">
                          {bookingData?.bookingDates.map((d, index) => (
                            <p key={index} className="font-medium">
                              {new Date(d.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <p className="font-medium">{bookingData?.bookingDates.length} day(s)</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Venue Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {bookingData?.venue.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Organizer Information</h4>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {bookingData?.organizer.firstName[0]}
                          {bookingData?.organizer.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {bookingData?.organizer.firstName} {bookingData?.organizer.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{bookingData?.organizer.email}</p>
                        {bookingData?.organizer.organization && (
                          <p className="text-sm text-gray-600">{bookingData?.organizer.organization}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Special Instructions (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requirements or instructions for the venue..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                      I agree to the terms and conditions *
                    </Label>
                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                      <p>• Venue booking is subject to availability and confirmation</p>
                      <p>• Cancellation policy: 48 hours notice required for full refund</p>
                      <p>• Additional charges may apply for damages or extra services</p>
                      <p>• Payment must be completed to confirm the booking</p>
                    </div>
                  </div>
                </div>
                {errors.terms && <p className="text-sm text-red-500 mt-2">{errors.terms}</p>}
              </CardContent>
            </Card>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
              <p className="text-gray-600">Choose how you'd like to pay for the venue booking</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Select Payment Method *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {paymentMethods.map((method) => (
                    <Card
                      key={method.id}
                      className={`cursor-pointer border-2 transition-colors ${
                        paymentMethod === method.id ? "border-purple-500 bg-purple-50" : "hover:border-gray-300"
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{method.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-gray-600">{method.description}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {errors.paymentMethod && <p className="text-sm text-red-500 mt-1">{errors.paymentMethod}</p>}
              </div>

              {paymentMethod === "card" && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Card Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="cardholderName">Cardholder Name *</Label>
                      <Input
                        id="cardholderName"
                        value={cardDetails.cardholderName}
                        onChange={(e) => setCardDetails((prev) => ({ ...prev, cardholderName: e.target.value }))}
                        className={`mt-1 ${errors.cardholderName ? "border-red-500" : ""}`}
                      />
                      {errors.cardholderName && <p className="text-sm text-red-500 mt-1">{errors.cardholderName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails((prev) => ({ ...prev, cardNumber: e.target.value }))}
                        placeholder="1234 5678 9012 3456"
                        className={`mt-1 ${errors.cardNumber ? "border-red-500" : ""}`}
                      />
                      {errors.cardNumber && <p className="text-sm text-red-500 mt-1">{errors.cardNumber}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date *</Label>
                        <Input
                          id="expiryDate"
                          value={cardDetails.expiryDate}
                          onChange={(e) => setCardDetails((prev) => ({ ...prev, expiryDate: e.target.value }))}
                          placeholder="MM/YY"
                          className={`mt-1 ${errors.expiryDate ? "border-red-500" : ""}`}
                        />
                        {errors.expiryDate && <p className="text-sm text-red-500 mt-1">{errors.expiryDate}</p>}
                      </div>

                      <div>
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails((prev) => ({ ...prev, cvv: e.target.value }))}
                          placeholder="123"
                          className={`mt-1 ${errors.cvv ? "border-red-500" : ""}`}
                        />
                        {errors.cvv && <p className="text-sm text-red-500 mt-1">{errors.cvv}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {paymentMethod === "installment" && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Installment Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="installments">Number of Installments</Label>
                      <select
                        id="installments"
                        value={installmentPlan.numberOfInstallments}
                        onChange={(e) =>
                          setInstallmentPlan((prev) => ({
                            ...prev,
                            numberOfInstallments: Number.parseInt(e.target.value),
                          }))
                        }
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      >
                        {[2, 3, 4, 6, 12].map((num) => (
                          <option key={num} value={num}>
                            {num} installments
                          </option>
                        ))}
                      </select>
                      {errors.installments && <p className="text-sm text-red-500 mt-1">{errors.installments}</p>}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">First Payment (Today):</span>
                        <span className="font-semibold">${installmentPlan.firstPaymentAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Monthly Payment ({installmentPlan.numberOfInstallments - 1} payments):
                        </span>
                        <span className="font-semibold">${installmentPlan.monthlyAmount}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total Amount:</span>
                        <span>${bookingData?.pricing.totalAmount}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <p>• First payment is due today to confirm booking</p>
                      <p>• Subsequent payments will be automatically charged monthly</p>
                      <p>• No additional fees for installment payments</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {paymentMethod === "mobile" && (
                <Card className="border-2">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <h3 className="font-semibold mb-2">Mobile Money Payment</h3>
                    <p className="text-gray-600 text-sm">
                      You will receive a prompt on your mobile device to complete the payment. Supported: MTN Mobile
                      Money, Airtel Money
                    </p>
                  </CardContent>
                </Card>
              )}

              {paymentMethod === "bank" && (
                <Card className="border-2">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">🏦</div>
                    <h3 className="font-semibold mb-2">Bank Transfer</h3>
                    <p className="text-gray-600 text-sm">
                      Bank details will be provided after you proceed. Booking will be confirmed once payment is
                      received.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-700">Your payment information is secure and encrypted</span>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pay for Venue Booking</h1>
            <p className="text-gray-600">Complete your venue booking payment</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {[
                { step: 1, title: "Review Booking", icon: FileText },
                { step: 2, title: "Payment", icon: CreditCard },
                { step: 3, title: "Confirmation", icon: Check },
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step === currentStep
                        ? "bg-blue-500 border-blue-500 text-white"
                        : step < currentStep
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {step < currentStep ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      step === currentStep ? "text-blue-600" : step < currentStep ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardContent className="p-8">{renderStepContent()}</CardContent>
              </Card>

              {/* Navigation */}
              {currentStep < 3 && (
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="bg-transparent">
                    Previous
                  </Button>

                  {currentStep < 2 ? (
                    <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                      Next
                    </Button>
                  ) : (
                    <Button onClick={handlePayment} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Complete Payment
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Payment Summary Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Venue</div>
                      <div className="font-semibold">{bookingData?.venue.venueName}</div>
                      <div className="text-sm text-gray-600">{bookingData?.venue.venueLocation}</div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm text-muted-foreground">Event</div>
                      <div className="font-semibold">{bookingData?.eventTitle}</div>
                      <div className="text-sm text-gray-600">{bookingData?.bookingReason}</div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-semibold">{bookingData?.bookingDates.length} day(s)</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {bookingData?.bookingDates.map((d, index) => (
                          <div key={index}>
                            {new Date(d.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Base Amount:</span>
                        <span>${bookingData?.pricing.baseAmount}</span>
                      </div>
                      {bookingData?.pricing.discountPercent > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({bookingData?.pricing.discountPercent}%):</span>
                          <span>-${bookingData?.pricing.discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Tax ({bookingData?.pricing.taxPercent}%):</span>
                        <span>${bookingData?.pricing.taxAmount}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span className="text-purple-600">${bookingData?.pricing.totalAmount}</span>
                      </div>
                    </div>

                    {paymentMethod === "installment" && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Payment Plan</div>
                          <div className="flex justify-between text-sm">
                            <span>Today:</span>
                            <span className="font-semibold">${installmentPlan.firstPaymentAmount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Monthly ({installmentPlan.numberOfInstallments - 1}x):</span>
                            <span>${installmentPlan.monthlyAmount}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Booking expires in 24 hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Secure payment processing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Venue Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Venue Highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Capacity: {bookingData?.venue.capacity} people</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-gray-500" />
                    <span>Premium venue with modern facilities</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>${bookingData?.venue.basePrice}/day base rate</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
