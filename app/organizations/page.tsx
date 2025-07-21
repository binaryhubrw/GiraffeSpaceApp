"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Users, Calendar } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header activePage="organizers" />

      <main className="flex-1">
        {/* Header Section */}
        <div className="bg-purple-50 section-padding">
          <div className="container-responsive text-center">
            <h1 className={`heading-1 mb-4 fade-in ${isLoaded ? 'fade-in-up' : 'fade-in-down'}`}>
              Our Organizations
            </h1>
            <p className={`text-body fade-in ${isLoaded ? 'fade-in-up' : 'fade-in-down'}`}>
              Manage your Organization and create new ones to organize events.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="container-responsive section-padding">
          <div className="flex-responsive gap-responsive">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 icon-sm" />
              <input
                type="text"
                placeholder="Search organizations..."
                className="input-base"
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <button
                className="btn-secondary w-full sm:w-auto flex items-center justify-between gap-2"
                onClick={() => setIsTypeOpen(!isTypeOpen)}
              >
                <span>{selectedType}</span>
                <Filter className="icon-sm" />
              </button>
              {isTypeOpen && (
                <div className="absolute z-50 mt-1 w-full sm:w-48 bg-white border rounded-md shadow-lg">
                  {typeOptions.map((type) => (
                    <button
                      key={type}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-body"
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
        <div className="container-responsive pb-8 sm:pb-12 lg:pb-16">
          <div className="grid-responsive">
            {organizers.map((org, index) => (
              <div
                key={org.organizationId}
                className={`card-base fade-in ${isLoaded ? 'fade-in-up' : 'fade-in-down'}`}
                style={{ transitionDelay: `${600 + index * 100}ms` }}
              >
                <div className="card-padding">
                  <div className="image-container-sm flex-center mb-4">
                    <img
                      src={org.logo || "/placeholder.svg"}
                      alt={org.organizationName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="heading-3 line-clamp-2">{org.organizationName}</h3>
                    <p className="text-body line-clamp-3">{org.description}</p>
                    <div className="flex-between">
                      <div className="flex items-center">
                        <Users className="icon-sm mr-2 text-gray-400" />
                        <span className="text-small">{org.venues.length} venues</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="icon-sm mr-2 text-gray-400" />
                        <span className="text-small">{org.members} members</span>
                      </div>
                    </div>

                    <Link
                      href={`/organizations/${org.organizationId}`}
                      className="btn-secondary block w-full text-center mt-4"
                    >
                      View Details
                    </Link>
                  </div>
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

