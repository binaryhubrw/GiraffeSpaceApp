import type React from "react"
// Removed useState, useEffect as they are client-side hooks.
// import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
// Removed useRouter as it's a client-side hook.
// import { useRouter } from "next/navigation"
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
  CalendarIcon,
  Volume2,
  Wifi,
  Wind,
  CheckCircle,
  Navigation,
  Info,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"
// Removed useAuth as it's a client-side hook.
// import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
// Removed use as it's a React hook typically for client components.
// import { use } from "react"
import ApiService from "@/api/apiConfig"
// Updated import path for VenueData
import { VenueData } from "@/types/venue"
import VenueDetailsClient from "./VenueDetailsClient"

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

// Removed interfaces that are now in types/venue.ts
// interface Amenity {
//   id: string
//   resourceName: string
//   quantity: number
//   amenitiesDescription: string
//   costPerUnit: string
// }

// interface BookingCondition {
//   id: string
//   descriptionCondition: string
//   notaBene: string
//   transitionTime: number
//   depositRequiredPercent: number
//   paymentComplementTimeBeforeEvent: number
// }

// interface AvailabilitySlot {
//   id: string
//   date: string
//   bookedHours: string[] | null
//   isAvailable: boolean
//   availableHours?: string[]
// }

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
  bookingType: "DAILY" | "HOURLY" // Explicitly define booking types
  availabilitySlots: AvailabilitySlot[]
  organization: {
    organizationId: string
    organizationName: string
    description?: string
    contactEmail: string
    contactPhone: string
    address: string
    organizationType?: string
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
  const [activeTab, setActiveTab] = useState("Availability")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string[] }>({})
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  // New states for date statuses
  const [fullyBookedDates, setFullyBookedDates] = useState<Date[]>([])
  const [partiallyBookedDates, setPartiallyBookedDates] = useState<Date[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [showTimePopup, setShowTimePopup] = useState<{ isOpen: boolean; date: Date | null }>({
    isOpen: false,
    date: null,
  })
  const { isLoggedIn } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date()) // State to control the displayed month

  // Create photos array from venue data
  const photos = venue ? [venue.mainPhotoUrl, ...venue.photoGallery].filter(Boolean) : []

  // Generate time slots for hourly bookings (8 AM to 10 PM)
  const generateTimeSlots = (): string[] => {
    const slots: string[] = []
    for (let hour = 8; hour < 22; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`)
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
    setMounted(true)
    const fetchVenue = async () => {
      try {
        setLoading(true)
        const response = await fetch(`https://giraffespacev2.onrender.com/api/v1/venue/public/${id}`)
        const data = await response.json()

        if (data.success) {
          const venueData: VenueData = data.data
          setVenue(venueData)

          if (venueData.availabilitySlots && venueData.availabilitySlots.length > 0) {
            const allPossibleHours = generateTimeSlots()

            const updatedSlots = venueData.availabilitySlots.map((slot: AvailabilitySlot) => {
              const availableHoursForSlot = allPossibleHours.filter((time) => !slot.bookedHours?.includes(time))
              return {
                ...slot,
                availableHours: availableHoursForSlot,
              }
            })
            setAvailabilitySlots(updatedSlots)

            const newFullyBookedDates: Date[] = []
            const newPartiallyBookedDates: Date[] = []

            updatedSlots.forEach((slot: AvailabilitySlot) => {
              const dateObj = new Date(slot.date)
              dateObj.setHours(0, 0, 0, 0) // Normalize date for comparison

              if (venueData.bookingType === "DAILY") {
                if (!slot.isAvailable) {
                  newFullyBookedDates.push(dateObj)
                }
                // No partial booking for DAILY type
              } else if (venueData.bookingType === "HOURLY") {
                if (!slot.isAvailable || slot.availableHours?.length === 0) {
                  newFullyBookedDates.push(dateObj)
                } else if (slot.bookedHours && slot.bookedHours.length > 0) {
                  newPartiallyBookedDates.push(dateObj)
                }
              }
            })
            setFullyBookedDates(newFullyBookedDates)
            setPartiallyBookedDates(newPartiallyBookedDates)
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
    if (photos.length === 0) return
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    if (photos.length === 0) return
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.rating === 0) {
      toast.error("Please select a rating")
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

  const handleBookingClick = () => {
    if (!mounted) return
    if (!selectedDates.length) {
      toast.error("Please select a date to continue.")
      return
    }
    // Use timezone-safe date formatting to avoid UTC conversion issues
    // Format all selected dates
    const formattedDates = selectedDates.map(date => 
      date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0')
    ).join(',')
    
    if (isLoggedIn) {
      router.push(`/venues/book?venueId=${venue?.venueId}&date=${formattedDates}`)
    } else {
      router.push("/login")
    }
  }

  const averageRating =
    userComments.length > 0 ? userComments.reduce((sum, comment) => sum + comment.rating, 0) / userComments.length : 0

  const getAmenityIcon = (name: string) => {
    const iconName = name.toLowerCase()
    if (iconName.includes("sound") || iconName.includes("audio")) return <Volume2 className="h-5 w-5 text-green-600" />
    if (iconName.includes("wifi") || iconName.includes("internet")) return <Wifi className="h-5 w-5 text-purple-600" />
    if (iconName.includes("air") || iconName.includes("conditioning")) return <Wind className="h-5 w-5 text-cyan-600" />
    return <CheckCircle className="h-5 w-5 text-gray-600" />
  }

  // Handlers for external month navigation
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      newMonth.setMonth(newMonth.getMonth() - 1)
      return newMonth
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      newMonth.setMonth(newMonth.getMonth() + 1)
      return newMonth
    })
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
          <p className="text-gray-600 mb-4">The venue you\'re looking for doesn\'t exist.</p>
          <Link href="/venues">
            <Button>Back to Venues</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <VenueDetailsClient venue={venue} />
}
