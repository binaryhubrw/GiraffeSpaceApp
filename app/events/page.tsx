"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronDown, Search, X } from "lucide-react"
import { Header } from "@/components/header"
import Footer from "@/components/footer"
import { EventCard } from "@/components/event-card"
import ApiService from "@/api/apiConfig"
import { Button } from "@/components/button"
import Link from "next/link"

export default function EventsPage() {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("All categories")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true);
    ApiService.getPubulishedEvents()
      .then((res) => {
        console.log('Events Page - Full Response:', res)
        if (res.success && Array.isArray(res.data)) {
          console.log('Events Page - All Events:', res.data)
          res.data.forEach((event: { eventPhoto: any }, index: number) => {
            console.log(`Events Page - Event ${index + 1} Photo:`, event.eventPhoto)
            console.log(`Events Page - Event ${index + 1} Photo Type:`, typeof event.eventPhoto)
          })
          setEvents(res.data)
        } else {
          setEvents([])
        }
        setError(null)
      })
      .catch((err) => {
        setError("Failed to load events.")
        setEvents([])
      })
      .finally(() => {
        setLoading(false)
        setTimeout(() => setIsLoaded(true), 100)
      })
  }, [])

  const categoryOptions = [
    "All categories",
    "CONFERENCE",
    "MEETING",
    "WEDDING",
    "WORKSHOP",
    "SEMINAR",
    "PARTY",
    "EXHIBITION"
  ]

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setIsCategoryOpen(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Select date"

    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatEventDate = (eventDate: string, startTime: string, endTime: string) => {
    const date = new Date(eventDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    const start = new Date(`2000-01-01T${startTime}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    const end = new Date(`2000-01-01T${endTime}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    return `${date} • ${start} - ${end}`
  }

  // Filter events based on search term, category, and date
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.eventDescription || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "All categories" || event.eventType === selectedCategory

    // Use first booking date for filtering
    const eventDate = event.bookingDates && event.bookingDates[0] ? event.bookingDates[0].date : ""
    const matchesDate = !selectedDate || eventDate === selectedDate

    // Location filtering
    const venue = event.eventVenues && event.eventVenues[0] && event.eventVenues[0].venue
    const location = venue ? venue.venueName + (venue.venueLocation ? ", " + venue.venueLocation : "") : ""
    const matchesLocation = !selectedLocation || location.toLowerCase().includes(selectedLocation.toLowerCase())

    return matchesSearch && matchesCategory && matchesDate && matchesLocation
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header activePage="events" />

      <main className="flex-1">
        {/* Header Section with Animations */}
        <div className="bg-blue-50 py-16 overflow-hidden">
          <div className="container mx-auto px-16 max-w-7xl text-center">
            <h1
              className={`text-4xl font-bold mb-4 transform transition-all duration-1000 ease-out ${
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              Events
            </h1>
            <p
              className={`text-gray-600 transform transition-all duration-1000 ease-out delay-200 ${
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              Discover and secure your spot at exciting upcoming events — effortlessly.
            </p>
          </div>
        </div>

        {/* Search and Filters with Animation */}
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
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
                         {/* Location Filter */}
              <div className="relative z-30">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by location or Venue Name ..."
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="pl-4 pr-8 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-[350px]"
                  />
                  {selectedLocation && (
                    <button
                      onClick={() => setSelectedLocation("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Clear location"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

            <div className="flex gap-4 w-full md:w-auto">
              {/* Category Dropdown */}
              <div className="relative z-30">
                <button
                  className="flex items-center justify-between gap-2 border rounded-md px-4 py-2 text-gray-700 bg-white min-w-[160px] hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                  <span>{selectedCategory}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isCategoryOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isCategoryOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                    <ul className="py-1">
                      {categoryOptions.map((option) => (
                        <li
                          key={option}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors duration-150"
                          onClick={() => handleCategorySelect(option)}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Date Picker */}
              <div className="relative z-30">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="date"
                    className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-[160px]"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    placeholder="Select date"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Clear date"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Events Grid with Staggered Animation */}
        <div className="container mx-auto px-16 max-w-7xl pb-16 relative z-10">
          {loading ? (
            <div className="text-center py-12">Loading events...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, index) => {
                // Map eventType to a color (customize as needed)
                let typeColor = "blue" // default color
                if (event.eventType === "CONFERENCE") typeColor = "red"
                else if (event.eventType === "MEETING") typeColor = "green"
                else if (event.eventType === "WEDDING") typeColor = "pink"
                else if (event.eventType === "WORKSHOP") typeColor = "purple"
                else if (event.eventType === "SEMINAR") typeColor = "indigo"
                else if (event.eventType === "PARTY") typeColor = "yellow"
                else if (event.eventType === "EXHIBITION") typeColor = "orange"

                                 // Use first venue if available
                 const venue = event.eventVenues && event.eventVenues[0] && event.eventVenues[0].venue
                 const location = venue ? venue.venueName + (venue.venueLocation ? ", " + venue.venueLocation : "") : ""
                 const imageSrc = event.eventPhoto || "/placeholder.svg"
                const date = event.bookingDates && event.bookingDates[0] ? event.bookingDates[0].date : ""

                return (
                  <div
                    key={event.eventId}
                    className={`transform transition-all duration-700 ease-out ${
                      isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    }`}
                    style={{
                      transitionDelay: `${600 + index * 100}ms`,
                    }}
                  >
                    <EventCard
                      id={event.eventId}
                      title={event.eventName}
                      type={event.eventType}
                      typeColor={typeColor}
                      date={date}
                      location={location}
                      registeredCount={event.registeredCount || 0}
                      imageSrc={imageSrc}
                      imageAlt={event.eventName}
                      isEntryPaid={event.isEntryPaid}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div
              className={`text-center py-12 transform transition-all duration-1000 ease-out delay-600 ${
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              <div className="text-gray-400 mb-4">
                <Calendar className="h-12 w-12 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900">No events found</h3>
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
