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

// interface VenueData {
//   venueId: string
//   venueName: string
//   description: string
//   capacity: number
//   venueLocation: string
//   latitude: number
//   longitude: number
//   googleMapsLink: string
//   mainPhotoUrl: string
//   photoGallery: string[]
//   virtualTourUrl: string | null
//   status: string
//   bookingType: "DAILY" | "HOURLY" // Explicitly define booking types
//   availabilitySlots: AvailabilitySlot[]
//   organization: {
//     organizationId: string
//     organizationName: string
//     description?: string
//     contactEmail: string
//     contactPhone: string
//     address: string
//     organizationType?: string
//   }
//   manager: {
//     userId: string
//     firstName: string
//     lastName: string
//     email: string
//     phoneNumber: string
//     profilePictureURL: string | null
//   }
//   bookingConditions: BookingCondition[]
//   amenities: Amenity[]
//   venueDocuments: string
// }

// interface Comment {
//   id: string
//   userName: string
//   userEmail: string
//   content: string
//   rating: number
//   date: string
// }

// getStaticPaths is renamed to generateStaticParams for App Router
export async function generateStaticParams() {
  const response = await ApiService.getAllVenues()
  const venues: VenueData[] = response.data.venues
  return venues.map((venue) => ({
    id: venue.venueId,
  }))
}

// getStaticProps is replaced by fetching directly in the component for App Router
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
  const response = await ApiService.getVenueById(id);
  const venue: VenueData = response.data;

  if (!venue) {
    return {
      title: "Venue Not Found",
    };
  }

  return {
    title: venue.venueName,
    description: venue.description,
    openGraph: {
      images: [venue.mainPhotoUrl],
    },
  };
}

export default async function VenuePage({ params }: { params: { id: string } }) {
  const { id } = params
  const response = await ApiService.getVenueById(id)
  const venue: VenueData = response.data

  if (!venue) {
    // This will trigger the closest not-found.tsx or error.tsx
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
