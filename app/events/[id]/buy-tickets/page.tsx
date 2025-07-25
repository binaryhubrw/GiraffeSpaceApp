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
import ApiService from "@/api/apiConfig"
import { Switch } from "@/components/ui/switch"
import { useAttendee } from "@/context/AttendeeContext"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

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
  id: string
  name: string
  description: string
  price: number
  maxQuantity: number
  availableQuantity: number
  benefits: string[]
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
  eventId: string
}

// Mock ticket types
const mockTicketTypes: TicketType[] = [
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Limited time offer with exclusive benefits",
    price: 50,
    maxQuantity: 5,
    availableQuantity: 25,
    benefits: ["Priority seating", "Welcome kit", "Networking session access"],
  },
  {
    id: "regular",
    name: "Regular",
    description: "Standard event access",
    price: 75,
    maxQuantity: 10,
    availableQuantity: 150,
    benefits: ["Event access", "Lunch included", "Certificate"],
  },
  {
    id: "vip",
    name: "VIP",
    description: "Premium experience with exclusive perks",
    price: 150,
    maxQuantity: 3,
    availableQuantity: 10,
    benefits: ["Front row seating", "Meet & greet", "Premium lunch", "Exclusive swag", "Photo opportunity"],
  },
]

const paymentMethods: PaymentMethod[] = [
  { id: "card", type: "card", name: "Credit/Debit Card", icon: "💳" },
  { id: "mobile", type: "mobile", name: "Mobile Money", icon: "📱" },
  { id: "bank", type: "bank", name: "Bank Transfer", icon: "🏦" },
]

export default function BuyTicketForm({ eventId: propEventId }: { eventId?: string }) {
  const params = useParams();
  const eventId = (propEventId || params.id) as string;
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Tickets, 2: Details, 3: Payment

  // Form state
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const { attendees: registeredAttendees } = useAttendee();
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    organization: "",
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
  const [ticketAssignments, setTicketAssignments] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        const response = await ApiService.getPubulishedEventById(eventId)
        if (response.success) {
          setEventData(response.data)
        } else {
          setError("Failed to load event data")
        }
      } catch (err) {
        setError("An error occurred while loading the event")
      } finally {
        setLoading(false)
      }
    }
    if (eventId) {
      fetchEventData()
    } else {
      setLoading(false)
      setError("No event ID provided in URL.")
    }
  }, [eventId])

  // Pre-fill buyer info with first attendee if available
  useEffect(() => {
    if (registeredAttendees && registeredAttendees.length > 0) {
      setBuyerInfo({
        firstName: registeredAttendees[0].firstName || "",
        lastName: registeredAttendees[0].lastName || "",
        email: registeredAttendees[0].email || "",
        phoneNumber: registeredAttendees[0].phoneNumber || "",
        organization: registeredAttendees[0].organization || "",
      });
    }
  }, [registeredAttendees]);

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
      return total + (ticket ? ticket.price * quantity : 0)
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
        eventId,
        buyerId: registeredAttendees[0]?.id || "mock_buyer_id", // Use first attendee's ID or a mock
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{ticket.name}</h3>
                          {ticket.id === "early-bird" && <Badge className="bg-orange-500">Limited Time</Badge>}
                          {ticket.id === "vip" && <Badge className="bg-purple-500">Premium</Badge>}
                        </div>
                        <p className="text-gray-600 mb-3">{ticket.description}</p>
                        <div className="space-y-1">
                          {ticket.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-3 w-3 text-green-500" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span>Available: {ticket.availableQuantity}</span>
                          <span>Max per person: {ticket.maxQuantity}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-3">
                        <div>
                          <div className="text-2xl font-bold text-green-600">${ticket.price}</div>
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
                        {buyerInfo.firstName[0]}
                        {buyerInfo.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-blue-900">
                        {buyerInfo.firstName} {buyerInfo.lastName}
                      </h4>
                      <p className="text-sm text-blue-700">{buyerInfo.email}</p>
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
                      const ticket = mockTicketTypes.find((t) => t.id === ticketId)
                      if (!ticket) return null

                      return (
                        <div key={ticketId} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{ticket.name}</div>
                            <div className="text-sm text-gray-500">
                              ${ticket.price} × {quantity}
                            </div>
                          </div>
                          <div className="font-semibold">${ticket.price * quantity}</div>
                        </div>
                      )
                    })}

                  {getTotalTickets() > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span className="text-blue-600">${getTotalPrice()}</span>
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
      </main>
      <Footer />
    </div>
  )
}
