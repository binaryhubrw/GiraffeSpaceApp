"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Users, ChevronDown, Search, Calendar } from "lucide-react"
import { Header } from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/button"
import { useSearchParams } from 'next/navigation'
import ApiService from "@/api/apiConfig"
import { useAuth } from "@/contexts/auth-context"
import { API_BASE_URL } from "@/lib/config"

interface Amenity {
  id: string;
  resourceName: string;
  quantity: number;
  amenitiesDescription: string;
  costPerUnit: string;
}

interface Organization {
  organizationId: string;
  organizationName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  organizationType: string;
  status: string;
}

interface VenueData {
  venueId: string;
  venueName: string;
  description: string;
  capacity: number;
  venueLocation: string;
  mainPhotoUrl: string;
  status: string;
  bookingType: string;
  organization: Organization;
  amenities: Amenity[];
}

export default function VenuesPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')
  const { isLoggedIn } = useAuth()
  
  const [isCapacityOpen, setIsCapacityOpen] = useState(false)
  const [selectedCapacity, setSelectedCapacity] = useState<string>("Any capacity")
  const [searchTerm, setSearchTerm] = useState("")
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState<string>("") // New state for organization search
  const [isLoaded, setIsLoaded] = useState(false)
  const [venues, setVenues] = useState<VenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true)
        let data;
        
        if (organizationId) {
          if (!isLoggedIn) {
            setError('Please log in to view organization venues')
            setVenues([])
            return
          }
          
          const response = await ApiService.getVenueByOrganizationId(organizationId)
          if (response.success) {
            setVenues(response.data || [])
          } else {
            setError('Failed to fetch organization venues')
          }
        } else {
          const response = await fetch(`${API_BASE_URL}/venue/public-venues/list`)
          data = await response.json()
          if (data.success) {
            setVenues(data.data || [])
          } else {
            setError('Failed to fetch venues')
          }
        }
      } catch (error: any) {
        console.error('Error fetching venues:', error)
        if (error?.response?.status === 401) {
          setError('Please log in to view organization venues')
        } else {
          setError('Failed to fetch venues')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchVenues()
  }, [organizationId, isLoggedIn])

  const capacityOptions = [
    "Any capacity",
    "Up to 50 people",
    "50-100 people",
    "100-200 people",
    "200-500 people",
    "500+ people",
  ]

  const handleCapacitySelect = (capacity: string) => {
    setSelectedCapacity(capacity)
    setIsCapacityOpen(false)
  }

  // const formatDate = (dateString: string) => {
  //   if (!dateString) return "Select date"

  //   const date = new Date(dateString)
  //   return date.toLocaleDateString("en-US", {
  //     month: "short",
  //     day: "numeric",
  //     year: "numeric",
  //   })
  // }

  // Filter venues based on search term and capacity
  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.venueLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.bookingType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOrganization = 
      organizationSearchTerm === "" || 
      (venue.organization?.organizationName?.toLowerCase().includes(organizationSearchTerm.toLowerCase()));

    const matchesCapacity = (() => {
      if (selectedCapacity === "Any capacity") return true

      const capacityString = selectedCapacity.replace(" people", "");
      if (capacityString.includes("Up to")) {
        const maxCapacity = parseInt(capacityString.replace("Up to ", ""));
        return venue.capacity <= maxCapacity;
      } else if (capacityString.includes("+")) {
        const minCapacity = parseInt(capacityString.replace("+", ""));
        return venue.capacity >= minCapacity;
      } else if (capacityString.includes("-")) {
        const [min, max] = capacityString.split("-").map(Number);
        return venue.capacity >= min && venue.capacity <= max;
      }
      return true;
    })();

    return matchesSearch && matchesOrganization && matchesCapacity && venue.status === "APPROVED"
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header activePage="venues" />

      <main className="flex-1">
        {/* Header Section with Animations */}
        <div className="bg-blue-50 py-16 overflow-hidden">
          <div className="container mx-auto px-16 max-w-7xl text-center">
            <h1
              className={`text-4xl font-bold mb-4 transform transition-all duration-1000 ease-out ${
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              {organizationId ? "Organization Venues" : "All Venues"}
            </h1>
            <p
              className={`text-gray-600 transform transition-all duration-1000 ease-out delay-200 ${
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
             Browse and book venues for your events — all on one easy-to-use platform.
            </p>
          </div>
        </div>

        {/* Search and Filters with Animation */}
        <div className="container mx-auto px-16 max-w-7xl py-8">
          <div
            className={`flex flex-col md:flex-row gap-4 items-center transform transition-all duration-1000 ease-out delay-400 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            {/* Capacity Dropdown */}
            <div className="relative z-40">
              <div
                className="relative w-full"
                onClick={() => setIsCapacityOpen(!isCapacityOpen)}
              >
                <input
                  type="text"
                  readOnly
                  value={selectedCapacity}
                  className="w-full pl-4 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer bg-white text-gray-700"
                />
                <ChevronDown
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform duration-200 ${isCapacityOpen ? "rotate-180" : ""}`}
                />
              </div>

              {isCapacityOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  <ul className="py-1">
                    {capacityOptions.map((option) => (
                      <li
                        key={option}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors duration-150"
                        onClick={() => handleCapacitySelect(option)}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

           
          </div>
        </div>

        {/* Venues Grid with Staggered Animation */}
        <div className="container mx-auto px-16 max-w-7xl pb-16 relative z-10">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading venues...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              {error.includes('Please log in') && (
                <Link href="/login" className="inline-block">
                  <Button>
                    Log In to View Venues
                  </Button>
                </Link>
              )}
            </div>
          ) : filteredVenues.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3  gap-8">
              {filteredVenues.map((venue, index) => (
                <Link
                  key={venue.venueId}
                  href={`/venues/${venue.venueId}`}
                  className={`bg-white border-2 border-blue-200 rounded-lg overflow-hidden shadow transform transition-all duration-700 ease-out hover:shadow-lg hover:-translate-y-1 ${
                    isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                  style={{
                    transitionDelay: `${600 + index * 100}ms`,
                  }}
                >
                  <div className="h-48 relative overflow-hidden b">
                    <Image
                      src={venue.mainPhotoUrl || "/placeholder.svg"}
                      alt={venue.venueName}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <span className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white rounded-full text-xs">
                      {venue.bookingType}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 transition-colors duration-200 hover:text-blue-600">
                      {venue.venueName}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                        <span>{venue.venueLocation}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-purple-600" />
                        <span>Capacity: {venue.capacity}</span>
                      </div>
                      {venue.organization && (
                        <div className="text-sm text-gray-600">
                          Organization: {venue.organization.organizationName}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {venue.amenities.slice(0, 3).map((amenity: Amenity) => (
                        <span
                          key={amenity.id}
                          className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded transition-colors duration-200 hover:bg-blue-100 hover:text-blue-800"
                          style={{
                            animationDelay: `${800 + index * 100}ms`,
                          }}
                        >
                          {amenity.resourceName} ({amenity.quantity})
                        </span>
                      ))}
                      {venue.amenities.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          +{venue.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200">
                      View Details
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900">No venues found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
