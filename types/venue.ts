export interface Amenity {
  id: string
  resourceName: string
  quantity: number
  amenitiesDescription: string
  costPerUnit: string
}

export interface BookingCondition {
  id: string
  descriptionCondition: string
  notaBene: string
  transitionTime: number
  depositRequiredPercent: number
  paymentComplementTimeBeforeEvent: number
}

export interface AvailabilitySlot {
  id: string
  date: string
  bookedHours: string[] | null
  isAvailable: boolean
  availableHours?: string[]
}

export interface VenueData {
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

export interface Comment {
  id: string
  userName: string
  userEmail: string
  content: string
  rating: number
  date: string
} 