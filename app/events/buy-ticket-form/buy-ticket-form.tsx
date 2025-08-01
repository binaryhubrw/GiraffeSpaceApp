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
  Percent,
  Utensils,
  Gift,
  Car,
} from "lucide-react"
import Image from "next/image"
// Removed API import since we're using mock data
import { Switch } from "@/components/ui/switch"

interface EventData {
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
  id: string
  name: string
  description: string
  price: number
  currency: string
  maxQuantity: number
  availableQuantity: number
  category: string
  accessLevel: string
  eventDate: string
  startTime: string
  endTime: string
  saleStartDate: string
  saleEndDate: string
  isActive: boolean
  benefits: Array<{
    id: string
    category: string
    title: string
    description: string
    icon: string
  }>
  includedGuests: Array<{
    id: string
    name: string
    role: string
    description: string
    image?: string
  }>
  includedMeals: string[]
  merchandiseIncluded: string[]
  exclusiveAreas: string[]
  parkingIncluded: boolean
  meetAndGreet: boolean
  priorityAccess: boolean
  complimentaryDrinks: number
  giftBag: boolean
  certificateIncluded: boolean
  isRefundable: boolean
  transferable: boolean
  requiresApproval: boolean
  ageRestriction: string
  discountTiers: Array<{
    id: string
    name: string
    percentage: number
    startDate: string
    endDate: string
    description: string
  }>
}

interface PaymentMethod {
  id: string
  type: "card" | "mobile" | "bank"
  name: string
  icon: string
}

interface BuyerInfo {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  organization?: string
}

interface BuyTicketProps {
  // No props needed since we're using mock data
}

// Mock ticket types with comprehensive data from create-ticket-form

// Mock event data
const mockEventData: EventData = {
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
    id: "early-bird",
    name: "Early Bird Special",
    description: "Limited time offer with exclusive benefits and early access to the event",
    price: 50,
    currency: "USD",
    maxQuantity: 5,
    availableQuantity: 25,
    category: "EARLY_BIRD",
    accessLevel: "GENERAL",
    eventDate: "2025-10-12",
    startTime: "09:00",
    endTime: "17:00",
    saleStartDate: "2025-01-01",
    saleEndDate: "2025-09-01",
    isActive: true,
    benefits: [
      { id: "1", category: "access", title: "Priority Entry", description: "Skip the regular queue", icon: "star" },
      {
        id: "2",
        category: "networking",
        title: "Welcome Reception",
        description: "Exclusive networking session",
        icon: "users",
      },
    ],
    includedGuests: [
      {
        id: "1",
        name: "DJ Neptunes",
        role: "Main DJ",
        description: "International DJ with 10+ years experience",
        image: "/placeholder.svg?height=100&width=100",
      },
    ],
    includedMeals: ["Welcome Cocktail", "Networking Lunch"],
    merchandiseIncluded: ["Event T-Shirt", "Branded Tote Bag"],
    exclusiveAreas: ["VIP Lounge"],
    parkingIncluded: true,
    meetAndGreet: false,
    priorityAccess: true,
    complimentaryDrinks: 2,
    giftBag: true,
    certificateIncluded: true,
    isRefundable: true,
    transferable: true,
    requiresApproval: false,
    ageRestriction: "NO_RESTRICTION",
    discountTiers: [
      {
        id: "early-1",
        name: "Super Early Bird",
        percentage: 20,
        startDate: "2025-01-01",
        endDate: "2025-03-01",
        description: "Limited time 20% discount",
      },
    ],
  },
  {
    id: "regular",
    name: "General Admission",
    description: "Standard event access with essential amenities and full event experience",
    price: 75,
    currency: "USD",
    maxQuantity: 10,
    availableQuantity: 150,
    category: "GENERAL_ADMISSION",
    accessLevel: "GENERAL",
    eventDate: "2025-10-12",
    startTime: "10:00",
    endTime: "17:00",
    saleStartDate: "2025-01-15",
    saleEndDate: "2025-10-10",
    isActive: true,
    benefits: [
      {
        id: "3",
        category: "access",
        title: "Full Event Access",
        description: "Access to all general areas",
        icon: "ticket",
      },
      { id: "4", category: "food", title: "Lunch Included", description: "Complimentary lunch", icon: "utensils" },
    ],
    includedGuests: [
      {
        id: "2",
        name: "Sarah Johnson",
        role: "Live Performer",
        description: "Award-winning vocalist and performer",
        image: "/placeholder.svg?height=100&width=100",
      },
    ],
    includedMeals: ["Lunch"],
    merchandiseIncluded: ["Event Program"],
    exclusiveAreas: [],
    parkingIncluded: false,
    meetAndGreet: false,
    priorityAccess: false,
    complimentaryDrinks: 1,
    giftBag: false,
    certificateIncluded: true,
    isRefundable: true,
    transferable: true,
    requiresApproval: false,
    ageRestriction: "NO_RESTRICTION",
    discountTiers: [],
  },
  {
    id: "vip",
    name: "VIP Premium Experience",
    description: "Ultimate premium experience with exclusive perks, backstage access, and luxury amenities",
    price: 150,
    currency: "USD",
    maxQuantity: 3,
    availableQuantity: 10,
    category: "VIP",
    accessLevel: "VIP",
    eventDate: "2025-10-12",
    startTime: "08:00",
    endTime: "18:00",
    saleStartDate: "2025-01-01",
    saleEndDate: "2025-10-11",
    isActive: true,
    benefits: [
      { id: "5", category: "access", title: "Backstage Access", description: "Exclusive backstage tour", icon: "star" },
      {
        id: "6",
        category: "entertainment",
        title: "Meet & Greet",
        description: "Personal meet with performers",
        icon: "users",
      },
      { id: "7", category: "food", title: "Premium Dining", description: "Gourmet meal experience", icon: "utensils" },
      {
        id: "8",
        category: "services",
        title: "Concierge Service",
        description: "Personal event concierge",
        icon: "star",
      },
    ],
    includedGuests: [
      {
        id: "1",
        name: "DJ Neptunes",
        role: "Main DJ",
        description: "International DJ with 10+ years experience",
        image: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "2",
        name: "Sarah Johnson",
        role: "Live Performer",
        description: "Award-winning vocalist and performer",
        image: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "3",
        name: "Chef Marcus",
        role: "Celebrity Chef",
        description: "Michelin star chef providing exclusive dining",
        image: "/placeholder.svg?height=100&width=100",
      },
    ],
    includedMeals: ["Welcome Cocktail", "Gala Dinner", "VIP Reception"],
    merchandiseIncluded: [
      "Event T-Shirt",
      "Branded Tote Bag",
      "Photo Book",
      "Commemorative Pin",
      "USB Drive with Content",
    ],
    exclusiveAreas: ["VIP Lounge", "Backstage Area", "Executive Suite", "Private Bar"],
    parkingIncluded: true,
    meetAndGreet: true,
    priorityAccess: true,
    complimentaryDrinks: 5,
    giftBag: true,
    certificateIncluded: true,
    isRefundable: true,
    transferable: true,
    requiresApproval: false,
    ageRestriction: "18_PLUS",
    discountTiers: [
      {
        id: "vip-1",
        name: "VIP Early Access",
        percentage: 15,
        startDate: "2025-01-01",
        endDate: "2025-02-15",
        description: "Early VIP booking discount",
      },
    ],
  },
]

const paymentMethods: PaymentMethod[] = [
  { id: "card", type: "card", name: "Credit/Debit Card", icon: "💳" },
  { id: "mobile", type: "mobile", name: "Mobile Money", icon: "📱" },
  { id: "bank", type: "bank", name: "Bank Transfer", icon: "🏦" },
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

// Mock registered attendees for this event
const mockRegisteredAttendees = [
  {
    id: "reg-1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    registrationType: "self",
    registrationDate: "2024-01-15",
  },
  {
    id: "reg-2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    registrationType: "group",
    registrationDate: "2024-01-16",
  },
  {
    id: "reg-3",
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike.johnson@example.com",
    registrationType: "group",
    registrationDate: "2024-01-17",
  },
]

export default function BuyTicketForm() {
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Tickets, 2: Details, 3: Payment

  // Form state
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: mockLoggedInUser.firstName,
    lastName: mockLoggedInUser.lastName,
    email: mockLoggedInUser.email,
    phoneNumber: mockLoggedInUser.phoneNumber,
    organization: mockLoggedInUser.organization,
  })
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })
  const [specialRequests, setSpecialRequests] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [assignToRegistered, setAssignToRegistered] = useState(false)
  const [registeredAttendees, setRegisteredAttendees] = useState<any[]>([])
  const [ticketAssignments, setTicketAssignments] = useState<Record<string, string>>({})

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        // Simulate a brief loading time
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        // Use mock data directly instead of API call
        setEventData(mockEventData)
      } catch (err) {
        setError("An error occurred while loading the event")
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    // Load registered attendees for this event
    setRegisteredAttendees(mockRegisteredAttendees)
  }, [])

  const handleTicketQuantityChange = (ticketId: string, quantity: number) => {
    const ticket = mockTicketTypes.find((t) => t.id === ticketId)
    if (!ticket) return

    const newQuantity = Math.max(0, Math.min(quantity, ticket.maxQuantity, ticket.availableQuantity))
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: newQuantity,
    }))
  }

  const handleTicketAssignment = (ticketIndex: string, attendeeId: string) => {
    setTicketAssignments((prev) => ({
      ...prev,
      [ticketIndex]: attendeeId,
    }))
  }

  const getUnassignedTickets = () => {
    const totalTickets = getTotalTickets()
    const assignedTickets = Object.keys(ticketAssignments).length
    return totalTickets - assignedTickets
  }

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, quantity) => sum + quantity, 0)
  }

  const getTotalPrice = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
      const ticket = mockTicketTypes.find((t) => t.id === ticketId)
      if (!ticket) return total

      // Apply discount if available
      let price = ticket.price
      if (ticket.discountTiers.length > 0) {
        const activeDiscount = ticket.discountTiers[0] // Use first discount for simplicity
        price = ticket.price * (1 - activeDiscount.percentage / 100)
      }

      return total + price * quantity
    }, 0)
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
        if (!buyerInfo.firstName.trim()) newErrors.firstName = "First name is required"
        if (!buyerInfo.lastName.trim()) newErrors.lastName = "Last name is required"
        if (!buyerInfo.email.trim()) newErrors.email = "Email is required"
        else if (!/\S+@\S+\.\S+/.test(buyerInfo.email)) newErrors.email = "Please enter a valid email"
        if (!buyerInfo.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required"

        // Validate ticket assignments if assigning to registered attendees
        if (assignToRegistered && getUnassignedTickets() > 0) {
          newErrors.ticketAssignments = "Please assign all tickets to registered attendees"
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
      const purchaseData = {
        eventId: mockEventData.eventId,
        buyerId: mockLoggedInUser.userId,
        tickets: Object.entries(selectedTickets)
          .filter(([_, quantity]) => quantity > 0)
          .map(([ticketId, quantity]) => ({
            ticketTypeId: ticketId,
            quantity,
            price: mockTicketTypes.find((t) => t.id === ticketId)?.price || 0,
          })),
        buyerInfo,
        paymentMethod,
        paymentDetails: paymentMethod === "card" ? cardDetails : {},
        specialRequests,
        totalAmount: getTotalPrice(),
        assignmentMethod: assignToRegistered ? "registered" : "new_profiles",
        ticketAssignments: assignToRegistered ? ticketAssignments : {},
        registeredAttendees: assignToRegistered
          ? registeredAttendees.filter((a) => Object.values(ticketAssignments).includes(a.id))
          : [],
      }

      console.log("Processing purchase:", purchaseData)

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setSuccess(true)
    } catch (err) {
      setError("Payment failed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
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
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="text-gray-600">
              You have successfully purchased {getTotalTickets()} ticket{getTotalTickets() > 1 ? "s" : ""} for{" "}
              {eventData?.eventName}.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">${getTotalPrice()}</p>
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
              {mockTicketTypes.map((ticket) => (
                <Card key={ticket.id} className="border-2 hover:border-green-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{ticket.name}</h3>
                          <Badge variant="outline">{ticket.category.replace(/_/g, " ")}</Badge>
                          <Badge variant="outline">{ticket.accessLevel}</Badge>
                          {ticket.category === "EARLY_BIRD" && <Badge className="bg-orange-500">Limited Time</Badge>}
                          {ticket.category === "VIP" && <Badge className="bg-purple-500">Premium</Badge>}
                        </div>
                        <p className="text-gray-600 mb-3">{ticket.description}</p>

                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Event Date:</span>
                              <span className="font-medium">{new Date(ticket.eventDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Time:</span>
                              <span className="font-medium">
                                {ticket.startTime} - {ticket.endTime}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Age Restriction:</span>
                              <span className="font-medium">{ticket.ageRestriction.replace(/_/g, " ")}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Available:</span>
                              <span className="font-medium">{ticket.availableQuantity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Max per person:</span>
                              <span className="font-medium">{ticket.maxQuantity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Refundable:</span>
                              <span className="font-medium">{ticket.isRefundable ? "Yes" : "No"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Discount Tiers */}
                        {ticket.discountTiers.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Percent className="h-3 w-3 text-orange-500" />
                              Active Discounts:
                            </h4>
                            <div className="space-y-1">
                              {ticket.discountTiers.map((discount) => (
                                <div
                                  key={discount.id}
                                  className="flex items-center justify-between p-2 bg-orange-50 rounded text-xs"
                                >
                                  <div>
                                    <span className="font-medium text-orange-700">{discount.name}</span>
                                    <span className="text-orange-600 ml-2">({discount.percentage}% OFF)</span>
                                  </div>
                                  <div className="text-orange-600 font-medium">
                                    ${(ticket.price * (1 - discount.percentage / 100)).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Included Guests */}
                        {ticket.includedGuests.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Users className="h-3 w-3 text-blue-500" />
                              Included Guests & Entertainers:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {ticket.includedGuests.map((guest) => (
                                <div key={guest.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-xs">
                                  <Image
                                    src={guest.image || "/placeholder.svg?height=30&width=30&query=person"}
                                    alt={guest.name}
                                    width={30}
                                    height={30}
                                    className="rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="font-medium text-blue-700">{guest.name}</div>
                                    <div className="text-blue-600">{guest.role}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Benefits Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {/* Meals */}
                          {ticket.includedMeals.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Utensils className="h-3 w-3 text-green-500" />
                                Included Meals:
                              </h4>
                              <ul className="space-y-1">
                                {ticket.includedMeals.map((meal) => (
                                  <li key={meal} className="flex items-center gap-2 text-xs">
                                    <Check className="h-2 w-2 text-green-500" />
                                    <span>{meal}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Merchandise */}
                          {ticket.merchandiseIncluded.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Gift className="h-3 w-3 text-purple-500" />
                                Included Merchandise:
                              </h4>
                              <ul className="space-y-1">
                                {ticket.merchandiseIncluded.slice(0, 3).map((item) => (
                                  <li key={item} className="flex items-center gap-2 text-xs">
                                    <Check className="h-2 w-2 text-purple-500" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                                {ticket.merchandiseIncluded.length > 3 && (
                                  <li className="text-xs text-gray-500">
                                    +{ticket.merchandiseIncluded.length - 3} more items
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Exclusive Areas */}
                        {ticket.exclusiveAreas.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Star className="h-3 w-3 text-yellow-500" />
                              Exclusive Area Access:
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {ticket.exclusiveAreas.map((area) => (
                                <Badge key={area} variant="outline" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Benefits */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                          {ticket.parkingIncluded && (
                            <div className="flex items-center gap-1 text-xs p-1 bg-green-50 rounded">
                              <Car className="h-2 w-2 text-green-500" />
                              <span>Free Parking</span>
                            </div>
                          )}
                          {ticket.meetAndGreet && (
                            <div className="flex items-center gap-1 text-xs p-1 bg-green-50 rounded">
                              <Users className="h-2 w-2 text-green-500" />
                              <span>Meet & Greet</span>
                            </div>
                          )}
                          {ticket.priorityAccess && (
                            <div className="flex items-center gap-1 text-xs p-1 bg-green-50 rounded">
                              <Star className="h-2 w-2 text-green-500" />
                              <span>Priority Access</span>
                            </div>
                          )}
                          {ticket.giftBag && (
                            <div className="flex items-center gap-1 text-xs p-1 bg-green-50 rounded">
                              <Gift className="h-2 w-2 text-green-500" />
                              <span>Gift Bag</span>
                            </div>
                          )}
                          {ticket.certificateIncluded && (
                            <div className="flex items-center gap-1 text-xs p-1 bg-green-50 rounded">
                              <Check className="h-2 w-2 text-green-500" />
                              <span>Certificate</span>
                            </div>
                          )}
                          {ticket.complimentaryDrinks > 0 && (
                            <div className="flex items-center gap-1 text-xs p-1 bg-green-50 rounded">
                              <Utensils className="h-2 w-2 text-green-500" />
                              <span>{ticket.complimentaryDrinks} Free Drinks</span>
                            </div>
                          )}
                        </div>

                        {/* Custom Benefits */}
                        {ticket.benefits.length > 0 && (
                          <div className="mb-3">
                            <h4 className="font-medium text-sm mb-2">Additional Benefits:</h4>
                            <div className="space-y-1">
                              {ticket.benefits.map((benefit) => (
                                <div key={benefit.id} className="flex items-center gap-2 text-xs">
                                  <Check className="h-2 w-2 text-green-500" />
                                  <span className="font-medium">{benefit.title}</span>
                                  {benefit.description && (
                                    <span className="text-gray-600">- {benefit.description}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-right space-y-3 ml-4">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            $
                            {ticket.discountTiers.length > 0
                              ? (ticket.price * (1 - ticket.discountTiers[0].percentage / 100)).toFixed(2)
                              : ticket.price}
                          </div>
                          {ticket.discountTiers.length > 0 && (
                            <div className="text-sm text-gray-500 line-through">${ticket.price}</div>
                          )}
                          <div className="text-sm text-gray-500">per ticket</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTicketQuantityChange(ticket.id, (selectedTickets[ticket.id] || 0) - 1)}
                            disabled={!selectedTickets[ticket.id]}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{selectedTickets[ticket.id] || 0}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTicketQuantityChange(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                            disabled={
                              (selectedTickets[ticket.id] || 0) >= ticket.maxQuantity ||
                              (selectedTickets[ticket.id] || 0) >= ticket.availableQuantity
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
            </div>

            {errors.tickets && <p className="text-sm text-red-500 text-center">{errors.tickets}</p>}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Buyer & Ticket Assignment</h2>
              <p className="text-gray-600">Provide buyer details and assign tickets to attendees</p>
            </div>

            {/* Buyer Information */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Buyer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarFallback>
                        {mockLoggedInUser.firstName[0]}
                        {mockLoggedInUser.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-blue-900">
                        {mockLoggedInUser.firstName} {mockLoggedInUser.lastName}
                      </h4>
                      <p className="text-sm text-blue-700">{mockLoggedInUser.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-800">
                    Purchasing tickets as the buyer. You can edit your information below.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={buyerInfo.firstName}
                      onChange={(e) => setBuyerInfo((prev) => ({ ...prev, firstName: e.target.value }))}
                      className={`mt-1 ${errors.firstName ? "border-red-500" : ""}`}
                    />
                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={buyerInfo.lastName}
                      onChange={(e) => setBuyerInfo((prev) => ({ ...prev, lastName: e.target.value }))}
                      className={`mt-1 ${errors.lastName ? "border-red-500" : ""}`}
                    />
                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={buyerInfo.email}
                      onChange={(e) => setBuyerInfo((prev) => ({ ...prev, email: e.target.value }))}
                      className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={buyerInfo.phoneNumber}
                      onChange={(e) => setBuyerInfo((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      className={`mt-1 ${errors.phoneNumber ? "border-red-500" : ""}`}
                    />
                    {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="organization">Organization (Optional)</Label>
                  <Input
                    id="organization"
                    value={buyerInfo.organization}
                    onChange={(e) => setBuyerInfo((prev) => ({ ...prev, organization: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ticket Assignment */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Assign Tickets to Attendees</span>
                  <Badge variant="outline">{getTotalTickets()} tickets to assign</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Assignment Method</Label>
                    <p className="text-sm text-gray-600">
                      {assignToRegistered ? "Assign to registered attendees" : "Create new attendee profiles"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm ${assignToRegistered ? "text-gray-500" : "font-medium"}`}>
                      New Profiles
                    </span>
                    <Switch checked={assignToRegistered} onCheckedChange={setAssignToRegistered} />
                    <span className={`text-sm ${!assignToRegistered ? "text-gray-500" : "font-medium"}`}>
                      Registered
                    </span>
                  </div>
                </div>

                {assignToRegistered ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Registered Attendees Available</h4>
                      <p className="text-sm text-green-800">
                        {registeredAttendees.length} attendees are registered for this event. Assign your{" "}
                        {getTotalTickets()} tickets to them.
                      </p>
                    </div>

                    {/* Generate ticket assignment rows based on purchased tickets */}
                    {Object.entries(selectedTickets)
                      .filter(([_, quantity]) => quantity > 0)
                      .flatMap(([ticketId, quantity]) => {
                        const ticket = mockTicketTypes.find((t) => t.id === ticketId)
                        return Array.from({ length: quantity }, (_, index) => ({
                          ticketId,
                          ticketName: ticket?.name || "",
                          ticketIndex: `${ticketId}-${index}`,
                        }))
                      })
                      .map((ticketInfo, index) => (
                        <Card key={ticketInfo.ticketIndex} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Ticket #{index + 1}</h4>
                                <p className="text-sm text-gray-600">{ticketInfo.ticketName}</p>
                              </div>
                              <div className="w-64">
                                <Label>Assign to Registered Attendee</Label>
                                <select
                                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                                  value={ticketAssignments[ticketInfo.ticketIndex] || ""}
                                  onChange={(e) => handleTicketAssignment(ticketInfo.ticketIndex, e.target.value)}
                                >
                                  <option value="">Select attendee...</option>
                                  {registeredAttendees
                                    .filter(
                                      (attendee) =>
                                        !Object.values(ticketAssignments).includes(attendee.id) ||
                                        ticketAssignments[ticketInfo.ticketIndex] === attendee.id,
                                    )
                                    .map((attendee) => (
                                      <option key={attendee.id} value={attendee.id}>
                                        {attendee.firstName} {attendee.lastName} ({attendee.email})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {getUnassignedTickets() > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>{getUnassignedTickets()} tickets</strong> still need to be assigned to attendees.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Create New Attendee Profiles</h4>
                      <p className="text-sm text-blue-800">
                        New attendee profiles will be created for each ticket. They can register separately later.
                      </p>
                    </div>

                    {Object.entries(selectedTickets)
                      .filter(([_, quantity]) => quantity > 0)
                      .map(([ticketId, quantity]) => {
                        const ticket = mockTicketTypes.find((t) => t.id === ticketId)
                        return (
                          <div key={ticketId} className="p-4 border border-gray-200 rounded-lg">
                            <h4 className="font-medium mb-2">{ticket?.name} Tickets</h4>
                            <p className="text-sm text-gray-600">
                              {quantity} ticket{quantity > 1 ? "s" : ""} will be created. Attendees can claim and
                              register using the ticket codes sent to your email.
                            </p>
                          </div>
                        )
                      })}
                  </div>
                )}

                <div>
                  <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                  <Textarea
                    id="specialRequests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests for the assigned attendees..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
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
                        paymentMethod === method.id ? "border-green-500 bg-green-50" : "hover:border-gray-300"
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
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <h3 className="font-semibold mb-2">Mobile Money Payment</h3>
                    <p className="text-gray-600 text-sm">
                      You will receive a prompt on your mobile device to complete the payment.
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
                      Bank details will be provided after you proceed with this payment method.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                      {eventData.venues[0] && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{eventData.venues[0].venueName}</span>
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
                      ? "bg-green-500 border-green-500 text-white"
                      : step < currentStep
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    step === currentStep ? "text-green-600" : step < currentStep ? "text-green-600" : "text-gray-500"
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
                <Button onClick={nextStep} className="bg-green-600 hover:bg-green-700">
                  Next
                </Button>
              ) : (
                <Button onClick={handlePurchase} disabled={processing} className="bg-green-600 hover:bg-green-700">
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
                    const ticket = mockTicketTypes.find((t) => t.id === ticketId)
                    if (!ticket) return null

                    const hasDiscount = ticket.discountTiers.length > 0
                    const originalPrice = ticket.price
                    const discountedPrice = hasDiscount
                      ? ticket.price * (1 - ticket.discountTiers[0].percentage / 100)
                      : ticket.price

                    return (
                      <div key={ticketId} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{ticket.name}</div>
                            <div className="text-sm text-gray-500">
                              {hasDiscount ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="line-through">${originalPrice}</span>
                                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                      {ticket.discountTiers[0].percentage}% OFF
                                    </Badge>
                                  </div>
                                  <div>
                                    ${discountedPrice.toFixed(2)} × {quantity}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  ${originalPrice} × {quantity}
                                </div>
                              )}
                            </div>

                            {/* Quick benefits preview */}
                            <div className="mt-2 space-y-1">
                              {ticket.includedGuests.length > 0 && (
                                <div className="text-xs text-blue-600">
                                  Includes: {ticket.includedGuests.map((g) => g.name).join(", ")}
                                </div>
                              )}
                              {ticket.includedMeals.length > 0 && (
                                <div className="text-xs text-green-600">
                                  Meals: {ticket.includedMeals.slice(0, 2).join(", ")}
                                  {ticket.includedMeals.length > 2 && ` +${ticket.includedMeals.length - 2} more`}
                                </div>
                              )}
                              {ticket.exclusiveAreas.length > 0 && (
                                <div className="text-xs text-purple-600">
                                  Access: {ticket.exclusiveAreas.slice(0, 2).join(", ")}
                                  {ticket.exclusiveAreas.length > 2 && ` +${ticket.exclusiveAreas.length - 2} more`}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {ticket.parkingIncluded && (
                                  <Badge variant="outline" className="text-xs">
                                    Parking
                                  </Badge>
                                )}
                                {ticket.meetAndGreet && (
                                  <Badge variant="outline" className="text-xs">
                                    Meet & Greet
                                  </Badge>
                                )}
                                {ticket.priorityAccess && (
                                  <Badge variant="outline" className="text-xs">
                                    Priority
                                  </Badge>
                                )}
                                {ticket.giftBag && (
                                  <Badge variant="outline" className="text-xs">
                                    Gift Bag
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="font-semibold text-right">
                            ${(discountedPrice * quantity).toFixed(2)}
                            {hasDiscount && (
                              <div className="text-xs text-gray-400 line-through">
                                ${(originalPrice * quantity).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                        <Separator className="my-2" />
                      </div>
                    )
                  })}

                {getTotalTickets() > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span className="text-green-600">${getTotalPrice()}</span>
                    </div>
                  </>
                )}

                {getTotalTickets() > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Ticket Assignment</div>
                      {assignToRegistered ? (
                        <div className="text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Method:</span>
                            <span>Registered Attendees</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Assigned:</span>
                            <span>
                              {Object.keys(ticketAssignments).length}/{getTotalTickets()}
                            </span>
                          </div>
                          {getUnassignedTickets() > 0 && (
                            <div className="text-yellow-600 text-xs mt-1">
                              {getUnassignedTickets()} tickets need assignment
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Method:</span>
                            <span>New Profiles</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Attendees will register separately</div>
                        </div>
                      )}
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
                  <Shield className="h-4 w-4 text-green-600" />
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
    </div>
  )
}
