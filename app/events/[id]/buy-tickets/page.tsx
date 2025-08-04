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
  Calendar,
  MapPin,
  Loader2,
  Check,
  AlertCircle,
  CreditCard,
  Shield,
  Ticket,
  Plus,
  Minus,
  Clock,
  Users,
  Star,
} from "lucide-react"
import Image from "next/image"
// Removed API import since we're using mock data
import { Switch } from "@/components/ui/switch"
import { useAttendee } from "@/context/AttendeeContext"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"
import { toast } from "sonner"

interface EventData {
  eventVenues: any
  eventId: string
  eventName: string
  eventType: string
  eventDescription: string
  eventPhoto: string
  bookingDates: Array<{ date: string }>
  maxAttendees: number | null
  eventStatus: string
  isFeatured: boolean
  isEntryPaid: boolean
  visibilityScope: string
  venues: Array<{
    venueName: string
    venueLocation: string
    capacity: number
  }>
}

interface TicketType {
  ticketTypeId: string
  eventId: string
  name: string
  description: string
  price: string
  quantityAvailable: number
  quantitySold: number
  currency: string
  saleStartsAt: string
  saleEndsAt: string
  createdAt: string
  updatedAt: string
  isPubliclyAvailable: boolean
  maxPerPerson: number
  isActive: boolean
  categoryDiscounts: {
    [key: string]: {
      percent: number
      description: string
    }
  } | null
  isRefundable: boolean
  refundPolicy: string | null
  transferable: boolean
  ageRestriction: string
  specialInstructions: string | null
  status: string
  validForDate: string | null
}

interface PaymentMethod {
  id: string
  type: "card" | "mobile" | "bank"
  name: string
  icon: string
}

interface BuyerInfo {
  recipientEmail: string
  attendeeNames: string[]
}

interface BuyTicketProps {
  eventId: string
}

const paymentMethods: PaymentMethod[] = [
  { id: "card", type: "card", name: "Credit/Debit Card", icon: "💳" },
  { id: "mobile", type: "mobile", name: "Mobile Money", icon: "📱" },
  { id: "bank", type: "bank", name: "Bank Transfer", icon: "🏦" },
]

export default function BuyTicketForm({ eventId: propEventId }: { eventId?: string }) {
  const params = useParams();
  const eventId = (propEventId || params.id) as string;
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Tickets, 2: Details, 3: Payment

  // Form state
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const { attendees: registeredAttendees } = useAttendee();
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    recipientEmail: "",
    attendeeNames: [],
  })
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [mobileMoneyAmount, setMobileMoneyAmount] = useState<number>(0)
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })
  const [specialRequests, setSpecialRequests] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Simulate a brief loading time
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        // Use mock data instead of API calls
        const mockEventData: EventData = {
          eventVenues: [],
          eventId: "ccec53d7-eb77-4c06-937b-3b20b801714c",
          eventName: "iwacu muzika",
          eventType: "PARTY",
          eventDescription: "An amazing music festival featuring top artists and incredible performances",
          eventPhoto: "https://res.cloudinary.com/di5ntdtyl/image/upload/v1753799162/events/photos/ofs29hfkvinl013s3tb6.jpg",
          bookingDates: [{ date: "2025-10-12" }, { date: "2025-10-13" }, { date: "2025-10-14" }],
          maxAttendees: 9999,
          eventStatus: "APPROVED",
          isFeatured: true,
          isEntryPaid: true,
          visibilityScope: "PUBLIC",
          venues: [
            {
              venueName: "Akagera Tents",
              venueLocation: "59 KN 7 Ave, Kigali, Rwanda",
              capacity: 10000,
            },
          ],
        }
        
        const mockTicketTypes: TicketType[] = [
          {
            ticketTypeId: "early-bird",
            eventId: "ccec53d7-eb77-4c06-937b-3b20b801714c",
            name: "Early Bird Special",
            description: "Limited time offer with exclusive benefits and early access to the event",
            price: "50.00",
            quantityAvailable: 25,
            quantitySold: 0,
            currency: "USD",
            saleStartsAt: "2025-01-01T00:00:00Z",
            saleEndsAt: "2025-09-01T00:00:00Z",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
            isPubliclyAvailable: true,
            maxPerPerson: 5,
            isActive: true,
            categoryDiscounts: {
              "EARLY_BIRD": {
                percent: 20,
                description: "Limited time 20% discount"
              }
            },
            isRefundable: true,
            refundPolicy: "Full refund available up to 7 days before event",
            transferable: true,
            ageRestriction: "NO_RESTRICTION",
            specialInstructions: null,
            status: "ACTIVE",
            validForDate: "2025-10-12"
          },
          {
            ticketTypeId: "regular",
            eventId: "ccec53d7-eb77-4c06-937b-3b20b801714c",
            name: "General Admission",
            description: "Standard event access with essential amenities and full event experience",
            price: "75.00",
            quantityAvailable: 150,
            quantitySold: 0,
            currency: "USD",
            saleStartsAt: "2025-01-15T00:00:00Z",
            saleEndsAt: "2025-10-10T00:00:00Z",
            createdAt: "2025-01-15T00:00:00Z",
            updatedAt: "2025-01-15T00:00:00Z",
            isPubliclyAvailable: true,
            maxPerPerson: 10,
            isActive: true,
            categoryDiscounts: null,
            isRefundable: true,
            refundPolicy: "Full refund available up to 3 days before event",
            transferable: true,
            ageRestriction: "NO_RESTRICTION",
            specialInstructions: null,
            status: "ACTIVE",
            validForDate: "2025-10-12"
          },
          {
            ticketTypeId: "vip",
            eventId: "ccec53d7-eb77-4c06-937b-3b20b801714c",
            name: "VIP Premium Experience",
            description: "Ultimate premium experience with exclusive perks, backstage access, and luxury amenities",
            price: "150.00",
            quantityAvailable: 10,
            quantitySold: 0,
            currency: "USD",
            saleStartsAt: "2025-01-01T00:00:00Z",
            saleEndsAt: "2025-10-11T00:00:00Z",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
            isPubliclyAvailable: true,
            maxPerPerson: 3,
            isActive: true,
            categoryDiscounts: {
              "VIP": {
                percent: 15,
                description: "Early VIP booking discount"
              }
            },
            isRefundable: true,
            refundPolicy: "Full refund available up to 14 days before event",
            transferable: true,
            ageRestriction: "18_PLUS",
            specialInstructions: "VIP check-in required 30 minutes before event",
            status: "ACTIVE",
            validForDate: "2025-10-12"
          }
        ]
        
        setEventData(mockEventData)
        setTicketTypes(mockTicketTypes)
        
      } catch (err) {
        console.error("Error initializing data:", err)
        setError("An error occurred while loading the event")
      } finally {
        setLoading(false)
      }
    }
    
    initializeData()
  }, [])

  // Pre-fill buyer info with first attendee if available
  useEffect(() => {
    if (registeredAttendees && registeredAttendees.length > 0) {
      setBuyerInfo({
        recipientEmail: registeredAttendees[0].email || "",
        attendeeNames: [registeredAttendees[0].firstName || "", registeredAttendees[0].lastName || ""],
      });
    }
  }, [registeredAttendees]);

  const handleTicketQuantityChange = (ticketId: string, quantity: number) => {
    const ticket = ticketTypes.find((t) => t.ticketTypeId === ticketId)
    if (!ticket) return

    const newQuantity = Math.max(0, Math.min(quantity, ticket.quantityAvailable, ticket.maxPerPerson))
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: newQuantity,
    }))

    // Update attendee names array based on total tickets
    const newTotalTickets = Object.values({ ...selectedTickets, [ticketId]: newQuantity }).reduce((sum, qty) => sum + qty, 0)
    setBuyerInfo(prev => ({
      ...prev,
      attendeeNames: Array.from({ length: newTotalTickets }, (_, i) => prev.attendeeNames[i] || '')
    }))
  }

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, quantity) => sum + quantity, 0)
  }

  const getTotalPrice = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
      const ticket = ticketTypes.find((t) => t.ticketTypeId === ticketId)
      return total + (ticket ? Number.parseFloat(ticket.price) * quantity : 0)
    }, 0)
  }

  // Helper function to get currency from selected tickets
  const getSelectedTicketCurrency = () => {
    const selectedTicketIds = Object.keys(selectedTickets).filter(id => selectedTickets[id] > 0)
    if (selectedTicketIds.length === 0) return "USD"
    
    const firstTicket = ticketTypes.find(t => t.ticketTypeId === selectedTicketIds[0])
    return firstTicket?.currency || "USD"
  }

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === "USD" ? "$" : currency === "RWF" ? "RWF " : currency
    return `${symbol}${amount.toFixed(2)}`
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (getTotalTickets() === 0) {
          newErrors.tickets = "Please select at least one ticket"
        }
        break
      case 2:
        if (!buyerInfo.recipientEmail.trim()) newErrors.recipientEmail = "Recipient email is required"
        else if (!/\S+@\S+\.\S+/.test(buyerInfo.recipientEmail)) newErrors.recipientEmail = "Please enter a valid recipient email"
        
        // Validate attendee names
        const totalTickets = getTotalTickets()
        if (totalTickets > 0) {
          if (!buyerInfo.attendeeNames || buyerInfo.attendeeNames.length !== totalTickets) {
            newErrors.attendeeNames = `Please provide ${totalTickets} attendee name${totalTickets > 1 ? 's' : ''}`
          } else {
            buyerInfo.attendeeNames.forEach((name, index) => {
              if (!name.trim()) {
                newErrors[`attendeeName${index}`] = `Attendee ${index + 1} name is required`
              }
            })
          }
        }
        break
      case 3:
        if (!paymentMethod) newErrors.paymentMethod = "Please select a payment method"
        if (paymentMethod === "card") {
          if (!cardDetails.cardNumber.trim()) newErrors.cardNumber = "Card number is required"
          if (!cardDetails.expiryDate.trim()) newErrors.expiryDate = "Expiry date is required"
          if (!cardDetails.cvv.trim()) newErrors.cvv = "CVV is required"
          if (!cardDetails.cardholderName.trim()) newErrors.cardholderName = "Cardholder name is required"
        }
        if (paymentMethod === "mobile") {
          if (mobileMoneyAmount <= 0) newErrors.mobileMoneyAmount = "Please enter the amount to be paid"
          else if (mobileMoneyAmount < getTotalPrice()) {
            newErrors.mobileMoneyAmount = `Amount must be at least ${formatCurrency(getTotalPrice(), getSelectedTicketCurrency())}`
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

  const handlePurchase = async () => {
    if (!validateStep(3)) return

    setProcessing(true)

    try {
      // Create ticketsToPurchase array with ticketTypeId, attendeeName, and selectedDate
      const ticketsToPurchase = Object.entries(selectedTickets)
        .filter(([_, quantity]) => quantity > 0)
        .flatMap(([ticketId, quantity]) => {
          const ticket = ticketTypes.find((t) => t.ticketTypeId === ticketId)
          if (!ticket) return []
          
          // Get attendee names for this ticket type
          const startIndex = Object.entries(selectedTickets)
            .filter(([id, qty]) => id < ticketId && qty > 0)
            .reduce((sum, [_, qty]) => sum + qty, 0)
          
          return Array.from({ length: quantity }, (_, index) => ({
            ticketTypeId: ticketId,
            attendeeName: buyerInfo.attendeeNames[startIndex + index] || `Attendee ${startIndex + index + 1}`,
            selectedDate: ticket.validForDate // Use the validForDate as selectedDate
          }))
        })

      const purchaseData = {
        recipientEmail: buyerInfo.recipientEmail,
        ticketsToPurchase,
        paymentDetails: {
          amountPaid: paymentMethod === "mobile" ? mobileMoneyAmount : getTotalPrice(),
          paymentMethod: paymentMethod === "mobile" ? "MOBILE_MONEY" : 
                         paymentMethod === "card" ? "CARD" : 
                         paymentMethod === "bank" ? "BANK_TRANSFER" : "CASH"
        }
      }

      console.log("Processing purchase:", purchaseData)

      // Call the actual API
      const response = await ApiService.purchaseEventTicket(purchaseData)
      
      if (response.success) {
        toast.success("Tickets purchased successfully!, check your email to see your ticket")
        setSuccess(true)
      } else {
        throw new Error(response.message || "Failed to purchase tickets")
      }
    } catch (err: any) {
      console.error("Purchase error:", err)
      const errorMessage = err?.response?.data?.message || err?.message || "Purchase failed. Please try again."
      toast.error(errorMessage)
      setError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleAttendeeNameChange = (index: number, name: string) => {
    setBuyerInfo(prev => ({
      ...prev,
      attendeeNames: prev.attendeeNames.map((n, i) => i === index ? name : n)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading ticket information...</p>
        </div>
      </div>
    )
  }

  if (error && !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Event Not Found</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="text-gray-600">
              You have successfully purchased {getTotalTickets()} ticket{getTotalTickets() > 1 ? "s" : ""} for{" "}
              {eventData?.eventName}.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-blue-600">${getTotalPrice()}</p>
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => window.history.back()}>
                Back to Event
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Download Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Select Your Tickets</h2>
              <p className="text-gray-600">Choose the ticket type and quantity</p>
            </div>

            <div className="space-y-4">
              {loading ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6 text-center">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-600">Loading available tickets...</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Discount Information Banner */}
                  {ticketTypes.some(ticket => ticket.categoryDiscounts && Object.keys(ticket.categoryDiscounts).length > 0) && (
                    <Card className="border-2 border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-800">Special Discounts Available!</h3>
                        </div>
                        <div className="text-sm text-blue-700">
                          <p>This event offers special discounts for certain categories. Check each ticket type for available discounts.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {ticketTypes
                    .filter(ticket => ticket.isActive && ticket.isPubliclyAvailable)
                    .map((ticket) => (
                      <Card key={ticket.ticketTypeId} className="border-2 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{ticket.name}</h3>
                                {ticket.isPubliclyAvailable && <Badge className="bg-blue-500">Available</Badge>}
                                {!ticket.isPubliclyAvailable && <Badge className="bg-red-500">Sold Out</Badge>}
                        </div>
                        <p className="text-gray-600 mb-3">{ticket.description}</p>
                        <div className="space-y-1">
                                {ticket.specialInstructions && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                    <span>{ticket.specialInstructions}</span>
                                  </div>
                                )}
                                {ticket.categoryDiscounts && Object.keys(ticket.categoryDiscounts).length > 0 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                      <Star className="h-3 w-3" />
                                      <span className="font-medium">Category Discounts Available:</span>
                                    </div>
                                    {Object.entries(ticket.categoryDiscounts).map(([category, discount]) => (
                                      <div key={category} className="ml-5 flex items-center gap-2 text-sm">
                                        <Badge variant="outline" className="text-xs bg-green-50 text-blue-700 border-blue-200">
                                          {discount.percent}% off
                                        </Badge>
                                        <span className="text-gray-600">
                                          {category.replace(/_/g, " ")} - {discount.description}
                                        </span>
                            </div>
                          ))}
                                  </div>
                                )}
                                {ticket.isRefundable && (
                                  <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <Check className="h-3 w-3" />
                                    <span>Refundable</span>
                                  </div>
                                )}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                <span>Available: {ticket.quantityAvailable}</span>
                                <span>Max per person: {ticket.maxPerPerson}</span>
                        </div>
                              
                              {/* Additional Ticket Details */}
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Tickets Sold:</span>
                                    <span className="font-medium">{ticket.quantitySold}</span>
                      </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Age Restriction:</span>
                                    <span className="font-medium">{ticket.ageRestriction.replace(/_/g, " ")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Valid For Date:</span>
                                    <span className="font-medium">
                                      {ticket.validForDate ? new Date(ticket.validForDate).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      }) : 'Not specified'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Sale Period:</span>
                                    <span className="font-medium text-xs">
                                      {new Date(ticket.saleStartsAt).toLocaleDateString()} - {new Date(ticket.saleEndsAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Sale Period Details */}
                                <div className="border-t pt-2 mt-2">
                                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className="font-medium">Sale Period Details:</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                        <div>
                                      <span className="text-gray-500">Starts:</span>
                                      <span className="ml-1 font-medium">
                                        {new Date(ticket.saleStartsAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                        </div>
                                    <div>
                                      <span className="text-gray-500">Ends:</span>
                                      <span className="ml-1 font-medium">
                                        {new Date(ticket.saleEndsAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {ticket.currency === "USD" ? "$" : ticket.currency === "RWF" ? "RWF " : ticket.currency}
                                {Number.parseFloat(ticket.price).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">per ticket</div>
                              <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                                  onClick={() => handleTicketQuantityChange(ticket.ticketTypeId, (selectedTickets[ticket.ticketTypeId] || 0) - 1)}
                                  disabled={!selectedTickets[ticket.ticketTypeId]}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                                <span className="w-8 text-center font-medium">{selectedTickets[ticket.ticketTypeId] || 0}</span>
                          <Button
                            variant="outline"
                            size="sm"
                                  onClick={() => handleTicketQuantityChange(ticket.ticketTypeId, (selectedTickets[ticket.ticketTypeId] || 0) + 1)}
                            disabled={
                                    (selectedTickets[ticket.ticketTypeId] || 0) >= ticket.maxPerPerson ||
                                    (selectedTickets[ticket.ticketTypeId] || 0) >= ticket.quantityAvailable
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

                    {ticketTypes.filter(ticket => ticket.isActive && ticket.isPubliclyAvailable).length === 0 && (
                      <Card className="border-2 border-gray-200">
                        <CardContent className="p-6 text-center">
                          <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tickets Available</h3>
                          <p className="text-gray-600">
                            There are currently no tickets available for this event. Please check back later or contact the event organizer.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
            </div>

            {errors.tickets && <p className="text-sm text-red-500 text-center">{errors.tickets}</p>}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Attendee Information</h2>
              <p className="text-gray-600">Provide attendee names and recipient email for tickets</p>
            </div>

            {/* Recipient Email */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Recipient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Ticket Delivery</h4>
                  <p className="text-sm text-blue-800">
                    All tickets will be sent to the email address you provide below.
                  </p>
                </div>

                  <div>
                  <Label htmlFor="recipientEmail">Recipient Email *</Label>
                    <Input
                    id="recipientEmail"
                      type="email"
                    value={buyerInfo.recipientEmail}
                    onChange={(e) => setBuyerInfo((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                    placeholder="Email where tickets will be sent"
                    className={`mt-1 ${errors.recipientEmail ? "border-red-500" : ""}`}
                  />
                  {errors.recipientEmail && <p className="text-sm text-red-500 mt-1">{errors.recipientEmail}</p>}
                  <p className="text-xs text-gray-500 mt-1">All tickets will be sent to this email address</p>
                  </div>

                  <div>
                  <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                  <Textarea
                    id="specialRequests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attendee Names */}
            {getTotalTickets() > 0 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Attendee Names</span>
                    <Badge variant="outline">{getTotalTickets()} attendee{getTotalTickets() > 1 ? 's' : ''}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Provide Attendee Names</h4>
                      <p className="text-sm text-blue-800">
                      Please provide the full name for each person who will attend the event. These names will be printed on the tickets.
                      </p>
                    </div>

                  {buyerInfo.attendeeNames.map((name, index) => (
                    <div key={index}>
                      <Label htmlFor={`attendeeName${index}`}>Attendee {index + 1} Full Name *</Label>
                      <Input
                        id={`attendeeName${index}`}
                        value={name}
                        onChange={(e) => handleAttendeeNameChange(index, e.target.value)}
                        placeholder={`Enter full name for attendee ${index + 1}`}
                        className={`mt-1 ${errors[`attendeeName${index}`] ? "border-red-500" : ""}`}
                      />
                      {errors[`attendeeName${index}`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`attendeeName${index}`]}</p>
                      )}
                </div>
                  ))}

                  {errors.attendeeNames && (
                    <p className="text-sm text-red-500">{errors.attendeeNames}</p>
                  )}
              </CardContent>
            </Card>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
              <p className="text-gray-600">Choose how you'd like to pay</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Select Payment Method *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  {paymentMethods.map((method) => (
                    <Card
                      key={method.id}
                      className={`cursor-pointer border-2 transition-colors ${
                        paymentMethod === method.id ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{method.icon}</div>
                        <div className="font-medium">{method.name}</div>
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

              {paymentMethod === "mobile" && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">📱</span>
                      Mobile Money Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Mobile Money Payment</h4>
                      <p className="text-sm text-blue-800">
                      You will receive a prompt on your mobile device to complete the payment.
                    </p>
                    </div>

                    <div>
                      <Label htmlFor="mobileMoneyAmount">Amount to Pay *</Label>
                      <Input
                        id="mobileMoneyAmount"
                        type="number"
                        min={getTotalPrice()}
                        step="0.01"
                        value={mobileMoneyAmount}
                        onChange={(e) => setMobileMoneyAmount(Number.parseFloat(e.target.value) || 0)}
                        placeholder={`Enter amount (minimum ${formatCurrency(getTotalPrice(), getSelectedTicketCurrency())})`}
                        className={`mt-1 ${errors.mobileMoneyAmount ? "border-red-500" : ""}`}
                      />
                      {errors.mobileMoneyAmount && (
                        <p className="text-sm text-red-500 mt-1">{errors.mobileMoneyAmount}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Total ticket cost: {formatCurrency(getTotalPrice(), getSelectedTicketCurrency())}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {paymentMethod === "bank" && (
                <Card className="border-2">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">🏦</div>
                    <h3 className="font-semibold mb-2">Bank Transfer</h3>
                    <p className="text-gray-600 text-sm">
                      Bank details will be provided after you proceed with this payment method.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header activePage="events" />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Back to Register Button */}
          <div className="mb-4 flex justify-start">
            <Link href={`/events/${eventId}/register`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                &larr; Back to Registration
              </Button>
            </Link>
          </div>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Tickets</h1>
            <p className="text-gray-600">Secure your spot at this amazing event</p>
          </div>

          {/* Event Summary */}
          {eventData && (
            <Card className="mb-8 border-2">
              <CardContent className="p-0">
                <div className="relative h-32 md:h-48">
                  <Image
                    src={eventData.eventPhoto || "/placeholder.svg?height=200&width=800&query=event banner"}
                    alt={eventData.eventName}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-t-lg" />
                  <div className="absolute inset-0 flex items-end p-4">
                    <div className="text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl md:text-2xl font-bold">{eventData.eventName}</h2>
                        {eventData.isFeatured && <Star className="h-5 w-5 text-yellow-400" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(eventData.bookingDates[0].date).toLocaleDateString()}</span>
                        </div>
                        {eventData.eventVenues && eventData.eventVenues[0]?.venue && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{eventData.eventVenues[0].venue.venueName}</span>
                          </div>
                        )}
                        <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                          {eventData.eventType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {[
                { step: 1, title: "Select Tickets", icon: Ticket },
                { step: 2, title: "Your Details", icon: Users },
                { step: 3, title: "Payment", icon: CreditCard },
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step === currentStep
                        ? "bg-blue-600 border-blue-600 text-white"
                        : step < currentStep
                          ? "bg-blue-600 border-blue-600 text-white"
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
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="bg-transparent">
                  Previous
                </Button>

                {currentStep < 3 ? (
                  <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                    Next
                  </Button>
                ) : (
                  <Button onClick={handlePurchase} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Complete Purchase
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(selectedTickets)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([ticketId, quantity]) => {
                      const ticket = ticketTypes.find((t) => t.ticketTypeId === ticketId)
                      if (!ticket) return null

                      return (
                        <div key={ticketId} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{ticket.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(Number.parseFloat(ticket.price), ticket.currency)} × {quantity}
                            </div>
                            {ticket.categoryDiscounts && Object.keys(ticket.categoryDiscounts).length > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                <span className="font-medium">Discounts: </span>
                                {Object.entries(ticket.categoryDiscounts).map(([category, discount], index) => (
                                  <span key={category}>
                                    {index > 0 && ", "}
                                    {category.replace(/_/g, " ")} ({discount.percent}% off)
                                  </span>
                                ))}
                          </div>
                            )}
                          </div>
                          <div className="font-semibold">
                            {formatCurrency(Number.parseFloat(ticket.price) * quantity, ticket.currency)}
                          </div>
                        </div>
                      )
                    })}

                  {getTotalTickets() > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <span className="text-lg font-medium">Total Amount:</span>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(getTotalPrice(), getSelectedTicketCurrency())}
                        </p>
                      </div>
                    </>
                  )}

                  {getTotalTickets() > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="font-medium text-sm">Attendee Information</div>
                          <div className="text-sm text-gray-600">
                            <div className="flex justify-between">
                            <span>Recipient Email:</span>
                            <span className="text-blue-600">{buyerInfo.recipientEmail || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between">
                            <span>Total Attendees:</span>
                            <span>{getTotalTickets()}</span>
                            </div>
                          {buyerInfo.attendeeNames.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Attendee Names:</span>
                              <div className="text-xs text-gray-600 mt-1">
                                {buyerInfo.attendeeNames.map((name, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span>Attendee {index + 1}:</span>
                                    <span>{name || "Not provided"}</span>
                                  </div>
                                ))}
                              </div>
                              </div>
                            )}
                          </div>
                      </div>
                    </>
                  )}

                  {getTotalTickets() > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="font-medium text-sm">Payment Information</div>
                          <div className="text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Method:</span>
                            <span className="capitalize">{paymentMethod || "Not selected"}</span>
                            </div>
                          {paymentMethod === "mobile" && mobileMoneyAmount > 0 && (
                            <div className="flex justify-between">
                              <span>Amount to Pay:</span>
                              <span className="font-medium text-blue-600">
                                {formatCurrency(mobileMoneyAmount, getSelectedTicketCurrency())}
                              </span>
                          </div>
                        )}
                          <div className="flex justify-between">
                            <span>Total Cost:</span>
                            <span className="font-medium">
                              {formatCurrency(getTotalPrice(), getSelectedTicketCurrency())}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Tickets:</span>
                      <span>{getTotalTickets()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>Tickets reserved for 15 minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Secure Payment</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
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


