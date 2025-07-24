"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Users, Calendar, MapPin, Mail, Phone, Globe, ChevronLeft, ChevronDown } from "lucide-react"
import Link from "next/link"

export default function OrganizationDetailsPage() {
  const { id } = useParams()
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true)
      try {
        // Validate UUID format
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!id || typeof id !== 'string' || !uuidPattern.test(id)) {
          setOrganization(null);
          return;
        }

        const response = await fetch("https://giraffespacev2.onrender.com/api/v1/organizations/public")
        const data = await response.json()
        if (data && data.data) {
          const org = data.data.find((org: any) => org.organizationId === id)
          setOrganization(org || null)
        } else {
          setOrganization(null)
        }
      } catch (error) {
        console.error("Error fetching organization:", error)
        setOrganization(null)
      }
      setLoading(false)
    }

    fetchOrganization()
  }, [id])

  const scrollToVenues = () => {
    const venuesSection = document.getElementById('venues-section')
    if (venuesSection) {
      venuesSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header activePage="organizations" />

      <main className="flex-1">
        {/* Back Button */}
        <div className="bg-gray-50 py-3 sm:py-4">
          <div className="container-responsive">
            <Link href="/organizations" className="flex items-center text-gray-600 hover:text-gray-900">
              <ChevronLeft className="icon-sm mr-1" />
              <span>Back to Organizations</span>
            </Link>
          </div>
        </div>

        {loading ? (
          // Loading state
          <div className="container-responsive section-padding">
            <div className="flex-center flex-col gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
              <p className="text-body">Loading organization details...</p>
            </div>
          </div>
        ) : !organization ? (
          // Organization not found
          <div className="container-responsive section-padding text-center">
            <h2 className="heading-2 mb-4">Organization Not Found</h2>
            <p className="text-body mb-8">The organization you're looking for doesn't exist or has been removed.</p>
            <Link href="/organizations" className="btn-primary">
              Return to Organizations
            </Link>
          </div>
        ) : (
          <>
            {/* Header with logo and basic info */}
            <div className="bg-white border-b">
              <div className="container-responsive section-padding">
                <div className="flex-responsive gap-responsive items-center md:items-start">
                  <div className="image-container-md flex-center bg-white p-4 border rounded-lg">
                    <img
                      src={organization.logo || "/placeholder.svg"}
                      alt={organization.organizationName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                      <span className="badge-blue">
                        {organization.organizationType}
                      </span>
                    </div>

                    <h1 className="heading-1 mb-2">{organization.organizationName}</h1>
                    <p className="text-body mb-4">{organization.description}</p>

                    <div className="flex flex-wrap gap-4 sm:gap-6 text-small justify-center md:justify-start mb-4">
                      <div className="flex items-center">
                        <Users className="icon-sm mr-2 text-gray-400" />
                        <span>{organization.venues.length} venues</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="icon-sm mr-2 text-gray-400" />
                        <span>{organization.members} members</span>
                      </div>
                    </div>

                    {organization.venues.length > 0 && (
                      <button 
                        onClick={scrollToVenues}
                        className="btn-primary flex items-center gap-2"
                      >
                        View Venues <ChevronDown className="icon-sm" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="container-responsive section-padding">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column - About and Contact */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                  <div className="card-base card-padding">
                    <h2 className="heading-2 mb-4">About</h2>
                    <p className="text-body">{organization.description}</p>
                  </div>

                  <div className="card-base card-padding">
                    <h2 className="heading-2 mb-4">Contact Information</h2>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin className="icon-md mr-3 text-gray-400 mt-0.5" />
                        <span className="text-body">{organization.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="icon-md mr-3 text-gray-400" />
                        <a href={`mailto:${organization.contactEmail}`} className="text-body text-blue-600 hover:underline">
                          {organization.contactEmail}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <Phone className="icon-md mr-3 text-gray-400" />
                        <span className="text-body">{organization.contactPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column - Status Section */}
                <div>
                  <div className="card-base card-padding">
                    <h2 className="heading-2 mb-4">Organization Status</h2>
                    <div className="space-y-3">
                      <div className="flex-between">
                        <span className="text-body">Status</span>
                        <span className={`badge ${
                          organization.status === "APPROVED" 
                            ? "badge-green"
                            : "badge-blue"
                        }`}>
                          {organization.status}
                        </span>
                      </div>
                      <div className="flex-between">
                        <span className="text-body">Type</span>
                        <span className="badge-blue">
                          {organization.organizationType}
                        </span>
                      </div>
                      <div className="flex-between">
                        <span className="text-body">Members</span>
                        <span className="text-body">{organization.members}</span>
                      </div>
                      <div className="flex-between">
                        <span className="text-body">Venues</span>
                        <span className="text-body">{organization.venues.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Venues Section */}
            {organization.venues.length > 0 && (
              <div id="venues-section" className="bg-gray-50 py-16">
                <div className="container-responsive">
                  <div className="text-center mb-12">
                    <h2 className="heading-1 mb-4">Available Venues</h2>
                    <p className="text-body max-w-2xl mx-auto">
                      Explore our {organization.venues.length} venues available for your events. 
                      Each venue offers unique features and facilities to make your event successful.
                    </p>
                    <div className="mt-6">
                      <Link
                        href={`/venues?organizationId=${organization.organizationId}`}
                        className="btn-primary inline-flex items-center"
                      >
                        View All Organization Venues
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {organization.venues.slice(0, 3).map((venue: any) => (
                      <div key={venue.venueId} className="card-base bg-white">
                        {/* Venue Image */}
                        <div className="h-48 relative">
                          <img
                            src={venue.mainPhotoUrl || "/placeholder.svg"}
                            alt={venue.venueName}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 right-2 badge-blue">
                            {venue.venueTypeId}
                          </span>
                        </div>

                        {/* Venue Details */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-4">{venue.venueName}</h3>
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{venue.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-gray-400" />
                              <span>Capacity: {venue.capacity} people</span>
                            </div>
                          </div>
                          <Link
                            href={`/venues/${venue.venueId}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
