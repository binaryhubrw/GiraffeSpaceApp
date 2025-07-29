"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar, Plus, X, MapPin, Loader2, Check, Ticket, DollarSign, Save, Eye, Settings, Info } from "lucide-react"
import Image from "next/image"

interface EventData {
  eventId: string
  eventName: string
  eventType: string
  eventPhoto: string
  bookingDates: Array<{ date: string }>
  maxAttendees: number
  eventStatus: string
  venues: Array<{
    venueName: string
    venueLocation: string
    capacity: number
  }>
}

interface TicketType {
  id?: string
  name: string
  description: string
  price: number
  currency: string
  quantity: number
  maxPerPerson: number
  saleStartDate: string
  saleEndDate: string
  isActive: boolean
  benefits: string[]
  category: string
  isRefundable: boolean
  refundPolicy: string
  transferable: boolean
  requiresApproval: boolean
  ageRestriction: string
  specialInstructions: string
}

interface CreateTicketFormProps {
  eventId: string
}

// Mock event data
const mockEventData: EventData = {
  eventId: "ccec53d7-eb77-4c06-937b-3b20b801714c",
  eventName: "iwacu muzika",
  eventType: "PARTY",
  eventPhoto: "https://res.cloudinary.com/di5ntdtyl/image/upload/v1753799162/events/photos/ofs29hfkvinl013s3tb6.jpg",
  bookingDates: [{ date: "2025-10-12" }, { date: "2025-10-13" }],
  maxAttendees: 9999,
  eventStatus: "APPROVED",
  venues: [
    {
      venueName: "Akagera Tents",
      venueLocation: "59 KN 7 Ave, Kigali, Rwanda",
      capacity: 10000,
    },
  ],
}

const ticketCategories = [
  "GENERAL_ADMISSION",
  "VIP",
  "PREMIUM",
  "EARLY_BIRD",
  "STUDENT",
  "GROUP",
  "CORPORATE",
  "SPONSOR",
]

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "RWF", symbol: "₣", name: "Rwandan Franc" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
]

const ageRestrictions = ["NO_RESTRICTION", "18_PLUS", "21_PLUS", "FAMILY_FRIENDLY", "CHILDREN_ONLY", "SENIOR_DISCOUNT"]

const steps = [
  { id: 1, title: "Basic Info", icon: Info },
  { id: 2, title: "Pricing & Sales", icon: DollarSign },
  { id: 3, title: "Settings", icon: Settings },
  { id: 4, title: "Review", icon: Eye },
]

export default function CreateTicketForm({ eventId }: CreateTicketFormProps) {
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [success, setSuccess] = useState(false)

  // Form state
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    {
      name: "",
      description: "",
      price: 0,
      currency: "USD",
      quantity: 100,
      maxPerPerson: 5,
      saleStartDate: "",
      saleEndDate: "",
      isActive: true,
      benefits: [""],
      category: "GENERAL_ADMISSION",
      isRefundable: true,
      refundPolicy: "",
      transferable: true,
      requiresApproval: false,
      ageRestriction: "NO_RESTRICTION",
      specialInstructions: "",
    },
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setEventData(mockEventData)

        // Set default sale dates based on event dates
        const eventStartDate = mockEventData.bookingDates[0].date
        const saleStartDate = new Date()
        const saleEndDate = new Date(eventStartDate)
        saleEndDate.setDate(saleEndDate.getDate() - 1) // End sales 1 day before event

        setTicketTypes((prev) =>
          prev.map((ticket) => ({
            ...ticket,
            saleStartDate: saleStartDate.toISOString().split("T")[0],
            saleEndDate: saleEndDate.toISOString().split("T")[0],
          })),
        )
      } catch (err) {
        console.error("Error fetching event data:", err)
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const handleTicketChange = (index: number, field: keyof TicketType, value: any) => {
    const newTickets = [...ticketTypes]
    newTickets[index] = { ...newTickets[index], [field]: value }
    setTicketTypes(newTickets)

    // Clear error for this field
    const errorKey = `ticket-${index}-${field}`
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }))
    }
  }

  const handleBenefitChange = (ticketIndex: number, benefitIndex: number, value: string) => {
    const newTickets = [...ticketTypes]
    newTickets[ticketIndex].benefits[benefitIndex] = value
    setTicketTypes(newTickets)
  }

  const addBenefit = (ticketIndex: number) => {
    const newTickets = [...ticketTypes]
    newTickets[ticketIndex].benefits.push("")
    setTicketTypes(newTickets)
  }

  const removeBenefit = (ticketIndex: number, benefitIndex: number) => {
    const newTickets = [...ticketTypes]
    if (newTickets[ticketIndex].benefits.length > 1) {
      newTickets[ticketIndex].benefits.splice(benefitIndex, 1)
      setTicketTypes(newTickets)
    }
  }

  const addTicketType = () => {
    const defaultSaleStart = new Date().toISOString().split("T")[0]
    const defaultSaleEnd = eventData?.bookingDates[0]
      ? new Date(new Date(eventData.bookingDates[0].date).getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : ""

    setTicketTypes([
      ...ticketTypes,
      {
        name: "",
        description: "",
        price: 0,
        currency: "USD",
        quantity: 100,
        maxPerPerson: 5,
        saleStartDate: defaultSaleStart,
        saleEndDate: defaultSaleEnd,
        isActive: true,
        benefits: [""],
        category: "GENERAL_ADMISSION",
        isRefundable: true,
        refundPolicy: "",
        transferable: true,
        requiresApproval: false,
        ageRestriction: "NO_RESTRICTION",
        specialInstructions: "",
      },
    ])
  }

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      const newTickets = ticketTypes.filter((_, i) => i !== index)
      setTicketTypes(newTickets)
    }
  }

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {}

    ticketTypes.forEach((ticket, index) => {
      switch (currentStep) {
        case 1:
          if (!ticket.name.trim()) {
            newErrors[`ticket-${index}-name`] = "Ticket name is required"
          }
          if (!ticket.description.trim()) {
            newErrors[`ticket-${index}-description`] = "Description is required"
          }
          if (!ticket.category) {
            newErrors[`ticket-${index}-category`] = "Category is required"
          }
          break
        case 2:
          if (ticket.price < 0) {
            newErrors[`ticket-${index}-price`] = "Price cannot be negative"
          }
          if (ticket.quantity <= 0) {
            newErrors[`ticket-${index}-quantity`] = "Quantity must be greater than 0"
          }
          if (ticket.maxPerPerson <= 0) {
            newErrors[`ticket-${index}-maxPerPerson`] = "Max per person must be greater than 0"
          }
          if (!ticket.saleStartDate) {
            newErrors[`ticket-${index}-saleStartDate`] = "Sale start date is required"
          }
          if (!ticket.saleEndDate) {
            newErrors[`ticket-${index}-saleEndDate`] = "Sale end date is required"
          }
          if (ticket.saleStartDate && ticket.saleEndDate && ticket.saleStartDate >= ticket.saleEndDate) {
            newErrors[`ticket-${index}-saleEndDate`] = "Sale end date must be after start date"
          }
          break
        case 3:
          if (ticket.isRefundable && !ticket.refundPolicy.trim()) {
            newErrors[`ticket-${index}-refundPolicy`] = "Refund policy is required for refundable tickets"
          }
          break
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (isDraft: boolean) => {
    if (!validateCurrentStep()) return

    setSubmitting(true)

    try {
      const ticketData = {
        eventId,
        ticketTypes: ticketTypes.map((ticket) => ({
          ...ticket,
          benefits: ticket.benefits.filter((benefit) => benefit.trim()),
          status: isDraft ? "DRAFT" : "ACTIVE",
        })),
        createdBy: "admin-user-id", // Replace with actual admin ID
        createdAt: new Date().toISOString(),
      }

      console.log("Creating tickets:", ticketData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess(true)
    } catch (err) {
      console.error("Error creating tickets:", err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading event details...</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Tickets Created Successfully!</h2>
            <p className="text-gray-600">
              You have successfully created {ticketTypes.length} ticket type{ticketTypes.length > 1 ? "s" : ""} for{" "}
              {eventData?.eventName}.
            </p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => window.history.back()}>
                Back to Event
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setSuccess(false)}>
                Create More Tickets
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
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Basic Ticket Information</h2>
              <p className="text-gray-600">Set up the basic details for your ticket types</p>
            </div>

            <div className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Ticket Type {index + 1}</CardTitle>
                      {ticketTypes.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removeTicketType(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`name-${index}`}>Ticket Name *</Label>
                        <Input
                          id={`name-${index}`}
                          value={ticket.name}
                          onChange={(e) => handleTicketChange(index, "name", e.target.value)}
                          placeholder="e.g., General Admission, VIP, Early Bird"
                          className={`mt-1 ${errors[`ticket-${index}-name`] ? "border-red-500" : ""}`}
                        />
                        {errors[`ticket-${index}-name`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-name`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`category-${index}`}>Category *</Label>
                        <Select
                          value={ticket.category}
                          onValueChange={(value) => handleTicketChange(index, "category", value)}
                        >
                          <SelectTrigger
                            className={`mt-1 ${errors[`ticket-${index}-category`] ? "border-red-500" : ""}`}
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {ticketCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`ticket-${index}-category`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-category`]}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`description-${index}`}>Description *</Label>
                      <Textarea
                        id={`description-${index}`}
                        value={ticket.description}
                        onChange={(e) => handleTicketChange(index, "description", e.target.value)}
                        placeholder="Describe what this ticket includes..."
                        rows={3}
                        className={`mt-1 ${errors[`ticket-${index}-description`] ? "border-red-500" : ""}`}
                      />
                      {errors[`ticket-${index}-description`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-description`]}</p>
                      )}
                    </div>

                    <div>
                      <Label>Ticket Benefits</Label>
                      <div className="mt-2 space-y-2">
                        {ticket.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-2">
                            <Input
                              value={benefit}
                              onChange={(e) => handleBenefitChange(index, benefitIndex, e.target.value)}
                              placeholder="e.g., Access to main event, Welcome drink"
                              className="flex-1"
                            />
                            {ticket.benefits.length > 1 && (
                              <Button variant="outline" size="sm" onClick={() => removeBenefit(index, benefitIndex)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBenefit(index)}
                          className="w-full border-dashed bg-transparent"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Benefit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={addTicketType}
                className="w-full h-12 border-dashed border-2 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Ticket Type
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Pricing & Sales Period</h2>
              <p className="text-gray-600">Set pricing and availability for your tickets</p>
            </div>

            <div className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">{ticket.name || `Ticket Type ${index + 1}`}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`price-${index}`}>Price *</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Select
                            value={ticket.currency}
                            onValueChange={(value) => handleTicketChange(index, "currency", value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  {currency.symbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={ticket.price}
                            onChange={(e) => handleTicketChange(index, "price", Number.parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className={`flex-1 ${errors[`ticket-${index}-price`] ? "border-red-500" : ""}`}
                          />
                        </div>
                        {errors[`ticket-${index}-price`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-price`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`quantity-${index}`}>Available Quantity *</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={ticket.quantity}
                          onChange={(e) => handleTicketChange(index, "quantity", Number.parseInt(e.target.value) || 0)}
                          className={`mt-1 ${errors[`ticket-${index}-quantity`] ? "border-red-500" : ""}`}
                        />
                        {errors[`ticket-${index}-quantity`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-quantity`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`maxPerPerson-${index}`}>Max Per Person *</Label>
                        <Input
                          id={`maxPerPerson-${index}`}
                          type="number"
                          min="1"
                          value={ticket.maxPerPerson}
                          onChange={(e) =>
                            handleTicketChange(index, "maxPerPerson", Number.parseInt(e.target.value) || 0)
                          }
                          className={`mt-1 ${errors[`ticket-${index}-maxPerPerson`] ? "border-red-500" : ""}`}
                        />
                        {errors[`ticket-${index}-maxPerPerson`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-maxPerPerson`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`saleStartDate-${index}`}>Sale Start Date *</Label>
                        <Input
                          id={`saleStartDate-${index}`}
                          type="date"
                          value={ticket.saleStartDate}
                          onChange={(e) => handleTicketChange(index, "saleStartDate", e.target.value)}
                          className={`mt-1 ${errors[`ticket-${index}-saleStartDate`] ? "border-red-500" : ""}`}
                        />
                        {errors[`ticket-${index}-saleStartDate`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-saleStartDate`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`saleEndDate-${index}`}>Sale End Date *</Label>
                        <Input
                          id={`saleEndDate-${index}`}
                          type="date"
                          value={ticket.saleEndDate}
                          onChange={(e) => handleTicketChange(index, "saleEndDate", e.target.value)}
                          className={`mt-1 ${errors[`ticket-${index}-saleEndDate`] ? "border-red-500" : ""}`}
                        />
                        {errors[`ticket-${index}-saleEndDate`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-saleEndDate`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Active Status</Label>
                        <p className="text-xs text-gray-600">Enable ticket sales immediately</p>
                      </div>
                      <Switch
                        checked={ticket.isActive}
                        onCheckedChange={(checked) => handleTicketChange(index, "isActive", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Ticket Settings</h2>
              <p className="text-gray-600">Configure additional settings and policies</p>
            </div>

            <div className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">{ticket.name || `Ticket Type ${index + 1}`}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Refundable</Label>
                            <p className="text-xs text-gray-600">Allow ticket refunds</p>
                          </div>
                          <Switch
                            checked={ticket.isRefundable}
                            onCheckedChange={(checked) => handleTicketChange(index, "isRefundable", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Transferable</Label>
                            <p className="text-xs text-gray-600">Allow ticket transfers</p>
                          </div>
                          <Switch
                            checked={ticket.transferable}
                            onCheckedChange={(checked) => handleTicketChange(index, "transferable", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Requires Approval</Label>
                            <p className="text-xs text-gray-600">Manual approval needed</p>
                          </div>
                          <Switch
                            checked={ticket.requiresApproval}
                            onCheckedChange={(checked) => handleTicketChange(index, "requiresApproval", checked)}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`ageRestriction-${index}`}>Age Restriction</Label>
                          <Select
                            value={ticket.ageRestriction}
                            onValueChange={(value) => handleTicketChange(index, "ageRestriction", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ageRestrictions.map((restriction) => (
                                <SelectItem key={restriction} value={restriction}>
                                  {restriction.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {ticket.isRefundable && (
                      <div>
                        <Label htmlFor={`refundPolicy-${index}`}>Refund Policy *</Label>
                        <Textarea
                          id={`refundPolicy-${index}`}
                          value={ticket.refundPolicy}
                          onChange={(e) => handleTicketChange(index, "refundPolicy", e.target.value)}
                          placeholder="Describe your refund policy..."
                          rows={3}
                          className={`mt-1 ${errors[`ticket-${index}-refundPolicy`] ? "border-red-500" : ""}`}
                        />
                        {errors[`ticket-${index}-refundPolicy`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-refundPolicy`]}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor={`specialInstructions-${index}`}>Special Instructions</Label>
                      <Textarea
                        id={`specialInstructions-${index}`}
                        value={ticket.specialInstructions}
                        onChange={(e) => handleTicketChange(index, "specialInstructions", e.target.value)}
                        placeholder="Any special instructions for ticket holders..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Review Ticket Types</h2>
              <p className="text-gray-600">Review all ticket types before creating</p>
            </div>

            <div className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{ticket.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{ticket.category.replace(/_/g, " ")}</Badge>
                          <Badge variant={ticket.isActive ? "default" : "secondary"}>
                            {ticket.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {ticket.isRefundable && <Badge variant="outline">Refundable</Badge>}
                          {ticket.transferable && <Badge variant="outline">Transferable</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {currencies.find((c) => c.code === ticket.currency)?.symbol}
                          {ticket.price}
                        </div>
                        <div className="text-sm text-gray-500">per ticket</div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{ticket.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Available Quantity:</span>
                          <span className="font-medium">{ticket.quantity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Max Per Person:</span>
                          <span className="font-medium">{ticket.maxPerPerson}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Age Restriction:</span>
                          <span className="font-medium">{ticket.ageRestriction.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Sale Start:</span>
                          <span className="font-medium">{new Date(ticket.saleStartDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Sale End:</span>
                          <span className="font-medium">{new Date(ticket.saleEndDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Currency:</span>
                          <span className="font-medium">{ticket.currency}</span>
                        </div>
                      </div>
                    </div>

                    {ticket.benefits.filter((b) => b.trim()).length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Benefits:</h4>
                        <ul className="space-y-1">
                          {ticket.benefits
                            .filter((b) => b.trim())
                            .map((benefit, benefitIndex) => (
                              <li key={benefitIndex} className="flex items-center gap-2 text-sm">
                                <Check className="h-3 w-3 text-blue-500" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {ticket.specialInstructions && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">Special Instructions:</h4>
                        <p className="text-sm text-blue-800">{ticket.specialInstructions}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <div className="flex gap-4">
                <Button
                  onClick={() => handleSubmit(true)}
                  variant="outline"
                  className="flex-1 h-12 bg-transparent"
                  disabled={submitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button onClick={() => handleSubmit(false)} className="flex-1 h-12" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4 mr-2" />
                      Create Tickets
                    </>
                  )}
                </Button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Event Tickets</h1>
          <p className="text-gray-600">Set up ticket types for your event</p>
        </div>

        {/* Event Summary */}
        {eventData && (
          <Card className="mb-8 border-2">
            <CardContent className="p-0">
              <div className="relative h-32 md:h-40">
                <Image
                  src={eventData.eventPhoto || "/placeholder.svg?height=160&width=800&query=event banner"}
                  alt={eventData.eventName}
                  fill
                  className="object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black/40 rounded-t-lg" />
                <div className="absolute inset-0 flex items-end p-4">
                  <div className="text-white">
                    <h2 className="text-xl md:text-2xl font-bold capitalize">{eventData.eventName}</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
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
            {steps.map(({ id, title, icon: Icon }) => (
              <div key={id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    id === currentStep
                      ? "bg-blue-500 border-blue-500 text-white"
                      : id < currentStep
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300 text-gray-500"
                  }`}
                >
                  {id < currentStep ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    id === currentStep ? "text-blue-600" : id < currentStep ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg border-0 mb-8">
          <CardContent className="p-8">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="bg-transparent">
              Previous
            </Button>
            <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
