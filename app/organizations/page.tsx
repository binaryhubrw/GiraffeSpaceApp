"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Users, Calendar, MapPin, ChevronDown, ChevronUp } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("Type")

  useEffect(() => {
    fetch("https://giraffespacev2.onrender.com/api/v1/organizations/public")
      .then(res => res.json())
      .then(data => {
        setOrganizers(data.data)
        setIsLoaded(true)
      })
      .catch(() => setIsLoaded(true))
  }, [])

  const typeOptions = ["All Types", "Public", "NGOs", "Private"]

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setIsTypeOpen(false)
  }

  const toggleVenues = (orgId: string) => {
    setExpandedOrg(expandedOrg === orgId ? null : orgId)
  }

  const getTagClass = (type: string) => {
    switch (type.toLowerCase()) {
      case "public":
        return "bg-blue-50 text-blue-700"
      case "ngos":
        return "bg-green-50 text-green-700"
      case "private":
        return "bg-purple-50 text-purple-700"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header activePage="organizers" />

      <main className="flex-1">
        {/* Header Section with Animations */}
        <div className="bg-purple-50 py-16 overflow-hidden">
          <div className="container mx-auto px-16 max-w-7xl text-center">
            <h1
              className={`text-4xl font-bold mb-4 transform transition-all duration-1000 ease-out ${
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              All Organizations
            </h1>
            <p
              className={`text-gray-600 transform transition-all duration-1000 ease-out delay-200 ${
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              Manage your organizations and create new ones to organize events.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="container mx-auto px-16 max-w-7xl py-8 relative z-20">
          <div
            className={`flex flex-col md:flex-row gap-4 items-center transform transition-all duration-1000 ease-out delay-400 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search organizations..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            <div className="relative z-30">
              <button
                className="flex items-center justify-between gap-2 border rounded-md px-4 py-2 text-gray-700 bg-white min-w-[160px] hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsTypeOpen(!isTypeOpen)}
              >
                <Filter className="h-4 w-4 mr-1" />
                <span>{selectedType}</span>
                <Filter className="h-4 w-4 ml-auto" />
              </button>

              {isTypeOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  <ul className="py-1">
                    {typeOptions.map((option) => (
                      <li
                        key={option}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors duration-150"
                        onClick={() => handleTypeSelect(option)}
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

        {/* Organizations Grid */}
        <div className="container mx-auto px-16 max-w-7xl pb-16 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {organizers.map((org, index) => (
              <div
                key={org.organizationId}
                className={`bg-white rounded-lg overflow-hidden shadow transform transition-all duration-700 ease-out hover:shadow-lg hover:-translate-y-1 ${
                  isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{
                  transitionDelay: `${600 + index * 100}ms`,
                }}
              >
                <div className="h-48 relative flex items-center justify-center p-4 bg-white">
                  <img
                    src={org.logo || "/placeholder.svg"}
                    alt={org.organizationName}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded transition-colors duration-200 hover:scale-105 ${getTagClass(
                        org.organizationType
                      )}`}
                    >
                      {org.organizationType}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 transition-colors duration-200 hover:text-blue-600">
                    {org.organizationName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{org.description}</p>
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{org.venues.length} Venues</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{org.members} Members</span>
                    </div>
                  </div>

                  {/* Venue Toggle Button */}
                  {org.venues.length > 0 && (
                    <button
                      onClick={() => toggleVenues(org.organizationId)}
                      className="flex items-center justify-center w-full gap-2 py-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                      {expandedOrg === org.organizationId ? (
                        <>
                          Hide Venues <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Show Venues <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}

                  {/* Venues Section */}
                  {expandedOrg === org.organizationId && org.venues.length > 0 && (
                    <div className="mt-4 space-y-4 border-t pt-4 mb-4">
                      <h4 className="font-semibold text-gray-900">Available Venues</h4>
                      <div className="space-y-3">
                        {org.venues.map((venue: any) => (
                          <div key={venue.venueId} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">{venue.venueName}</h5>
                              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {venue.venueTypeId}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{venue.location}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                <span>Capacity: {venue.capacity} people</span>
                              </div>
                              {venue.virtualTourUrl && (
                                <a
                                  href={venue.virtualTourUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center"
                                >
                                  Virtual Tour
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <a
                    href={`/organizations/${org.organizationId}`}
                    className="block w-full text-center py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-all duration-200 hover:border-blue-300 hover:text-blue-600"
                  >
                    View Organization
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

