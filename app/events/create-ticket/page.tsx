"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Calendar,
  Plus,
  X,
  MapPin,
  Loader2,
  Check,
  Ticket,
  DollarSign,
  Save,
  Eye,
  Settings,
  Info,
  Users,
  Star,
  Gift,
  Music,
  Utensils,
  Car,
  Percent,
  Upload,
  ImageIcon,
} from "lucide-react"
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

interface Guest {
  id: string
  name: string
  role: string
  description: string
  image?: string
}

interface TicketBenefit {
  id: string
  category: string
  title: string
  description: string
  icon: string
}

interface DiscountTier {
  id: string
  name: string
  percentage: number
  startDate: string
  endDate: string
  description: string
}

interface TicketType {
  id?: string
  name: string
  customName: string
  description: string
  price: number
  currency: string
  quantity: number
  maxPerPerson: number
  saleStartDate: string
  saleEndDate: string
  eventDate: string
  startTime: string
  endTime: string
  isActive: boolean
  benefits: TicketBenefit[]
  includedGuests: Guest[]
  category: string
  isRefundable: boolean
  refundPolicy: string
  transferable: boolean
  requiresApproval: boolean
  ageRestriction: string
  specialInstructions: string
  accessLevel: string
  includedMeals: string[]
  parkingIncluded: boolean
  merchandiseIncluded: string[]
  meetAndGreet: boolean
  exclusiveAreas: string[]
  priorityAccess: boolean
  complimentaryDrinks: number
  giftBag: boolean
  certificateIncluded: boolean
  discountTiers: DiscountTier[]
}

interface CreateTicketFormProps {
  // No props needed since we're using mock data
}

// Mock event data
const mockEventData: EventData = {
  eventId: "ccec53d7-eb77-4c06-937b-3b20b801714c",
  eventName: "iwacu muzika",
  eventType: "PARTY",
  eventPhoto: "https://res.cloudinary.com/di5ntdtyl/image/upload/v1753799162/events/photos/ofs29hfkvinl013s3tb6.jpg",
  bookingDates: [{ date: "2025-10-12" }, { date: "2025-10-13" }, { date: "2025-10-14" }],
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

const predefinedTicketNames = [
  "General Admission",
  "VIP Pass",
  "Premium Access",
  "Early Bird Special",
  "Student Discount",
  "Group Package",
  "Corporate Package",
  "Sponsor Pass",
  "Backstage Pass",
  "All Access Pass",
  "Front Row Seats",
  "Balcony Seats",
  "Standing Room",
  "Meet & Greet Package",
  "Dinner & Show",
  "Weekend Pass",
  "Single Day Pass",
  "Family Package",
  "Senior Discount",
  "Military Discount",
]

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

const accessLevels = ["GENERAL", "VIP", "PREMIUM", "BACKSTAGE", "ALL_ACCESS"]

const benefitCategories = [
  { id: "access", name: "Access & Entry", icon: "ticket" },
  { id: "food", name: "Food & Beverage", icon: "utensils" },
  { id: "entertainment", name: "Entertainment", icon: "music" },
  { id: "networking", name: "Networking", icon: "users" },
  { id: "merchandise", name: "Merchandise", icon: "gift" },
  { id: "services", name: "Services", icon: "star" },
]

const availableGuests = [
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
  {
    id: "4",
    name: "Tech Innovators Panel",
    role: "Industry Experts",
    description: "Leading tech entrepreneurs and innovators",
    image: "/placeholder.svg?height=100&width=100",
  },
]

const mealOptions = [
  "Welcome Cocktail",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Afternoon Tea",
  "Gala Dinner",
  "Networking Lunch",
  "VIP Reception",
]

const merchandiseOptions = [
  "Event T-Shirt",
  "Branded Tote Bag",
  "Event Program",
  "Commemorative Pin",
  "Photo Book",
  "USB Drive with Content",
  "Branded Water Bottle",
  "Event Poster",
]

const exclusiveAreaOptions = [
  "VIP Lounge",
  "Backstage Area",
  "Green Room",
  "Executive Suite",
  "Rooftop Terrace",
  "Private Bar",
  "Networking Zone",
  "Photo Booth Area",
]

const steps = [
  { id: 1, title: "Basic Info & Benefits", icon: Info },
  { id: 2, title: "Pricing & Discounts", icon: DollarSign },
  { id: 3, title: "Settings", icon: Settings },
  { id: 4, title: "Review", icon: Eye },
]

const getBenefitIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    ticket: Ticket,
    utensils: Utensils,
    music: Music,
    users: Users,
    gift: Gift,
    star: Star,
    car: Car,
  }
  return icons[iconName] || Star
}

export default function CreateTicketForm() {
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const [customGuests, setCustomGuests] = useState<Guest[]>([])
  const [showAddGuestForm, setShowAddGuestForm] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: "", role: "", description: "", image: "" })
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  // Form state
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    {
      name: "",
      customName: "",
      description: "",
      price: 0,
      currency: "USD",
      quantity: 100,
      maxPerPerson: 5,
      saleStartDate: "",
      saleEndDate: "",
      eventDate: "",
      startTime: "09:00",
      endTime: "17:00",
      isActive: true,
      benefits: [],
      includedGuests: [],
      category: "GENERAL_ADMISSION",
      isRefundable: true,
      refundPolicy: "",
      transferable: true,
      requiresApproval: false,
      ageRestriction: "NO_RESTRICTION",
      specialInstructions: "",
      accessLevel: "GENERAL",
      includedMeals: [],
      parkingIncluded: false,
      merchandiseIncluded: [],
      meetAndGreet: false,
      exclusiveAreas: [],
      priorityAccess: false,
      complimentaryDrinks: 0,
      giftBag: false,
      certificateIncluded: false,
      discountTiers: [],
    },
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        // Simulate a brief loading time
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        // Use mock data directly
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
            eventDate: mockEventData.bookingDates[0].date,
          })),
        )
      } catch (err) {
        console.error("Error initializing data:", err)
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImageFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setNewGuest({ ...newGuest, image: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const resetGuestForm = () => {
    setNewGuest({ name: "", role: "", description: "", image: "" })
    setSelectedImageFile(null)
    setImagePreview("")
    setShowAddGuestForm(false)
  }

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

  const addBenefit = (ticketIndex: number) => {
    const newTickets = [...ticketTypes]
    const newBenefit: TicketBenefit = {
      id: Date.now().toString(),
      category: "access",
      title: "",
      description: "",
      icon: "star",
    }
    newTickets[ticketIndex].benefits.push(newBenefit)
    setTicketTypes(newTickets)
  }

  const updateBenefit = (ticketIndex: number, benefitIndex: number, field: keyof TicketBenefit, value: string) => {
    const newTickets = [...ticketTypes]
    newTickets[ticketIndex].benefits[benefitIndex] = {
      ...newTickets[ticketIndex].benefits[benefitIndex],
      [field]: value,
    }
    setTicketTypes(newTickets)
  }

  const removeBenefit = (ticketIndex: number, benefitIndex: number) => {
    const newTickets = [...ticketTypes]
    newTickets[ticketIndex].benefits.splice(benefitIndex, 1)
    setTicketTypes(newTickets)
  }

  const toggleGuest = (ticketIndex: number, guest: Guest) => {
    const newTickets = [...ticketTypes]
    const currentGuests = newTickets[ticketIndex].includedGuests
    const guestExists = currentGuests.find((g) => g.id === guest.id)

    if (guestExists) {
      newTickets[ticketIndex].includedGuests = currentGuests.filter((g) => g.id !== guest.id)
    } else {
      newTickets[ticketIndex].includedGuests.push(guest)
    }

    setTicketTypes(newTickets)
  }

  const addCustomGuest = async () => {
    if (newGuest.name && newGuest.role) {
      let imageUrl = newGuest.image

      // If a file was selected, simulate upload (in real app, upload to cloud storage)
      if (selectedImageFile) {
        // In a real application, you would upload the file to your storage service
        // For now, we'll use the preview URL
        imageUrl = imagePreview
      }

      const guest: Guest = {
        id: `custom-${Date.now()}`,
        name: newGuest.name,
        role: newGuest.role,
        description: newGuest.description,
        image: imageUrl || "/placeholder.svg?height=100&width=100",
      }

      setCustomGuests([...customGuests, guest])
      resetGuestForm()
    }
  }

  const addDiscountTier = (ticketIndex: number) => {
    const newTickets = [...ticketTypes]
    const newDiscount: DiscountTier = {
      id: Date.now().toString(),
      name: "",
      percentage: 0,
      startDate: "",
      endDate: "",
      description: "",
    }
    newTickets[ticketIndex].discountTiers.push(newDiscount)
    setTicketTypes(newTickets)
  }

  const updateDiscountTier = (
    ticketIndex: number,
    discountIndex: number,
    field: keyof DiscountTier,
    value: string | number,
  ) => {
    const newTickets = [...ticketTypes]
    newTickets[ticketIndex].discountTiers[discountIndex] = {
      ...newTickets[ticketIndex].discountTiers[discountIndex],
      [field]: value,
    }
    setTicketTypes(newTickets)
  }

  const removeDiscountTier = (ticketIndex: number, discountIndex: number) => {
    const newTickets = [...ticketTypes]
    newTickets[ticketIndex].discountTiers.splice(discountIndex, 1)
    setTicketTypes(newTickets)
  }

  const toggleArrayItem = (
    ticketIndex: number,
    field: "includedMeals" | "merchandiseIncluded" | "exclusiveAreas",
    item: string,
  ) => {
    const newTickets = [...ticketTypes]
    const currentArray = newTickets[ticketIndex][field] as string[]

    if (currentArray.includes(item)) {
      newTickets[ticketIndex] = {
        ...newTickets[ticketIndex],
        [field]: currentArray.filter((i) => i !== item),
      }
    } else {
      newTickets[ticketIndex] = {
        ...newTickets[ticketIndex],
        [field]: [...currentArray, item],
      }
    }

    setTicketTypes(newTickets)
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
        customName: "",
        description: "",
        price: 0,
        currency: "USD",
        quantity: 100,
        maxPerPerson: 5,
        saleStartDate: defaultSaleStart,
        saleEndDate: defaultSaleEnd,
        eventDate: eventData?.bookingDates[0]?.date || "",
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
        benefits: [],
        includedGuests: [],
        category: "GENERAL_ADMISSION",
        isRefundable: true,
        refundPolicy: "",
        transferable: true,
        requiresApproval: false,
        ageRestriction: "NO_RESTRICTION",
        specialInstructions: "",
        accessLevel: "GENERAL",
        includedMeals: [],
        parkingIncluded: false,
        merchandiseIncluded: [],
        meetAndGreet: false,
        exclusiveAreas: [],
        priorityAccess: false,
        complimentaryDrinks: 0,
        giftBag: false,
        certificateIncluded: false,
        discountTiers: [],
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
          const ticketName = ticket.name === "custom" ? ticket.customName : ticket.name
          if (!ticketName.trim()) {
            newErrors[`ticket-${index}-name`] = "Ticket name is required"
          }
          if (!ticket.description.trim()) {
            newErrors[`ticket-${index}-description`] = "Description is required"
          }
          if (!ticket.category) {
            newErrors[`ticket-${index}-category`] = "Category is required"
          }
          if (!ticket.eventDate) {
            newErrors[`ticket-${index}-eventDate`] = "Event date is required"
          }
          if (!ticket.startTime) {
            newErrors[`ticket-${index}-startTime`] = "Start time is required"
          }
          if (!ticket.endTime) {
            newErrors[`ticket-${index}-endTime`] = "End time is required"
          }
          if (ticket.startTime && ticket.endTime && ticket.startTime >= ticket.endTime) {
            newErrors[`ticket-${index}-endTime`] = "End time must be after start time"
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
          // Validate discount tiers
          ticket.discountTiers.forEach((discount, discountIndex) => {
            if (discount.name && !discount.percentage) {
              newErrors[`ticket-${index}-discount-${discountIndex}-percentage`] = "Discount percentage is required"
            }
            if (discount.percentage < 0 || discount.percentage > 100) {
              newErrors[`ticket-${index}-discount-${discountIndex}-percentage`] = "Percentage must be between 0-100"
            }
            if (discount.startDate && discount.endDate && discount.startDate >= discount.endDate) {
              newErrors[`ticket-${index}-discount-${discountIndex}-endDate`] = "End date must be after start date"
            }
          })
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
        eventId: "ccec53d7-eb77-4c06-937b-3b20b801714c", // Replace with actual event ID
        ticketTypes: ticketTypes.map((ticket) => ({
          ...ticket,
          benefits: ticket.benefits.filter((benefit) => benefit.title.trim()),
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
          <p className="text-gray-600">Loading create event ticket...</p>
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
              <h2 className="text-2xl font-bold text-gray-900">Basic Ticket Information & Benefits</h2>
              <p className="text-gray-600">Set up the basic details and comprehensive benefits for your ticket types</p>
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
                  <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`name-${index}`}>Ticket Name *</Label>
                        <Select value={ticket.name} onValueChange={(value) => handleTicketChange(index, "name", value)}>
                          <SelectTrigger className={`mt-1 ${errors[`ticket-${index}-name`] ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select or create ticket name" />
                          </SelectTrigger>
                          <SelectContent>
                            {predefinedTicketNames.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Create Custom Name</SelectItem>
                          </SelectContent>
                        </Select>
                        {ticket.name === "custom" && (
                          <Input
                            value={ticket.customName}
                            onChange={(e) => handleTicketChange(index, "customName", e.target.value)}
                            placeholder="Enter custom ticket name"
                            className="mt-2"
                          />
                        )}
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

                    {/* Event Date and Time Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`eventDate-${index}`}>Event Date *</Label>
                        <Select
                          value={ticket.eventDate}
                          onValueChange={(value) => handleTicketChange(index, "eventDate", value)}
                        >
                          <SelectTrigger
                            className={`mt-1 ${errors[`ticket-${index}-eventDate`] ? "border-red-500" : ""}`}
                          >
                            <SelectValue placeholder="Select event date" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventData?.bookingDates.map((dateObj, dateIndex) => (
                              <SelectItem key={dateIndex} value={dateObj.date}>
                                {new Date(dateObj.date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`ticket-${index}-eventDate`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-eventDate`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`startTime-${index}`}>Start Time *</Label>
                        <Input
                          id={`startTime-${index}`}
                          type="time"
                          value={ticket.startTime}
                          onChange={(e) => handleTicketChange(index, "startTime", e.target.value)}
                          className={`mt-1 ${errors[`ticket-${index}-startTime`] ? "border-red-500" : ""}`}
                        />
                        {errors[`ticket-${index}-startTime`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-startTime`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`endTime-${index}`}>End Time *</Label>
                        <Input
                          id={`endTime-${index}`}
                          type="time"
                          value={ticket.endTime}
                          onChange={(e) => handleTicketChange(index, "endTime", e.target.value)}
                          className={`mt-1 ${errors[`ticket-${index}-endTime`] ? "border-red-500" : ""}`}
                        />
                        {errors[`ticket-${index}-endTime`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-endTime`]}</p>
                        )}
                      </div>
                    </div>

                    {/* Access Level */}
                    <div>
                      <Label htmlFor={`accessLevel-${index}`}>Access Level</Label>
                      <Select
                        value={ticket.accessLevel}
                        onValueChange={(value) => handleTicketChange(index, "accessLevel", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {accessLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Included Guests/Participants/Entertainers */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <Label className="text-base font-semibold">Included Guests & Entertainers</Label>
                          <p className="text-sm text-gray-600">
                            Select which guests, participants, or entertainers are included with this ticket
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddGuestForm(true)}
                          className="bg-transparent"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Guest
                        </Button>
                      </div>

                      {showAddGuestForm && (
                        <Card className="p-4 mb-4 border-dashed">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-sm">Guest Name *</Label>
                                <Input
                                  value={newGuest.name}
                                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                                  placeholder="Enter guest name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Role *</Label>
                                <Input
                                  value={newGuest.role}
                                  onChange={(e) => setNewGuest({ ...newGuest, role: e.target.value })}
                                  placeholder="e.g., DJ, Speaker, Chef"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm">Description</Label>
                              <Input
                                value={newGuest.description}
                                onChange={(e) => setNewGuest({ ...newGuest, description: e.target.value })}
                                placeholder="Brief description of the guest"
                                className="mt-1"
                              />
                            </div>

                            {/* Image Upload Section */}
                            <div>
                              <Label className="text-sm">Guest Photo</Label>
                              <div className="mt-2 space-y-3">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageUpload}
                                      className="hidden"
                                      id="guest-image-upload"
                                    />
                                    <Label
                                      htmlFor="guest-image-upload"
                                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                                    >
                                      {imagePreview ? (
                                        <div className="relative w-full h-full">
                                          <Image
                                            src={imagePreview || "/placeholder.svg"}
                                            alt="Guest preview"
                                            fill
                                            className="object-cover rounded-lg"
                                          />
                                          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-white text-sm">Click to change</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center">
                                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                          <p className="text-sm text-gray-600">Click to upload guest photo</p>
                                          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                        </div>
                                      )}
                                    </Label>
                                  </div>

                                  {imagePreview && (
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setImagePreview("")
                                          setSelectedImageFile(null)
                                          setNewGuest({ ...newGuest, image: "" })
                                        }}
                                        className="bg-transparent"
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Remove
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {selectedImageFile && (
                                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                      <ImageIcon className="h-3 w-3" />
                                      <span>{selectedImageFile.name}</span>
                                      <span className="text-gray-400">
                                        ({(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB)
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" onClick={addCustomGuest}>
                                Add Guest
                              </Button>
                              <Button variant="outline" size="sm" onClick={resetGuestForm} className="bg-transparent">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[...availableGuests, ...customGuests].map((guest) => (
                          <div
                            key={guest.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              ticket.includedGuests.find((g) => g.id === guest.id)
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => toggleGuest(index, guest)}
                          >
                            <div className="flex items-start gap-3">
                              <Image
                                src={guest.image || "/placeholder.svg?height=50&width=50&query=person"}
                                alt={guest.name}
                                width={50}
                                height={50}
                                className="rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{guest.name}</h4>
                                <p className="text-xs text-blue-600 font-medium">{guest.role}</p>
                                <p className="text-xs text-gray-600 mt-1">{guest.description}</p>
                              </div>
                              {ticket.includedGuests.find((g) => g.id === guest.id) && (
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Included Meals */}
                    <div>
                      <Label className="text-base font-semibold">Included Meals & Refreshments</Label>
                      <p className="text-sm text-gray-600 mb-3">Select which meals and refreshments are included</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {mealOptions.map((meal) => (
                          <div
                            key={meal}
                            className={`p-2 text-sm border rounded cursor-pointer transition-all ${
                              ticket.includedMeals.includes(meal)
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => toggleArrayItem(index, "includedMeals", meal)}
                          >
                            <div className="flex items-center gap-2">
                              <Utensils className="h-3 w-3" />
                              <span>{meal}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Merchandise Included */}
                    <div>
                      <Label className="text-base font-semibold">Included Merchandise</Label>
                      <p className="text-sm text-gray-600 mb-3">Select merchandise items included with this ticket</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {merchandiseOptions.map((item) => (
                          <div
                            key={item}
                            className={`p-2 text-sm border rounded cursor-pointer transition-all ${
                              ticket.merchandiseIncluded.includes(item)
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => toggleArrayItem(index, "merchandiseIncluded", item)}
                          >
                            <div className="flex items-center gap-2">
                              <Gift className="h-3 w-3" />
                              <span>{item}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exclusive Areas */}
                    <div>
                      <Label className="text-base font-semibold">Exclusive Area Access</Label>
                      <p className="text-sm text-gray-600 mb-3">
                        Select exclusive areas this ticket provides access to
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {exclusiveAreaOptions.map((area) => (
                          <div
                            key={area}
                            className={`p-2 text-sm border rounded cursor-pointer transition-all ${
                              ticket.exclusiveAreas.includes(area)
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => toggleArrayItem(index, "exclusiveAreas", area)}
                          >
                            <div className="flex items-center gap-2">
                              <Star className="h-3 w-3" />
                              <span>{area}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Benefits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Parking Included</Label>
                            <p className="text-xs text-gray-600">Free parking access</p>
                          </div>
                          <Switch
                            checked={ticket.parkingIncluded}
                            onCheckedChange={(checked) => handleTicketChange(index, "parkingIncluded", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Meet & Greet</Label>
                            <p className="text-xs text-gray-600">Meet with performers/speakers</p>
                          </div>
                          <Switch
                            checked={ticket.meetAndGreet}
                            onCheckedChange={(checked) => handleTicketChange(index, "meetAndGreet", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Priority Access</Label>
                            <p className="text-xs text-gray-600">Skip regular queues</p>
                          </div>
                          <Switch
                            checked={ticket.priorityAccess}
                            onCheckedChange={(checked) => handleTicketChange(index, "priorityAccess", checked)}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Gift Bag</Label>
                            <p className="text-xs text-gray-600">Exclusive event gift bag</p>
                          </div>
                          <Switch
                            checked={ticket.giftBag}
                            onCheckedChange={(checked) => handleTicketChange(index, "giftBag", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Certificate</Label>
                            <p className="text-xs text-gray-600">Attendance certificate</p>
                          </div>
                          <Switch
                            checked={ticket.certificateIncluded}
                            onCheckedChange={(checked) => handleTicketChange(index, "certificateIncluded", checked)}
                          />
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                          <Label htmlFor={`drinks-${index}`} className="text-sm font-medium">
                            Complimentary Drinks
                          </Label>
                          <p className="text-xs text-gray-600 mb-2">Number of free drinks included</p>
                          <Input
                            id={`drinks-${index}`}
                            type="number"
                            min="0"
                            max="10"
                            value={ticket.complimentaryDrinks}
                            onChange={(e) =>
                              handleTicketChange(index, "complimentaryDrinks", Number.parseInt(e.target.value) || 0)
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom Benefits */}
                    <div>
                      <Label className="text-base font-semibold">Custom Benefits</Label>
                      <p className="text-sm text-gray-600 mb-3">Add custom benefits specific to this ticket type</p>
                      <div className="space-y-3">
                        {ticket.benefits.map((benefit, benefitIndex) => (
                          <Card key={benefit.id} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-sm">Category</Label>
                                <Select
                                  value={benefit.category}
                                  onValueChange={(value) => updateBenefit(index, benefitIndex, "category", value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {benefitCategories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-sm">Title</Label>
                                <Input
                                  value={benefit.title}
                                  onChange={(e) => updateBenefit(index, benefitIndex, "title", e.target.value)}
                                  placeholder="Benefit title"
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <Label className="text-sm">Description</Label>
                                  <Input
                                    value={benefit.description}
                                    onChange={(e) => updateBenefit(index, benefitIndex, "description", e.target.value)}
                                    placeholder="Benefit description"
                                    className="mt-1"
                                  />
                                </div>
                                <Button variant="outline" size="sm" onClick={() => removeBenefit(index, benefitIndex)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBenefit(index)}
                          className="w-full border-dashed bg-transparent"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Benefit
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
              <h2 className="text-2xl font-bold text-gray-900">Pricing & Discount Tiers</h2>
              <p className="text-gray-600">Set pricing, availability, and discount tiers for your tickets</p>
            </div>

            <div className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">
                      {ticket.name === "custom" ? ticket.customName : ticket.name || `Ticket Type ${index + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`price-${index}`}>Base Price *</Label>
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

                    {/* Sale Period */}
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

                    {/* Discount Tiers */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Label className="text-base font-semibold">Discount Tiers</Label>
                          <p className="text-sm text-gray-600">
                            Create time-based discounts (e.g., Early Bird, Last Minute)
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addDiscountTier(index)}
                          className="bg-transparent"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Discount
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {ticket.discountTiers.map((discount, discountIndex) => (
                          <Card key={discount.id} className="p-4 border-dashed">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                              <div>
                                <Label className="text-sm">Discount Name</Label>
                                <Input
                                  value={discount.name}
                                  onChange={(e) => updateDiscountTier(index, discountIndex, "name", e.target.value)}
                                  placeholder="e.g., Early Bird"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Percentage (%)</Label>
                                <div className="flex items-center gap-1 mt-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discount.percentage}
                                    onChange={(e) =>
                                      updateDiscountTier(
                                        index,
                                        discountIndex,
                                        "percentage",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className={`${
                                      errors[`ticket-${index}-discount-${discountIndex}-percentage`]
                                        ? "border-red-500"
                                        : ""
                                    }`}
                                  />
                                  <Percent className="h-4 w-4 text-gray-400" />
                                </div>
                                {errors[`ticket-${index}-discount-${discountIndex}-percentage`] && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {errors[`ticket-${index}-discount-${discountIndex}-percentage`]}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label className="text-sm">Start Date</Label>
                                <Input
                                  type="date"
                                  value={discount.startDate}
                                  onChange={(e) =>
                                    updateDiscountTier(index, discountIndex, "startDate", e.target.value)
                                  }
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">End Date</Label>
                                <Input
                                  type="date"
                                  value={discount.endDate}
                                  onChange={(e) => updateDiscountTier(index, discountIndex, "endDate", e.target.value)}
                                  className={`mt-1 ${
                                    errors[`ticket-${index}-discount-${discountIndex}-endDate`] ? "border-red-500" : ""
                                  }`}
                                />
                                {errors[`ticket-${index}-discount-${discountIndex}-endDate`] && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {errors[`ticket-${index}-discount-${discountIndex}-endDate`]}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDiscountTier(index, discountIndex)}
                                  className="w-full bg-transparent"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Label className="text-sm">Description</Label>
                              <Input
                                value={discount.description}
                                onChange={(e) =>
                                  updateDiscountTier(index, discountIndex, "description", e.target.value)
                                }
                                placeholder="Brief description of this discount"
                                className="mt-1"
                              />
                            </div>
                            {discount.percentage > 0 && ticket.price > 0 && (
                              <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                                <span className="text-green-700 font-medium">
                                  Discounted Price: {currencies.find((c) => c.code === ticket.currency)?.symbol}
                                  {(ticket.price * (1 - discount.percentage / 100)).toFixed(2)}
                                </span>
                                <span className="text-green-600 ml-2">
                                  (Save {currencies.find((c) => c.code === ticket.currency)?.symbol}
                                  {(ticket.price * (discount.percentage / 100)).toFixed(2)})
                                </span>
                              </div>
                            )}
                          </Card>
                        ))}
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
                    <CardTitle className="text-lg">
                      {ticket.name === "custom" ? ticket.customName : ticket.name || `Ticket Type ${index + 1}`}
                    </CardTitle>
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
                        <h3 className="text-xl font-bold">
                          {ticket.name === "custom" ? ticket.customName : ticket.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{ticket.category.replace(/_/g, " ")}</Badge>
                          <Badge variant="outline">{ticket.accessLevel}</Badge>
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

                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Event Date:</span>
                          <span className="font-medium">{new Date(ticket.eventDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Time:</span>
                          <span className="font-medium">
                            {ticket.startTime} - {ticket.endTime}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Available Quantity:</span>
                          <span className="font-medium">{ticket.quantity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Max Per Person:</span>
                          <span className="font-medium">{ticket.maxPerPerson}</span>
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
                          <span className="text-gray-500">Age Restriction:</span>
                          <span className="font-medium">{ticket.ageRestriction.replace(/_/g, " ")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Currency:</span>
                          <span className="font-medium">{ticket.currency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Discount Tiers */}
                    {ticket.discountTiers.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Discount Tiers:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {ticket.discountTiers.map((discount) => (
                            <div key={discount.id} className="p-2 bg-yellow-50 rounded border">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">{discount.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {discount.percentage}% OFF
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {new Date(discount.startDate).toLocaleDateString()} -{" "}
                                {new Date(discount.endDate).toLocaleDateString()}
                              </div>
                              {discount.description && (
                                <p className="text-xs text-gray-600 mt-1">{discount.description}</p>
                              )}
                              <div className="text-xs text-green-600 font-medium mt-1">
                                Price: {currencies.find((c) => c.code === ticket.currency)?.symbol}
                                {(ticket.price * (1 - discount.percentage / 100)).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Included Guests */}
                    {ticket.includedGuests.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Included Guests & Entertainers:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {ticket.includedGuests.map((guest) => (
                            <div key={guest.id} className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded">
                              <Users className="h-3 w-3 text-blue-500" />
                              <span className="font-medium">{guest.name}</span>
                              <span className="text-blue-600">({guest.role})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefits Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Meals */}
                      {ticket.includedMeals.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Utensils className="h-4 w-4" />
                            Included Meals:
                          </h4>
                          <ul className="space-y-1">
                            {ticket.includedMeals.map((meal) => (
                              <li key={meal} className="flex items-center gap-2 text-sm">
                                <Check className="h-3 w-3 text-green-500" />
                                <span>{meal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Merchandise */}
                      {ticket.merchandiseIncluded.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            Included Merchandise:
                          </h4>
                          <ul className="space-y-1">
                            {ticket.merchandiseIncluded.map((item) => (
                              <li key={item} className="flex items-center gap-2 text-sm">
                                <Check className="h-3 w-3 text-green-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Exclusive Areas */}
                    {ticket.exclusiveAreas.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Exclusive Area Access:
                        </h4>
                        <div className="flex flex-wrap gap-2">
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
                        <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <Car className="h-3 w-3 text-green-500" />
                          <span>Free Parking</span>
                        </div>
                      )}
                      {ticket.meetAndGreet && (
                        <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <Users className="h-3 w-3 text-green-500" />
                          <span>Meet & Greet</span>
                        </div>
                      )}
                      {ticket.priorityAccess && (
                        <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <Star className="h-3 w-3 text-green-500" />
                          <span>Priority Access</span>
                        </div>
                      )}
                      {ticket.giftBag && (
                        <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <Gift className="h-3 w-3 text-green-500" />
                          <span>Gift Bag</span>
                        </div>
                      )}
                      {ticket.certificateIncluded && (
                        <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Certificate</span>
                        </div>
                      )}
                      {ticket.complimentaryDrinks > 0 && (
                        <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <Utensils className="h-3 w-3 text-green-500" />
                          <span>{ticket.complimentaryDrinks} Free Drinks</span>
                        </div>
                      )}
                    </div>

                    {/* Custom Benefits */}
                    {ticket.benefits.filter((b) => b.title.trim()).length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Custom Benefits:</h4>
                        <ul className="space-y-1">
                          {ticket.benefits
                            .filter((b) => b.title.trim())
                            .map((benefit) => (
                              <li key={benefit.id} className="flex items-center gap-2 text-sm">
                                <Check className="h-3 w-3 text-green-500" />
                                <span className="font-medium">{benefit.title}</span>
                                {benefit.description && <span className="text-gray-600">- {benefit.description}</span>}
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
          <p className="text-gray-600">Set up comprehensive ticket types with detailed benefits for your event</p>
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
                        <span>{eventData.bookingDates.length} days</span>
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
                      ? "bg-green-500 border-green-500 text-white"
                      : id < currentStep
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 text-gray-500"
                  }`}
                >
                  {id < currentStep ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    id === currentStep ? "text-green-600" : id < currentStep ? "text-green-600" : "text-gray-500"
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
            <Button onClick={nextStep} className="bg-green-600 hover:bg-green-700">
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
