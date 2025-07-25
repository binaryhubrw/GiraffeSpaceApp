"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Users,
  User,
  Phone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  Calendar as CalendarIcon,
  Volume2,
  Wifi,
  Wind,
  CheckCircle,
  Navigation,
  Info,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner"

// Inline Badge component
const Badge = ({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode
  className?: string
  variant?: "default" | "secondary" | "destructive" | "outline"
}) => {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
  const variantClasses = {
    default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "text-gray-900 border-gray-300",
  }

  return <div className={cn(baseClasses, variantClasses[variant], className)}>{children}</div>
}

interface Amenity {
  id: string
  resourceName: string
  quantity: number
  amenitiesDescription: string
  costPerUnit: string
}

interface BookingCondition {
  id: string
  descriptionCondition: string
  notaBene: string
  transitionTime: number
  depositRequiredPercent: number
  paymentComplementTimeBeforeEvent: number
}

interface AvailabilitySlot {
  id: string
  date: string
  bookedHours: string[] | null
  isAvailable: boolean
  availableHours?: string[]
}

interface VenueData {
  venueId: string
  venueName: string
  description: string
  capacity: number
  venueLocation: string
  latitude: number
  longitude: number
  googleMapsLink: string
  mainPhotoUrl: string
  photoGallery: string[]
  virtualTourUrl: string | null
  status: string
  bookingType: string
  availabilitySlots: AvailabilitySlot[]
  organization: {
    organizationId: string
    organizationName: string
    description?: string
    contactEmail: string
    contactPhone: string
    address: string
    organizationType?: string // Added for new UI
  }
  manager: {
    userId: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    profilePictureURL: string | null
  }
  bookingConditions: BookingCondition[]
  amenities: Amenity[]
  venueDocuments: string
}

interface Comment {
  id: string
  userName: string
  userEmail: string
  content: string
  rating: number
  date: string
}

export default function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [venue, setVenue] = useState<VenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  // Start with Availability tab as default
  const [activeTab, setActiveTab] = useState("Availability")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string[] }>({})
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [bookedDates, setBookedDates] = useState<Date[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [showTimePopup, setShowTimePopup] = useState<{ isOpen: boolean; date: Date | null }>({
    isOpen: false,
    date: null
  })
  const { isLoggedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Generate time slots for hourly bookings (8 AM to 10 PM)
  const generateTimeSlots = (): string[] => {
    const slots: string[] = []
    for (let hour = 8; hour < 22; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`)
    }
    return slots
  }

  // Comment form state
  const [newComment, setNewComment] = useState({
    userName: "",
    userEmail: "",
    content: "",
    rating: 0,
  })

  // Mock comments data matching the images
  const [userComments, setUserComments] = useState<Comment[]>([
    {
      id: "1",
      userName: "Alice Johnson",
      userEmail: "alice@example.com",
      content: "Great venue! Spacious and clean. Perfect for our corporate event.",
      rating: 5,
      date: "2025-01-15",
    },
    {
      id: "2",
      userName: "Bob Smith",
      userEmail: "bob@example.com",
      content: "The staff was very helpful and the location is perfect.",
      rating: 4,
      date: "2025-01-10",
    },
    {
      id: "3",
      userName: "Carol Lee",
      userEmail: "carol@example.com",
      content: "Amazing facilities and great customer service!",
      rating: 5,
      date: "2025-01-05",
    },
  ])

  useEffect(() => {
    setMounted(true);
    const fetchVenue = async () => {
      try {
        setLoading(true)
        // Using the public venues endpoint
        const response = await fetch(`https://giraffespacev2.onrender.com/api/v1/venue/public/${id}`)
        const data = await response.json()

        if (data.success) {
          const venueData = data.data
          setVenue(venueData)
          
          // Set availability slots
          if (venueData.availabilitySlots && venueData.availabilitySlots.length > 0) {
            setAvailabilitySlots(venueData.availabilitySlots.map((slot: AvailabilitySlot) => ({
              ...slot,
              // Generate available hours by filtering out booked hours
              availableHours: generateTimeSlots().filter(time => 
                !slot.bookedHours?.includes(time)
              )
            })))
          }
        } else {
          setError("Failed to fetch venue details")
        }
      } catch (error) {
        console.error("Error fetching venue:", error)
        setError("Failed to fetch venue details")
      } finally {
        setLoading(false)
      }
    }

    fetchVenue()
  }, [id])

  const nextPhoto = () => {
    if (!venue) return
    const photos = [venue.mainPhotoUrl, ...venue.photoGallery].filter(Boolean)
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    if (!venue) return
    const photos = [venue.mainPhotoUrl, ...venue.photoGallery].filter(Boolean)
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newComment.rating === 0) {
      alert("Please select a rating")
      return
    }

    const comment: Comment = {
      id: Date.now().toString(),
      ...newComment,
      date: new Date().toISOString().split("T")[0],
    }

    setUserComments((prev) => [comment, ...prev])
    setNewComment({
      userName: "",
      userEmail: "",
      content: "",
      rating: 0,
    })
  }

  // Book Now logic: require date selection
  const handleBookingClick = () => {
    if (!mounted) return;
    if (!selectedDates.length) {
      toast.error("Please select a date to continue.");
      return;
    }
    const selectedDate = selectedDates[0].toISOString().split("T")[0];
    if (isLoggedIn) {
      router.push(`/venues/book?venueId=${venue?.venueId}&date=${selectedDate}`);
    } else {
      router.push("/login");
    }
  }

  const averageRating =
    userComments.length > 0 ? userComments.reduce((sum, comment) => sum + comment.rating, 0) / userComments.length : 0

  // Get amenity icon
  const getAmenityIcon = (name: string) => {
    const iconName = name.toLowerCase()
    if (iconName.includes("sound") || iconName.includes("audio")) return <Volume2 className="h-5 w-5 text-green-600" />
    if (iconName.includes("wifi") || iconName.includes("internet")) return <Wifi className="h-5 w-5 text-purple-600" />
    if (iconName.includes("air") || iconName.includes("conditioning")) return <Wind className="h-5 w-5 text-cyan-600" />
    return <CheckCircle className="h-5 w-5 text-gray-600" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading venue details...</p>
        </div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Venue Not Found</h1>
          <p className="text-gray-600 mb-4">The venue you're looking for doesn't exist.</p>
          <Link href="/venues">
            <Button>Back to Venues</Button>
          </Link>
        </div>
      </div>
    )
  }

  const photos = [venue.mainPhotoUrl, ...venue.photoGallery].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activePage="venues" />

      {/* Back Button Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Link href="/venues" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venues
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Photo Gallery */}
            <div className="relative h-[400px] mb-4 rounded-lg overflow-hidden bg-gray-200">
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="default">{venue?.bookingType}</Badge>
              </div>
              {venue && (
                <Image
                  src={venue.mainPhotoUrl || "/placeholder.svg"}
                  alt={venue.venueName}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              {venue?.photoGallery?.length > 0 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded">
                    {currentPhotoIndex + 1} / {[venue.mainPhotoUrl, ...venue.photoGallery].length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`relative w-20 h-14 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${currentPhotoIndex === index ? "border-blue-500" : "border-transparent hover:border-gray-300"
                      }`}
                  >
                    <Image
                      src={photo || "/placeholder.svg?height=56&width=80&text=Photo"}
                      alt={`View ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Venue Title and Basic Info */}
            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <h1 className="text-3xl font-bold mb-4 text-gray-900">{venue?.venueName}</h1>
              <p className="text-gray-600 mb-6 leading-relaxed">{venue?.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Location</p>
                    <p className="font-medium text-gray-900">{venue?.venueLocation}</p>
                    {venue?.googleMapsLink && (
                      <a
                        href={venue.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center mt-1 transition-colors"
                      >
                        View on Google Maps
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Capacity</p>
                    <p className="font-medium text-gray-900">{venue?.capacity} people</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Contact Person</p>
                    <p className="font-medium text-gray-900">
                      {venue?.manager.firstName} {venue?.manager.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{venue?.manager.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Phone</p>
                    <p className="font-medium text-gray-900">{venue?.manager.phoneNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b px-6">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab("Details")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "Details"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("Availability")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "Availability"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Availability
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === "Details" ? (
                  <div className="space-y-8">
                    {/* About This Venue */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">About This Venue</h2>
                      <p className="text-gray-600 leading-relaxed">{venue?.description}</p>
                    </div>

                    {/* Venue Location */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">Location</h2>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-start space-x-3">
                            <MapPin className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-500 font-medium">Address</p>
                              <p className="font-medium text-gray-900">{venue?.venueLocation}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Navigation className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-500 font-medium">Coordinates</p>
                              <p className="font-medium text-gray-900">
                                {venue?.latitude}, {venue?.longitude}
                              </p>
                            </div>
                          </div>
                          <a
                            href={venue?.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            View on Google Maps
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">Amenities</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {venue?.amenities.map((amenity) => (
                          <div key={amenity.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900">{amenity.resourceName}</h3>
                                <p className="text-sm text-gray-600 mt-1">{amenity.amenitiesDescription}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">Qty: {amenity.quantity}</p>
                                <p className="text-sm text-green-600 font-medium">${amenity.costPerUnit}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Booking Conditions */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">Booking Conditions</h2>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-blue-900 font-medium">Important Booking Information</p>
                            <p className="text-sm text-blue-800 mt-1">
                              To secure your booking, a deposit of <span className="font-semibold">
                                {venue?.bookingConditions[0]?.depositRequiredPercent ?? "N/A"}%
                              </span> is required. The remaining payment is due{" "}
                              <span className="font-semibold">
                                {venue?.bookingConditions[0]?.paymentComplementTimeBeforeEvent ?? "N/A"}{" "}
                                {venue?.bookingType === "DAILY" ? "days" : "hours"}
                              </span>{" "}
                              before the event. Please review all conditions carefully before proceeding.
                            </p>

                          </div>
                        </div>
                      </div>
                      {venue?.bookingConditions.map((condition) => (
                        <div key={condition.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                          <h3 className="font-medium text-gray-900 mb-2">{condition.descriptionCondition}</h3>
                          <p className="text-gray-600 mb-4">{condition.notaBene}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Deposit Required</p>
                              <p className="font-medium text-gray-900">{condition.depositRequiredPercent}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Payment Due</p>
                              <p className="font-medium text-gray-900">
                                {condition.paymentComplementTimeBeforeEvent} {venue?.bookingType === 'DAILY' ? 'days' : 'hours'} before
                              </p>
                            </div>
                            {/* <div>
                              <p className="text-gray-500">Transition Time</p>
                              <p className="font-medium text-gray-900">{condition.transitionTime} minutes</p>
                            </div> */}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Virtual Tour */}
                    {venue?.virtualTourUrl && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900">Virtual Tour</h2>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="relative h-[400px] rounded-lg overflow-hidden bg-black">
                            <video
                              src={venue.virtualTourUrl}
                              controls
                              className="w-full h-full"
                              preload="metadata"
                              poster="/placeholder.svg"
                              playsInline
                            >
                              <source src={venue.virtualTourUrl} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm text-gray-600">
                              Take a virtual tour of {venue.venueName}. This video provides a comprehensive view of the venue's layout and facilities.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Organization Information */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">Organization Information</h2>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-lg text-gray-900 mb-2">{venue?.organization.organizationName}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Contact Email</p>
                            <p className="font-medium text-gray-900">{venue?.organization.contactEmail}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Contact Phone</p>
                            <p className="font-medium text-gray-900">{venue?.organization.contactPhone}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Address</p>
                            <p className="font-medium text-gray-900">{venue?.organization.address}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Organization Type</p>
                            <p className="font-medium text-gray-900">{venue?.organization.organizationType}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manager Information */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">Venue Manager</h2>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-lg text-gray-900 mb-2">
                          {venue?.manager.firstName} {venue?.manager.lastName}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{venue?.manager.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">{venue?.manager.phoneNumber}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">Venue Availability</h3>
                      <p className="text-gray-600">Select a date to book this venue</p>
                    </div>

                    {/* Custom Calendar with enhanced styling */}
                    <div className="mb-6">
                      <Calendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={(dates) => dates ? setSelectedDates(dates) : setSelectedDates([])}
                        numberOfMonths={2}
                        disabled={(date) => {
                          // Disable past dates
                          const isPastDate = date < new Date()
                          
                          // Check if date is in availability slots and not available
                          const dateString = date.toISOString().split('T')[0]
                          const slotForDate = availabilitySlots.find(slot => slot.date === dateString)
                          const isNotAvailable = slotForDate ? !slotForDate.isAvailable : false

                          return isPastDate || isNotAvailable
                        }}
                        className="rounded-lg border"
                        classNames={{
                          day_today: "bg-blue-500 text-white rounded-full font-bold",
                          day_selected: "bg-black text-white rounded-full font-bold hover:bg-black hover:text-white",
                          day: "h-9 w-9 p-0 font-normal rounded-full aria-selected:opacity-100 hover:bg-gray-100 hover:rounded-full relative",
                          day_disabled: "text-gray-400 hover:bg-transparent hover:text-gray-400 rounded-full [&:has([aria-label*='booked'])]:after:content-[''] [&:has([aria-label*='booked'])]:after:absolute [&:has([aria-label*='booked'])]:after:left-1/2 [&:has([aria-label*='booked'])]:after:top-1/2 [&:has([aria-label*='booked'])]:after:w-4 [&:has([aria-label*='booked'])]:after:h-0.5 [&:has([aria-label*='booked'])]:after:bg-red-400 [&:has([aria-label*='booked'])]:after:-translate-x-1/2 [&:has([aria-label*='booked'])]:after:-translate-y-1/2 [&:has([aria-label*='booked'])]:after:rotate-45",
                          cell: "h-9 w-9 text-center text-sm relative p-0 hover:bg-gray-100 hover:rounded-full focus-within:relative focus-within:z-20",
                        }}
                      />
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-100 rounded-full mr-2"></div>
                          <span>Available</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-100 rounded-full mr-2"></div>
                          <span>Fully Booked</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-100 rounded-full mr-2"></div>
                          <span>Past Dates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Booking Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Book This Venue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-3 font-medium">Selected Dates</p>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Booking Dates & Times</p>
                      {selectedDates.length > 0 ? (
                        <div className="space-y-4">
                          {selectedDates.map((date) => (
                            <div key={date.toISOString()} className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium text-sm text-gray-900 mb-2">
                                {date.toLocaleDateString()}
                              </p>
                              {venue?.bookingType === "HOURLY" && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => setShowTimePopup({ isOpen: true, date })}
                                    className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                  >
                                    Select Hours
                                  </button>
                                  {selectedTimes[date.toISOString()]?.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-500 mb-1">Selected Hours:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {selectedTimes[date.toISOString()].map((time) => (
                                          <span
                                            key={time}
                                            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs"
                                          >
                                            {time}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTimes(prev => ({
                                                  ...prev,
                                                  [date.toISOString()]: prev[date.toISOString()].filter(t => t !== time)
                                                }))
                                              }}
                                              className="ml-1 text-blue-600 hover:text-blue-800"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="font-medium text-gray-500">No dates selected</p>
                      )}
                    </div>
                  </div>

                  <Button onClick={handleBookingClick} className="w-full" disabled={!mounted || !selectedDates.length}>
                    {isLoggedIn ? "Book Now" : "Book Now - Continue to Login"}
                  </Button>

                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    By clicking above button, you'll be redirected to{" "}
                    {isLoggedIn ? "the booking form" : "login or make an account if you don't have an account"}.
                  </p>
                </CardContent>
              </Card>

              {/* Rating & Comments */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-gray-900">
                    <span>Venue Rating & Comments</span>
                    {averageRating > 0 && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm font-medium">{averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Comments List */}
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                    {userComments.length > 0 ? (
                      userComments.map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{comment.userName}</p>
                              <p className="text-xs text-gray-500">{comment.userEmail}</p>
                            </div>
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < comment.rating ? "fill-current" : ""}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{comment.content}</p>
                          <hr className="border-gray-100" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">No ratings yet</div>
                    )}
                  </div>

                  {/* Comment Form */}
                  <div>
                    <h4 className="font-medium mb-4 text-gray-900">Rate & Comment</h4>
                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900">Your Rating *</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewComment((prev) => ({ ...prev, rating: star }))}
                              className={`text-2xl transition-colors ${newComment.rating >= star ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"
                                }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Your Name *</label>
                        <Input
                          type="text"
                          value={newComment.userName}
                          onChange={(e) => setNewComment((prev) => ({ ...prev, userName: e.target.value }))}
                          placeholder="Enter your name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Your Email *</label>
                        <Input
                          type="email"
                          value={newComment.userEmail}
                          onChange={(e) => setNewComment((prev) => ({ ...prev, userEmail: e.target.value }))}
                          placeholder="Enter your email"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Your Comment *</label>
                        <Textarea
                          value={newComment.content}
                          onChange={(e) => setNewComment((prev) => ({ ...prev, content: e.target.value }))}
                          placeholder="Share your experience with this venue..."
                          rows={4}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        Submit Comment
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Book Now Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleBookingClick}
          className="px-8 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg text-base font-medium"
          disabled={!mounted || !selectedDates.length}
        >
          {isLoggedIn ? "Book Now" : "Book Now"}
        </Button>
      </div>

      {/* Add padding-bottom to account for fixed button */}
      <div className="pb-20"></div>

      {/* Time Selection Popup */}
      {showTimePopup.isOpen && showTimePopup.date && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Select Hours for {showTimePopup.date.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowTimePopup({ isOpen: false, date: null })}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {generateTimeSlots().map((timeSlot) => {
                const date = showTimePopup.date
                if (!date) return null
                
                const dateStr = date.toISOString()
                const dateOnlyStr = dateStr.split('T')[0]
                const slotForDate = availabilitySlots.find(slot => slot.date === dateOnlyStr)
                const isBooked = slotForDate?.bookedHours?.includes(timeSlot)
                const isSelected = selectedTimes[dateStr]?.includes(timeSlot)

                return (
                  <button
                    key={timeSlot}
                    onClick={() => {
                      if (!isBooked && date) {
                        const dateStr = date.toISOString()
                        setSelectedTimes(prev => {
                          const currentTimes = prev[dateStr] || []
                          const newTimes = currentTimes.includes(timeSlot)
                            ? currentTimes.filter(t => t !== timeSlot)
                            : [...currentTimes, timeSlot].sort()
                          
                          return {
                            ...prev,
                            [dateStr]: newTimes
                          }
                        })
                      }
                    }}
                    disabled={isBooked}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : isBooked
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {timeSlot}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowTimePopup({ isOpen: false, date: null })}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
