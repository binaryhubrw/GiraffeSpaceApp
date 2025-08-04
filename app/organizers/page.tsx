"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Users, Calendar } from "lucide-react"
import { Header } from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<any[]>([])
  const [filteredOrganizers, setFilteredOrganizers] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("All Types")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetch("https://giraffespacev2.onrender.com/api/v1/organizations/public")
      .then(res => res.json())
      .then(data => {
        setOrganizers(data.data)
        setFilteredOrganizers(data.data)
        setIsLoaded(true)
      })
      .catch(() => setIsLoaded(true))
  }, [])

  // Filter organizations based on search query and type
  useEffect(() => {
    let filtered = [...organizers]
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(org => 
        org.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply type filter
    if (selectedType !== "All Types") {
      filtered = filtered.filter(org => org.organizationType === selectedType)
    }
    
    setFilteredOrganizers(filtered)
  }, [searchQuery, selectedType, organizers])

  const typeOptions = ["All Types", "Public", "NGOs", "Private"]

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setIsTypeOpen(false)
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
              Our Organizations
            </h1>
            <p
              className={`text-gray-600 transform transition-all duration-1000 ease-out delay-200 ${
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              Manage your Organization and create new ones to organize events.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="container mx-auto px-16 max-w-7xl py-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search organizations..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border rounded-md"
                onClick={() => setIsTypeOpen(!isTypeOpen)}
              >
                <span>{selectedType}</span>
                <Filter className="h-4 w-4" />
              </button>
              {isTypeOpen && (
                <div className="absolute z-50 mt-1 w-48 bg-white border rounded-md shadow-lg">
                  {typeOptions.map((type) => (
                    <button
                      key={type}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                      onClick={() => handleTypeSelect(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Organizations Grid */}
        <div className="container mx-auto px-16 max-w-7xl pb-16">
          {filteredOrganizers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredOrganizers.map((org, index) => (
                <div
                  key={org.organizationId}
                  className={`bg-white rounded-lg overflow-hidden shadow transform transition-all duration-700 ease-out hover:shadow-lg ${
                    isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                  style={{ transitionDelay: `${600 + index * 100}ms` }}
                >
                  {/* Organization Card */}
                  <div className="p-6">
                    <div className="h-48 flex items-center justify-center mb-4">
                      <img
                        src={org.logo || "/placeholder.svg"}
                        alt={org.organizationName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">{org.organizationName}</h3>
                      <p className="text-gray-600 line-clamp-3">{org.description}</p>
                      <div className="flex justify-between text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{org.venues?.length || 0} venues</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{org.members || 0} members</span>
                        </div>
                      </div>

                      <Link
                        href={`/organizations/${org.organizationId}`}
                        className="block w-full text-center py-2 mt-4 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-all duration-200 hover:border-blue-300 hover:text-blue-600"
                      >
                        View Organization
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No organizations found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
